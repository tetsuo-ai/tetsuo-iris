"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTestVisualizerEffect } from "../SkryrPage/plugins/testVisualizerEffect";
import { DEFAULT_TRACK_URL } from "../SkryrPage/WebampMilkdrop";
// import { DEFAULT_TRACK_URL } from "../SkryrPage/WinampLite";

const WinampPage: React.FC<{
    onAudioDataUpdate?: (data: Uint8Array) => void;
    onToggleFullscreen?: () => void;
}> = ({ onAudioDataUpdate, onToggleFullscreen }) => {
    const winampContainerRef = useRef<HTMLDivElement>(null);
    const barCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(32));
    const [audioProgress, setAudioProgress] = useState(0);
    const computedColor = "#00ff00";

    useEffect(() => {
        async function initPlayer() {
            if (!winampContainerRef.current) return;
            try {
                await getSharedWebamp(winampContainerRef.current, DEFAULT_TRACK_URL);
                const audio = (window as any).sharedAudioElement as HTMLAudioElement;
                audio.addEventListener("timeupdate", () => {
                    if (audio.duration && audio.duration > 0) {
                        setAudioProgress(audio.currentTime / audio.duration);
                    }
                });
                audio.onplay = () => {
                    console.log("Audio started");
                    setIsPlaying(true);
                };
                audio.onpause = () => {
                    console.log("Audio paused");
                    setIsPlaying(false);
                };
                audio.onended = () => {
                    console.log("Audio ended");
                    setIsPlaying(false);
                };
                await audio.play();
                console.log("Audio play triggered");
                setIsPlaying(true);
            } catch (err) {
                console.error("Error initializing player:", err);
            }
        }
        initPlayer();
    }, []);

    useEffect(() => {
        const analyser = (window as any).sharedAnalyser;
        if (!analyser) return;
        let rafId: number;
        const updateAudioData = () => {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            setAudioData(data);
            if (onAudioDataUpdate) onAudioDataUpdate(data);
            rafId = requestAnimationFrame(updateAudioData);
        };
        rafId = requestAnimationFrame(updateAudioData);
        return () => cancelAnimationFrame(rafId);
    }, [isPlaying, onAudioDataUpdate]);

    useTestVisualizerEffect(true, barCanvasRef, audioData, false, isPlaying, computedColor);

    const handlePlayPause = useCallback(() => {
        const audio = (window as any).sharedAudioElement as HTMLAudioElement;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch((e) => console.error("Play error:", e));
        }
    }, [isPlaying]);

    const handleSeek = useCallback((progress: number) => {
        const audio = (window as any).sharedAudioElement as HTMLAudioElement;
        if (audio && audio.duration && audio.duration > 0) {
            audio.currentTime = progress * audio.duration;
        }
    }, []);

    return (
        <div>
            <div
                ref={winampContainerRef}
                id="webamp"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 2,
                }}
            />
            <canvas
                ref={barCanvasRef}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "50px",
                    zIndex: 3,
                }}
            />
            <div style={{ marginTop: "60px", padding: "0 20px" }}>
                <Button onClick={handlePlayPause}>
                    {isPlaying ? "Pause" : "Play"}
                </Button>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={audioProgress || 0}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    style={{ width: "100%", marginTop: "10px" }}
                />
            </div>
        </div>
    );
};

export default WinampPage;
function getSharedWebamp(current: HTMLDivElement, DEFAULT_TRACK_URL: string) {
    throw new Error("Function not implemented.");
}

