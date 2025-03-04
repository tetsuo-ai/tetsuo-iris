import { useEffect, useRef } from "react";

export const useMatrixEffect = (
    matrixEnabled: boolean,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    audioData: Uint8Array,
    isFullscreen: boolean,
    isPlaying: boolean
) => {
    const animationFrameIdRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!matrixEnabled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.scale(dpr, dpr);
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const fontSize = 16;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        const columns = Math.floor(width / fontSize);
        const drops = Array(columns)
            .fill(0)
            .map(() => ({
                y: Math.random() * height / fontSize,
                alpha: 1,
                life: 60 + Math.random() * 40,
            }));

        const commonLyrics = ["SKRYR", "TETSUO", "SYSTEM ONLINE"];
        const rareLyrics = ["Neon hums", "Press play"];
        let activeLyrics: { text: string; x: number; y: number; life: number; alpha: number }[] = [];
        const lyricDuration = 44;
        const baseFallSpeed = 0.5;
        let lastCommonLyricTime = Date.now();
        let lastRareLyricTime = Date.now();

        const getBoundedX = (text: string): number => {
            const textWidth = ctx.measureText(text).width;
            return Math.max(0, Math.min(width - textWidth, Math.random() * (width - textWidth)));
        };

        const getBoundedY = (): number => Math.max(fontSize, Math.random() * (height - fontSize * 2));

        const getAudioIntensity = (): number => {
            if (!audioData.length) return 0;
            const average = audioData.reduce((a, b) => a + b, 0) / audioData.length;
            return average / 255;
        };

        const renderMatrix = (timestamp: number) => {
            if (timestamp - lastFrameTimeRef.current < 16.67) {
                animationFrameIdRef.current = requestAnimationFrame(renderMatrix);
                return;
            }
            lastFrameTimeRef.current = timestamp;

            const audioIntensity = getAudioIntensity();

            ctx.clearRect(0, 0, width, height); // Ensure full transparency
            // console.log("Matrix canvas cleared"); // Debug log

            ctx.font = `${fontSize}px monospace`;
            const fallSpeed = baseFallSpeed + audioIntensity * 1.5;

            for (let i = 0; i < drops.length; i++) {
                if (drops[i].alpha > 0) {
                    const text = String.fromCharCode(33 + Math.random() * 94);
                    const dynamicAlpha = Math.max(drops[i].alpha, audioIntensity);
                    ctx.fillStyle = `rgba(0, 255, 0, ${dynamicAlpha})`;
                    ctx.fillText(text, i * fontSize, drops[i].y * fontSize);

                    drops[i].y += fallSpeed;
                    drops[i].life--;
                    drops[i].alpha = Math.max(0, drops[i].life / 60);

                    if (drops[i].life <= 0 || drops[i].y * fontSize > height) {
                        drops[i].y = 0;
                        drops[i].alpha = 1;
                        drops[i].life = 60 + Math.random() * 40;
                    }
                }
            }

            activeLyrics.forEach((lyric) => {
                lyric.alpha = Math.max(0, lyric.life / lyricDuration) * (1 + audioIntensity);
                ctx.fillStyle = `rgba(0, 255, 0, ${lyric.alpha})`;
                ctx.fillText(lyric.text, lyric.x, lyric.y);
                lyric.life--;
            });

            activeLyrics = activeLyrics.filter((lyric) => lyric.life > 0);

            const now = Date.now();
            if (activeLyrics.length < 3 && isPlaying) {
                if (now - lastCommonLyricTime > 3000 + Math.random() * 3000) {
                    lastCommonLyricTime = now;
                    const text = commonLyrics[Math.floor(Math.random() * commonLyrics.length)];
                    activeLyrics.push({ text, x: getBoundedX(text), y: getBoundedY(), life: lyricDuration, alpha: 1 });
                }
                if (now - lastRareLyricTime > 8000 + Math.random() * 7000) {
                    lastRareLyricTime = now;
                    const text = rareLyrics[Math.floor(Math.random() * rareLyrics.length)];
                    activeLyrics.push({ text, x: getBoundedX(text), y: getBoundedY(), life: lyricDuration, alpha: 1 });
                }
            }

            animationFrameIdRef.current = requestAnimationFrame(renderMatrix);
        };

        animationFrameIdRef.current = requestAnimationFrame(renderMatrix);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            window.removeEventListener("resize", resizeCanvas);
            if (ctx) {
                ctx.clearRect(0, 0, width, height);
            }
        };
    }, [matrixEnabled, audioData, isFullscreen, isPlaying]);
};