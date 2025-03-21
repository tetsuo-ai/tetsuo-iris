import React, { useEffect, useRef, memo } from "react";

export const DEFAULT_TRACK_URL =
    "https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3";

// Types for Webamp and Butterchurn (minimal subset)
interface Webamp {
    renderWhenReady: (container: HTMLElement) => Promise<void>;
    setTracksToPlay: (tracks: Track[]) => void;
    play: () => void;
    pause: () => void;
    __butterchurnVisualizer?: ButterchurnVisualizer;
}

interface ButterchurnVisualizer {
    setCanvas: (canvas: HTMLCanvasElement) => void;
    setRendererSize: (width: number, height: number) => void;
    render: () => void;
}

interface Track {
    metaData: { artist: string; title: string };
    url: string;
    duration: number;
}

// Load script utility with proper typing
const loadScript = (src: string, globalCheck: () => boolean, timeout = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            if (globalCheck()) return resolve();
            const start = Date.now();
            const checkInterval = setInterval(() => {
                if (globalCheck()) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() - start > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${src} global`));
                }
            }, 100);
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
            const start = Date.now();
            const checkInterval = setInterval(() => {
                if (globalCheck()) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() - start > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${src} global`));
                }
            }, 100);
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
};

// Singleton instance
let webampInstance: Webamp | null = null;

const initializeWebamp = async (
    container: HTMLElement,
    visualizerCanvas: HTMLCanvasElement,
    audio: HTMLAudioElement,
    onTrackDrop: (url: string) => void
): Promise<Webamp> => {
    if (webampInstance) return webampInstance;

    await loadScript("https://unpkg.com/webamp@1.5.0/built/webamp.bundle.min.js", () => !!((window as any).Webamp));
    await loadScript("https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js", () => !!((window as any).butterchurn));
    await loadScript("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js",
        () => !!((window as any).butterchurnPresets));

    const WebampConstructor = (window as any).Webamp as new (options: any) => Webamp;
    if (!WebampConstructor) throw new Error("Webamp constructor not found");

    const webamp = new WebampConstructor({
        initialTracks: [{
            metaData: { artist: "DJ Mike Llama", title: "Llama Whippin' Intro" },
            url: DEFAULT_TRACK_URL,
            duration: 5.322286,
        }],
        __butterchurnOptions: {
            importButterchurn: () => Promise.resolve((window as any).butterchurn),
            getPresets: () => {
                const presets = (window as any).butterchurnPresets.getPresets();
                return Object.keys(presets).map((name: string) => ({
                    name,
                    butterchurnPresetObject: presets[name],
                }));
            },
            butterchurnOpen: true,
        },
        windowLayout: {
            main: { position: { top: 50, left: 50 } },
            equalizer: { position: { top: 166, left: 50 } },
            playlist: { position: { top: 282, left: 50 }, size: { extraWidth: 0, extraHeight: 4 } },
            milkdrop: { position: { top: 50, left: 325 } },
        },
    });

    await webamp.renderWhenReady(container);

    const muteWebampAudio = () => {
        document.querySelectorAll("audio").forEach((el) => {
            if (el !== audio) {
                el.muted = true;
                el.pause();
            }
        });
    };
    muteWebampAudio();

    audio.src = DEFAULT_TRACK_URL;
    audio.load();

    const originalSetTracks = webamp.setTracksToPlay;
    webamp.setTracksToPlay = (tracks: Track[]) => {
        originalSetTracks.call(webamp, tracks);
        const newTrack = tracks[0];
        if (newTrack?.url) {
            onTrackDrop(newTrack.url);
            muteWebampAudio();
        }
    };

    const butterchurnVisualizer = webamp.__butterchurnVisualizer;
    if (butterchurnVisualizer && visualizerCanvas) {
        butterchurnVisualizer.setCanvas(visualizerCanvas);
        const dpr = window.devicePixelRatio || 1;
        butterchurnVisualizer.setRendererSize(window.innerWidth * dpr, window.innerHeight * dpr);
    }

    webampInstance = webamp;
    (window as any).sharedAudioElement = audio;
    return webamp;
};

export interface WebampMilkdropProps {
    onTrackDrop: (url: string) => void;
    isPlaying: boolean;
    onPlayPause: () => void;
    onStop: () => void;
    onReady?: () => void;
    visualizerCanvasRef?: React.RefObject<HTMLCanvasElement>;
}

export const WebampMilkdrop: React.FC<WebampMilkdropProps> = memo(
    ({ onTrackDrop, isPlaying, onPlayPause, onStop, onReady, visualizerCanvasRef }) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const audioRef = useRef<HTMLAudioElement>((window as any).sharedAudioElement || new Audio());

        useEffect(() => {
            if (!containerRef.current || !visualizerCanvasRef?.current) return;

            initializeWebamp(containerRef.current, visualizerCanvasRef.current, audioRef.current, onTrackDrop)
                .then((webamp) => {
                    if (onReady) onReady();
                    const render = () => {
                        if (webamp.__butterchurnVisualizer && isPlaying) {
                            webamp.__butterchurnVisualizer.render();
                        }
                        requestAnimationFrame(render);
                    };
                    requestAnimationFrame(render);
                })
                .catch((error) => console.error("Webamp initialization failed:", error));

            return () => {
                // Cleanup logic if needed
            };
        }, [onTrackDrop, onReady, visualizerCanvasRef]);

        useEffect(() => {
            if (!webampInstance) return;

            if (isPlaying) {
                audioRef.current.play().catch((e) => console.error("Play error:", e));
                webampInstance.play();
            } else {
                audioRef.current.pause();
                webampInstance.pause();
            }

            const handlePlayPause = () => (isPlaying ? onPlayPause() : onPlayPause());
            const handleStop = () => onStop();

            audioRef.current.addEventListener("play", handlePlayPause);
            audioRef.current.addEventListener("pause", handlePlayPause);
            audioRef.current.addEventListener("ended", handleStop);

            return () => {
                audioRef.current.removeEventListener("play", handlePlayPause);
                audioRef.current.removeEventListener("pause", handlePlayPause);
                audioRef.current.removeEventListener("ended", handleStop);
            };
        }, [isPlaying, onPlayPause, onStop]);

        return (
            <div
                ref={containerRef}
                id="webamp-container"
                className="absolute top-[27%] left-[8%] translate-x-[-50%] translate-y-[-50%] z-10 bg-transparent"
            />
        );
    },
    (prevProps, nextProps) => (
        prevProps.isPlaying === nextProps.isPlaying &&
        prevProps.onTrackDrop === nextProps.onTrackDrop &&
        prevProps.onPlayPause === nextProps.onPlayPause &&
        prevProps.onStop === nextProps.onStop &&
        prevProps.onReady === nextProps.onReady &&
        prevProps.visualizerCanvasRef === nextProps.visualizerCanvasRef
    )
);