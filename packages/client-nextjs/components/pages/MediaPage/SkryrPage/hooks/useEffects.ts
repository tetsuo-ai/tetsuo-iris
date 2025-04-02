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

    useEffect(() => {
        const setupAudio = async () => {
            if (!audioContext) {
                console.log("No audioContext provided yet");
                return;
            }

            if (audioContext.state === "suspended") {
                await audioContext.resume();
                console.log("AudioContext resumed");
            }

            analyserRef.current = (window as any).sharedAnalyser || audioContext.createAnalyser();
            analyserRef.current.fftSize = 256;
            console.log("Analyser setup with provided audioContext");
        };

        setupAudio().catch((error) => console.error("Audio setup error:", error));
    }, [audioContext]);

    useMatrixEffect(matrixEnabled, matrixCanvasRef, isFullscreen);
    useVisualizerEffect(
        visualizerEnabled,
        visualizerCanvasRef,
        audioContext,
        analyserRef.current ?? null, // Null check
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

    useEffect(() => {
        console.log("Matrix props:", {
            matrixEnabled,
            isFullscreen,
            canvasExists: !!matrixCanvasRef.current,
        });
    }, [matrixEnabled, isFullscreen, matrixCanvasRef]);

    return { computedColor, analyserRef: analyserRef.current };
};