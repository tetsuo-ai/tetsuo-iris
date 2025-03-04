import { useEffect, useRef } from "react";

export const useTestVisualizerEffect = (
    visualizerEnabled: boolean,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    audioData: Uint8Array,
    isFullscreen: boolean,
    isPlaying: boolean,
    computedColor: string
) => {
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!visualizerEnabled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight; // Fixed height for test visualizer bars
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            if (ctx.resetTransform) {
                ctx.resetTransform();
            } else {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            ctx.scale(dpr, dpr);
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas as unknown as EventListener);

        const renderBars = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.width / dpr;
            const height = 50; // Fixed height
            ctx.clearRect(0, 0, width, height);
            if (isPlaying && audioData && audioData.length) {
                const barWidth = width / audioData.length;
                const barHeightScale = height / 255;
                for (let i = 0; i < audioData.length; i++) {
                    const value = audioData[i];
                    const barHeight = value * barHeightScale;
                    ctx.fillStyle = computedColor;
                    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
                }
            }
            animationFrameIdRef.current = requestAnimationFrame(renderBars);
        };

        animationFrameIdRef.current = requestAnimationFrame(renderBars);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            window.removeEventListener("resize", resizeCanvas as unknown as EventListener);
            const dprCleanup = window.devicePixelRatio || 1;
            const width = canvas.width / dprCleanup;
            ctx.clearRect(0, 0, width, 50);
        };
    }, [visualizerEnabled, audioData, isFullscreen, isPlaying, computedColor]);
};