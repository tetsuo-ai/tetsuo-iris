"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
const loadScript = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            console.log(`Script already loaded: ${src}`);
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });

const DEFAULT_TRACK_URL =
    "https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3";

interface WinampPageProps {
    onAudioDataUpdate?: (data: Uint8Array) => void;
    onToggleFullscreen?: () => void;
}

const WinampPage: React.FC<WinampPageProps> = ({ onAudioDataUpdate, onToggleFullscreen }) => {
    const winampContainerRef = useRef<HTMLDivElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const webampRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);
    const [micPermissionGranted, setMicPermissionGranted] = useState(false);

    const computedColor = "#00ff00"; // Assuming this is your color scheme; adjust if passed as prop

    const startRenderLoop = () => {
        const renderLoop = () => {
            if (analyserRef.current && onAudioDataUpdate) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                onAudioDataUpdate(data);
            }
            animationRef.current = window.requestAnimationFrame(renderLoop);
        };
        animationRef.current = window.requestAnimationFrame(renderLoop);
    };

    const stopRenderLoop = () => {
        if (animationRef.current) {
            window.cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };

    const requestMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
                video: false,
            });

            audioCtxRef.current = new AudioContext();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioCtxRef.current.destination);
            console.log("Connected analyser to microphone audio feed.");

            startRenderLoop();
            setMicPermissionGranted(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied. Please allow microphone permissions in your browser settings to enable audio visualization.");
        }
    };

    useEffect(() => {
        async function initPlayer() {
            try {
                await loadScript("https://unpkg.com/webamp@1.5.0/built/webamp.bundle.min.js");

                const WebampConstructor = (window as any).Webamp;
                if (typeof WebampConstructor !== "function") {
                    console.error("Webamp constructor not found on window.");
                    return;
                }

                const webamp = new WebampConstructor({
                    initialTracks: [{
                        metaData: {
                            artist: "DJ Mike Llama",
                            title: "Llama Whippin' Intro",
                        },
                        url: DEFAULT_TRACK_URL,
                        duration: 5.322286,
                    }],
                    enableHotkeys: true,
                    zIndex: 2,
                    __initialWindowLayout: {
                        main: { position: { x: 0, y: 0 } },
                        equalizer: { position: { x: -1000, y: -1000 } },
                        playlist: { position: { x: -1000, y: -1000 } },
                    },
                });
                webampRef.current = webamp;
                (window as any).webampInstance = webamp;

                if (winampContainerRef.current) {
                    await webamp.renderWhenReady(winampContainerRef.current);
                    console.log("Webamp rendered successfully.");
                } else {
                    console.error("Winamp container not found.");
                    return;
                }

                webamp.onTrackDidChange((trackInfo: any) => {
                    if (!trackInfo) {
                        stopRenderLoop();
                    } else if (!animationRef.current && micPermissionGranted) {
                        startRenderLoop();
                    }
                });
            } catch (err) {
                console.error("Error initializing player:", err);
            }
        }

        initPlayer();

        return () => {
            stopRenderLoop();
            if (webampRef.current) {
                webampRef.current.dispose();
                webampRef.current = null;
                (window as any).webampInstance = null;
            }
            if (sourceRef.current) {
                sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(err => console.warn("AudioContext close failed:", err));
                audioCtxRef.current = null;
            }
        };
    }, [micPermissionGranted]);

    return (
        <>
            <style jsx>{`
                .container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .mic-prompt {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: ${computedColor};
                    padding: 20px;
                    border-radius: 8px;
                    border: 2px solid ${computedColor};
                    z-index: 10; /* Above workspace elements (zIndex 5) */
                    text-align: center;
                    font-family: monospace;
                }
                .mic-prompt button {
                    background-color: rgba(0, 0, 0, 0.8);
                    color: ${computedColor};
                    border: 1px solid ${computedColor};
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s ease-in-out;
                }
                .mic-prompt button:hover {
                    background-color: rgba(50, 50, 50, 0.8);
                }
            `}</style>
            <div className="container">
                <div
                    ref={winampContainerRef}
                    id="webamp"
                    role="application"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 2,
                    }}
                />
                {!micPermissionGranted && (
                    <div className="mic-prompt">
                        <p>Enable microphone to visualize system audio:</p>
                        <Button onClick={requestMicPermission} style={{ marginTop: "10px" }}>
                            Allow Microphone Access
                        </Button>
                        <p style={{ marginTop: "10px", fontSize: "0.9em" }}>
                            Tip: Loop system audio to your microphone in sound settings for Webamp visualization.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default WinampPage;