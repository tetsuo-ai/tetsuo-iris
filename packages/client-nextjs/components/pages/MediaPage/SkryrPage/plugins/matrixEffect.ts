// useMatrixEffect.ts
import { useEffect, useRef } from "react";

export const useMatrixEffect = (
    matrixEnabled: boolean,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    isFullscreen: boolean
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

        const fontSize = 22;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        const particles = Array(50).fill(0).map(() => ({
            x: width / 2,
            y: height / 2,
            angle: Math.random() * Math.PI * 2,
            radius: Math.random() * Math.min(width, height) / 4,
            speed: 0.5,
            char: String.fromCharCode(33 + Math.random() * 94),
            alpha: 1,
            trail: [] as { x: number; y: number; alpha: number }[],
            mode: Math.floor(Math.random() * 3)
        }));

        const renderMatrix = (timestamp: number) => {
            if (timestamp - lastFrameTimeRef.current < 16.67) {
                animationFrameIdRef.current = requestAnimationFrame(renderMatrix);
                return;
            }
            lastFrameTimeRef.current = timestamp;

            ctx.clearRect(0, 0, width, height);

            ctx.font = `${fontSize}px monospace`;

            particles.forEach((particle) => {
                let newX = particle.x;
                let newY = particle.y;

                switch (particle.mode) {
                    case 0: // Orbit
                        particle.angle += particle.speed / fontSize;
                        newX = width / 2 + Math.cos(particle.angle) * particle.radius;
                        newY = height / 2 + Math.sin(particle.angle) * particle.radius;
                        break;
                    case 1: // Wave
                        particle.angle += particle.speed / fontSize;
                        newX = particle.x + Math.sin(particle.angle) * 20;
                        newY = particle.y + Math.cos(particle.angle * 2) * particle.radius * 0.5;
                        if (newY > height || newY < 0) particle.y = height / 2;
                        break;
                    case 2: // Spiral
                        particle.angle += particle.speed / fontSize;
                        particle.radius *= 0.995;
                        newX = width / 2 + Math.cos(particle.angle) * particle.radius;
                        newY = height / 2 + Math.sin(particle.angle) * particle.radius;
                        if (particle.radius < 10) {
                            particle.radius = Math.min(width, height) / 4;
                            particle.angle = Math.random() * Math.PI * 2;
                        }
                        break;
                }

                particle.x = newX;
                particle.y = newY;

                particle.trail.unshift({ x: particle.x, y: particle.y, alpha: particle.alpha });
                if (particle.trail.length > 15) particle.trail.pop();

                particle.trail.forEach((trailPos, index) => {
                    const trailAlpha = trailPos.alpha * (1 - index / 15);
                    ctx.fillStyle = `rgba(0, 255, 0, ${trailAlpha})`;
                    ctx.fillText(particle.char, trailPos.x, trailPos.y);
                });

                if (Math.random() < 0.02) {
                    particle.char = String.fromCharCode(33 + Math.random() * 94);
                }

                if (particle.x < 0 || particle.x > width) particle.x = width / 2;
                if (particle.y < 0 || particle.y > height) particle.y = height / 2;
            });

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
    }, [matrixEnabled, isFullscreen]);
};