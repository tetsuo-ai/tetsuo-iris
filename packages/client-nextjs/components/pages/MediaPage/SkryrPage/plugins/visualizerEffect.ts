import { useEffect, useRef } from "react";

const loadScript = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
        if (typeof document !== "undefined" && document.querySelector(`script[src="${src}"]`)) {
            console.log(`Script already loaded: ${src}`);
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
            console.log(`Script loaded successfully: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(script);
    });

export const useVisualizerEffect = (
    visualizerEnabled: boolean,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    audioContext: AudioContext | null,
    analyser: AnalyserNode | null,
    isFullscreen: boolean,
    isPlaying: boolean
) => {
    const visualizerRef = useRef<any>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const isInitializedRef = useRef(false);
    const lastRenderRef = useRef(0);

    // Preload scripts once on mount
    useEffect(() => {
        const preloadScripts = async () => {
            try {
                await loadScript("https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js");
                await loadScript("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js");
                console.log("Butterchurn scripts preloaded");
            } catch (error) {
                console.error("Error preloading Butterchurn scripts:", error);
            }
        };
        preloadScripts();
    }, []);

    // Initialize visualizer only once
    useEffect(() => {
        if (!visualizerEnabled || !canvasRef.current || !audioContext || !analyser || isInitializedRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            if (visualizerRef.current) {
                visualizerRef.current.setRendererSize(width * dpr, height * dpr);
            }
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const setupVisualizer = async () => {
            const bc = (window as any).butterchurn?.default || (window as any).butterchurn;
            const bcPresets = (window as any).butterchurnPresets?.default || (window as any).butterchurnPresets;
            if (!bc || !bcPresets) {
                console.error("Butterchurn or presets not loaded");
                return;
            }

            visualizerRef.current = bc.createVisualizer(audioContext, canvas, {
                smoothing: 0.8,
                brightness: 0.5,
                width: canvas.width,
                height: canvas.height,
            });

            console.log("Visualizer initialized with analyser in chain");
            isInitializedRef.current = true;

            const presets = bcPresets.getPresets();
            if (presets && presets["Flexi"]) {
                visualizerRef.current.loadPreset(presets["Flexi"]);
                console.log("Loaded Flexi preset");
            } else if (presets && Object.keys(presets).length > 0) {
                const firstPresetName = Object.keys(presets)[0];
                visualizerRef.current.loadPreset(presets[firstPresetName]);
                console.log("Loaded default preset:", firstPresetName);
            }
        };

        setupVisualizer();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [visualizerEnabled, canvasRef, audioContext, analyser]);

    // Optimized rendering loop
    useEffect(() => {
        if (!visualizerEnabled || !visualizerRef.current || !isPlaying) return;

        const render = () => {
            const now = performance.now();
            if (now - lastRenderRef.current < 16) { // Throttle to ~60fps
                animationFrameIdRef.current = requestAnimationFrame(render);
                return;
            }
            lastRenderRef.current = now;

            const start = performance.now();
            visualizerRef.current.render();
            const duration = performance.now() - start;
            if (duration > 50) console.warn(`Visualizer render took ${duration}ms`);

            animationFrameIdRef.current = requestAnimationFrame(render);
        };
        animationFrameIdRef.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [visualizerEnabled, isPlaying]);
};