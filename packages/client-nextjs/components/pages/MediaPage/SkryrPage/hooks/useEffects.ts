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
                return; // Silently wait for audioContext
            }

            if (audioContext.state === "suspended") {
                await audioContext.resume();
                console.log("AudioContext resumed");
            }

            analyserRef.current = (window as any).sharedAnalyser;
            console.log("AudioContext state:", audioContext.state);
        };

        setupAudio();
    }, [audioContext]);

    useVisualizerEffect(
        visualizerEnabled,
        visualizerCanvasRef,
        audioContext,
        analyserRef.current,
        isFullscreen,
        isPlaying
    );
    useMatrixEffect(matrixEnabled, matrixCanvasRef, audioData, isFullscreen, isPlaying);
    useTestVisualizerEffect(
        visualizerEnabled,
        barCanvasRef,
        audioData,
        isFullscreen,
        isPlaying,
        computedColor
    );

    return { computedColor, analyserRef: analyserRef.current };
};