import { useEffect, useRef } from "react";
import { useMatrixEffect } from "../plugins/matrixEffect";
import { useVisualizerEffect } from "../plugins/visualizerEffect";
import { useTestVisualizerEffect } from "../plugins/testVisualizerEffect";

interface UseEffectsProps {
    matrixEnabled: boolean;
    visualizerEnabled: boolean;
    matrixCanvasRef: React.RefObject<HTMLCanvasElement>;
    visualizerCanvasRef: React.RefObject<HTMLCanvasElement>;
    barCanvasRef: React.RefObject<HTMLCanvasElement>;
    audioContext: AudioContext | null;
    audioData: Uint8Array;
    isFullscreen: boolean;
    isPlaying: boolean;
    computedColor: string;
}

export const useEffects = ({
    matrixEnabled,
    visualizerEnabled,
    matrixCanvasRef,
    visualizerCanvasRef,
    barCanvasRef,
    audioContext,
    audioData,
    isFullscreen,
    isPlaying,
    computedColor,
}: UseEffectsProps) => {
    const analyserRef = useRef<AnalyserNode | null>(null);

    // Setup analyser only once when audioContext is available
    useEffect(() => {
        if (!audioContext || analyserRef.current) return;

        const setupAudio = async () => {
            // Use shared analyser if available, otherwise create a new one
            analyserRef.current = (window as any).sharedAnalyser || audioContext.createAnalyser();
            analyserRef.current.fftSize = 256;
            console.log("Analyser setup with provided audioContext");

            // Resume context only if suspended
            if (audioContext.state === "suspended") {
                await audioContext.resume();
                console.log("AudioContext resumed");
            }
        };

        setupAudio().catch((error) => console.error("Audio setup error:", error));
    }, [audioContext]);

    // Apply effects with their respective hooks
    useMatrixEffect(matrixEnabled, matrixCanvasRef, isFullscreen);
    useVisualizerEffect(
        visualizerEnabled,
        visualizerCanvasRef,
        audioContext,
        analyserRef.current, // No null check needed; TypeScript knows it’s AnalyserNode | null
        isFullscreen,
        isPlaying
    );
    useTestVisualizerEffect(
        visualizerEnabled,
        barCanvasRef,
        audioData,
        isFullscreen,
        isPlaying,
        computedColor
    );

    // Debug logging for matrix effect (optional, can be removed in production)
    useEffect(() => {
        console.log("Matrix props:", {
            matrixEnabled,
            isFullscreen,
            canvasExists: !!matrixCanvasRef.current,
        });
    }, [matrixEnabled, isFullscreen, matrixCanvasRef]);

    return { computedColor, analyserRef: analyserRef.current };
};