import React, { useEffect, useRef, memo } from "react";

export const DEFAULT_TRACK_URL =
    "https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3";

const loadScript = (src: string, globalCheck: () => boolean, timeout = 10000): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            console.log(`Script already loaded: ${src}`);
            if (globalCheck()) resolve();
            else {
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
            }
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
            console.log(`Loaded script: ${src}`);
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

let webampInstance: any = null;

const initializeWebamp = async (
    container: HTMLElement,
    visualizerCanvas: HTMLCanvasElement,
    audio: HTMLAudioElement,
    onTrackDrop: (url: string) => void
) => {
    if (webampInstance) return webampInstance;

    await loadScript("https://unpkg.com/webamp@1.5.0/built/webamp.bundle.min.js", () => !!((window as any).Webamp));
    await loadScript("https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js", () => !!((window as any).butterchurn));
    await loadScript("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js", () => !!((window as any).butterchurnPresets));

    const Webamp = (window as any).Webamp;
    if (!Webamp) throw new Error("Webamp constructor not found");

    const webamp = new Webamp({
        initialTracks: [
            {
                metaData: { artist: "DJ Mike Llama", title: "Llama Whippin' Intro" },
                url: DEFAULT_TRACK_URL,
                duration: 5.322286,
            },
        ],
        __butterchurnOptions: {
            importButterchurn: () => Promise.resolve((window as any).butterchurn),
            getPresets: () => {
                const presets = (window as any).butterchurnPresets.getPresets();
                return Object.keys(presets).map((name) => ({
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
            milkdrop: { position: { top: 50, left: 325 } }, // Visible by default, next to playlist
        },
    });

    await webamp.renderWhenReady(container);
    console.log("Webamp rendered");

    const muteWebampAudio = () => {
        const allAudioElements = document.querySelectorAll("audio");
        allAudioElements.forEach((el) => {
            if (el !== audio) {
                el.muted = true;
                el.pause();
                console.log("Muted Webamp’s internal audio element:", el.src);
            }
        });
    };
    muteWebampAudio();

    audio.src = DEFAULT_TRACK_URL;
    audio.load();

    const originalSetTracks = webamp.setTracksToPlay;
    webamp.setTracksToPlay = (tracks: any[]) => {
        originalSetTracks.call(webamp, tracks);
        const newTrack = tracks[0];
        if (newTrack && newTrack.url) {
            onTrackDrop(newTrack.url);
            muteWebampAudio();
        }
    };

    const butterchurnVisualizer = webamp.__butterchurnVisualizer;
    if (butterchurnVisualizer && visualizerCanvas) {
        butterchurnVisualizer.setCanvas?.(visualizerCanvas);
        const dpr = window.devicePixelRatio || 1;
        butterchurnVisualizer.setRendererSize?.(window.innerWidth * dpr, window.innerHeight * dpr);
        console.log("Butterchurn redirected to external canvas");
    } else {
        console.error("ButterchurnVisualizer not found or canvas missing");
    }

    webampInstance = webamp;
    (window as any).sharedAudioElement = audio;
    return webamp;
};

interface WebampMilkdropProps {
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

        useEffect(() => {
            if (!containerRef.current || !visualizerCanvasRef?.current) return;

            const audio = (window as any).sharedAudioElement as HTMLAudioElement;
            if (!audio) {
                console.error("Shared audio element not found");
                return;
            }

            initializeWebamp(containerRef.current, visualizerCanvasRef.current, audio, onTrackDrop)
                .then((webamp) => {
                    if (onReady) onReady();
                    // console.log("Webamp initialized");

                    const render = () => {
                        if (webamp.__butterchurnVisualizer && isPlaying) {
                            webamp.__butterchurnVisualizer.render();
                        }
                        requestAnimationFrame(render);
                    };
                    requestAnimationFrame(render);
                })
                .catch((error) => console.error("Webamp initialization failed:", error));
        }, [onTrackDrop, onReady, visualizerCanvasRef]);

        useEffect(() => {
            const audio = (window as any).sharedAudioElement as HTMLAudioElement;
            if (audio && webampInstance) {
                if (isPlaying) {
                    audio.play().catch((e) => console.error("Play error:", e));
                    webampInstance.play();
                } else {
                    audio.pause();
                    webampInstance.pause();
                }
            }
        }, [isPlaying]);

        return (
            <div
                ref={containerRef}
                id="webamp-container"
                style={{
                    position: "absolute",
                    top: "27%",
                    left: "8%",
                    transform: "translate(-50%, -50%)",
                    width: "auto",
                    height: "auto",
                    zIndex: 10,
                    background: "transparent",
                }}
            />
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.isPlaying === nextProps.isPlaying &&
            prevProps.onTrackDrop === nextProps.onTrackDrop &&
            prevProps.onPlayPause === nextProps.onPlayPause &&
            prevProps.onStop === nextProps.onStop &&
            prevProps.onReady === nextProps.onReady &&
            prevProps.visualizerCanvasRef === nextProps.visualizerCanvasRef
        );
    }
);