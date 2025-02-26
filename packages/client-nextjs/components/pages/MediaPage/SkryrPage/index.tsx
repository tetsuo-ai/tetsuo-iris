"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Slider from "@/components/ui/slider";
import WinampPage from "../WinampPage";
import AsciiArt from "@/components/ui/asciis";

const SkryrToolbar = dynamic(() => import("@/components/ui/skryr/skryr-toolbar"), { ssr: false });
const SkryrPalette = dynamic(() => import("@/components/ui/skryr/skryr-palette"), { ssr: false });
const GiphyGifKeyboard = dynamic(() => import("@/components/ui/GiphyGifKeyboard"), { ssr: false });

export interface MediaItem {
    type: "image" | "video" | "audio";
    src: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    showAt: number;
    hideAt: number;
    isManuallyControlled?: boolean;
    interruptOnPlay?: boolean;
}

interface CustomTextItem {
    id: number;
    text?: string;
    isAscii?: boolean;
    x: number;
    y: number;
    scale: number;
    flashSpeed: number;
    flashIntensity: number;
    color: string;
    isDefault?: boolean;
}

export type SelectedElement = { type: "media" | "customText"; index: number } | null;

type MappingModeVisual = "toggle" | "launchpad";
type MappingModeAudio = "oneshot" | "playPause";
type MappingMode = MappingModeVisual | MappingModeAudio;

interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: MappingMode;
}

const topRow = ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];
const secondRow = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"];
const thirdRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];
const fourthRow = ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"];
const numpadRow = ["7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "0", "."];

const containerWidth = 960;
const containerHeight = 540;
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

interface SkryrPageProps {
    backgroundEnabled?: boolean;
    onToggleFullscreen?: () => void;
    onToggleBackground?: () => void;
}

const SkryrPage: React.FC<SkryrPageProps> = ({
    backgroundEnabled = true,
    onToggleFullscreen,
    onToggleBackground,
}) => {
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [customTexts, setCustomTexts] = useState<CustomTextItem[]>([]);
    const [customTextInput, setCustomTextInput] = useState<string>("");
    const [videoSpeed, setVideoSpeed] = useState<number>(1);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [matrixEnabled, setMatrixEnabled] = useState<boolean>(true);
    const [visualizerEnabled, setVisualizerEnabled] = useState<boolean>(true);
    const [asciiEnabled, setAsciiEnabled] = useState<boolean>(true);
    const [primaryAudioSrc, setPrimaryAudioSrc] = useState<string | null>(null);
    const primaryAudioRef = useRef<HTMLAudioElement | null>(null);
    const [videoPos, setVideoPos] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [showPalette, setShowPalette] = useState<boolean>(true);
    const [showToolsInFullscreen, setShowToolsInFullscreen] = useState<boolean>(true);
    const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(32));
    const [workspaceDimensions, setWorkspaceDimensions] = useState<{ width: number; height: number }>({
        width: containerWidth,
        height: containerHeight,
    });
    const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const asciiCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const visualizerRef = useRef<any>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const firstRenderRef = useRef({ visualizer: true, matrix: true, ascii: true });
    const audioCtxRef = useRef<AudioContext | null>(null);
    const [hueRotation, setHueRotation] = useState(0);
    const [saturation, setSaturation] = useState(5);
    const [sepia, setSepia] = useState(1);
    const [invert, setInvert] = useState(1);

    const computedColor = `hsl(${hueRotation}, ${saturation * 10}%, ${invert * 50}%)`;
    const videoDragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
    const imageDragStarts = useRef<{ [key: number]: { mouseX: number; mouseY: number; posX: number; posY: number } }>({});
    const customTextDragStarts = useRef<{ [id: number]: { mouseX: number; mouseY: number; posX: number; posY: number } }>({});

    // Visualizer and effects setup
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return;

        let currentParent: HTMLElement | null = null;

        const setupEffects = async () => {
            const parentEl = isFullscreen ? document.body : document.getElementById("workspace");
            if (!parentEl) {
                console.error("Workspace or body element not found.");
                return;
            }
            currentParent = parentEl;

            if (!visualizerCanvasRef.current) {
                const visCanvas = document.createElement("canvas");
                visCanvas.style.position = "absolute";
                visCanvas.style.top = "0";
                visCanvas.style.left = "0";
                visCanvas.style.zIndex = "0";
                visCanvas.style.pointerEvents = "none";
                parentEl.appendChild(visCanvas);
                visualizerCanvasRef.current = visCanvas;
                console.log("Visualizer canvas created.");
            }

            if (!matrixCanvasRef.current) {
                const matCanvas = document.createElement("canvas");
                matCanvas.style.position = "absolute";
                matCanvas.style.top = "0";
                matCanvas.style.left = "0";
                matCanvas.style.zIndex = "1";
                matCanvas.style.pointerEvents = "none";
                matCanvas.style.background = "transparent";
                parentEl.appendChild(matCanvas);
                matrixCanvasRef.current = matCanvas;
                console.log("Matrix canvas created.");
            }

            if (!asciiCanvasRef.current) {
                const asciiCanvas = document.createElement("canvas");
                asciiCanvas.style.position = "absolute";
                asciiCanvas.style.top = "0";
                asciiCanvas.style.left = "0";
                asciiCanvas.style.zIndex = "2";
                asciiCanvas.style.pointerEvents = "none";
                asciiCanvas.style.background = "transparent";
                parentEl.appendChild(asciiCanvas);
                asciiCanvasRef.current = asciiCanvas;
                console.log("ASCII canvas created.");
            }

            const visualizerCanvas = visualizerCanvasRef.current;
            const matrixCanvas = matrixCanvasRef.current;
            const asciiCanvas = asciiCanvasRef.current;

            if (!visualizerCanvas || !matrixCanvas || !asciiCanvas) {
                console.error("Failed to initialize canvases:", {
                    visualizerCanvas: !!visualizerCanvas,
                    matrixCanvas: !!matrixCanvas,
                    asciiCanvas: !!asciiCanvas,
                });
                return;
            }

            const gl = visualizerCanvas.getContext("webgl2");
            if (!gl) {
                console.error("WebGL2 not supported; visualizer will not initialize.");
                return;
            }

            try {
                await loadScript("https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js");
                let bc: any;
                const maxAttempts = 10;
                let attempts = 0;
                while (!(bc = (window as any).butterchurn?.default || (window as any).butterchurn) && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                if (!bc) throw new Error("Butterchurn not loaded");

                await loadScript("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js");
                const bcPresets = (window as any).butterchurnPresets?.default || (window as any).butterchurnPresets;

                audioCtxRef.current = new AudioContext();
                visualizerRef.current = bc.createVisualizer(audioCtxRef.current, visualizerCanvas, {
                    smoothing: 0.8,
                    brightness: 0.5,
                    width: visualizerCanvas.width,
                    height: visualizerCanvas.height,
                });
                console.log("Visualizer initialized.");

                if (bcPresets) {
                    const presets = bcPresets.getPresets();
                    if (presets && Object.keys(presets).length > 0) {
                        visualizerRef.current.loadPreset(presets[Object.keys(presets)[0]]);
                    }
                }

                const connectMic = async () => {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                echoCancellation: false,
                                noiseSuppression: false,
                                autoGainControl: false,
                            },
                            video: false,
                        });
                        if (!audioCtxRef.current) throw new Error("AudioContext not initialized");
                        const source = audioCtxRef.current.createMediaStreamSource(stream);
                        if (!visualizerRef.current) throw new Error("Visualizer not initialized");
                        source.connect(visualizerRef.current);
                        visualizerRef.current.connectAudio(source);
                        console.log("Butterchurn connected to microphone audio.");
                    } catch (err) {
                        console.error("Error connecting Butterchurn to microphone:", err);
                    }
                };

                connectMic();
            } catch (err) {
                console.error("Effects setup failed:", err);
            }
        };

        setupEffects();

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            const visCanvas = visualizerCanvasRef.current;
            const matCanvas = matrixCanvasRef.current;
            const asciiCanvas = asciiCanvasRef.current;
            if (currentParent) {
                if (visCanvas && currentParent.contains(visCanvas)) currentParent.removeChild(visCanvas);
                if (matCanvas && currentParent.contains(matCanvas)) currentParent.removeChild(matCanvas);
                if (asciiCanvas && currentParent.contains(asciiCanvas)) currentParent.removeChild(asciiCanvas);
            }
            visualizerCanvasRef.current = null;
            matrixCanvasRef.current = null;
            asciiCanvasRef.current = null;
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(err => console.warn("AudioContext close failed:", err));
                audioCtxRef.current = null;
            }
        };
    }, [isFullscreen]);

    const getAudioIntensity = useCallback((): number => {
        const average = audioData.reduce((a: number, b: number) => a + b, 0) / audioData.length;
        return average / 255; // Normalized between 0 and 1
    }, [audioData]);

    // Render effects
    useEffect(() => {
        if (!visualizerCanvasRef.current || !matrixCanvasRef.current || !asciiCanvasRef.current) return;

        const visualizerCanvas = visualizerCanvasRef.current;
        const matrixCanvas = matrixCanvasRef.current;
        const asciiCanvas = asciiCanvasRef.current;
        const matrixCtx = matrixCanvas.getContext("2d");
        const asciiCtx = asciiCanvas.getContext("2d");
        const gl = visualizerCanvas.getContext("webgl2");

        if (!matrixCtx || !asciiCtx || !gl) {
            console.error("Canvas contexts not available:", {
                matrixCtx: !!matrixCtx,
                asciiCtx: !!asciiCtx,
                gl: !!gl,
            });
            return;
        }

        const resizeCanvases = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = isFullscreen ? window.innerWidth : containerWidth;
            const height = isFullscreen ? window.innerHeight : containerHeight;

            visualizerCanvas.width = width * dpr;
            visualizerCanvas.height = height * dpr;
            visualizerCanvas.style.width = `${width}px`;
            visualizerCanvas.style.height = `${height}px`;
            if (visualizerRef.current) {
                visualizerRef.current.setRendererSize(visualizerCanvas.width, visualizerCanvas.height);
            }

            matrixCanvas.width = width * dpr;
            matrixCanvas.height = height * dpr;
            matrixCanvas.style.width = `${width}px`;
            matrixCanvas.style.height = `${height}px`;
            matrixCtx.scale(dpr, dpr);

            asciiCanvas.width = width * dpr;
            asciiCanvas.height = height * dpr;
            asciiCanvas.style.width = `${width}px`;
            asciiCanvas.style.height = `${height}px`;
            asciiCtx.scale(dpr, dpr);
        };
        resizeCanvases();
        window.addEventListener("resize", resizeCanvases);

        const width = matrixCanvas.width / window.devicePixelRatio;
        const height = matrixCanvas.height / window.devicePixelRatio;
        const fontSize = 16;
        const columns = Math.floor(width / fontSize);
        const drops = Array(columns).fill(0).map(() => ({
            y: Math.random() * height / fontSize,
            alpha: 1,
            life: 60 + Math.random() * 40,
        }));

        const commonLyrics = [
            "Did you feel?", "Did you see?", "You are here.", "Strap in.", "Launchpad",
            "SKRYR", "Launchpad SKRYR", "tetsuo.ai", "SYSTEM ONLINE", "GATEWAY OPEN",
            "TETSUO", "Solana Agents",
        ];
        const rareLyrics = [
            "Launch set.", "Visuals burn.", "Frequencies higher.", "Ghosts hum.",
            "Dreams stream.", "Say the word.", "Wired deep.", "Neon hums.", "Keys flash.",
            "Bass drums.", "Pixels scream.", "Time decays.", "Press play.", "World erased.",
        ];

        let activeLyrics: { text: string; x: number; y: number; life: number; alpha: number }[] = [];
        const lyricDuration = 44;
        const baseFallSpeed = 0.5;

        let lastCommonLyricTime = Date.now();
        let lastRareLyricTime = Date.now();

        const getBoundedX = (text: string): number => {
            const textWidth = matrixCtx.measureText(text).width;
            return Math.max(0, Math.min(width - textWidth, Math.random() * (width - textWidth)));
        };

        const getBoundedY = (): number => Math.max(fontSize, Math.random() * (height - fontSize * 2));

        const renderEffects = () => {
            const audioIntensity = getAudioIntensity();

            // Visualizer
            visualizerCanvas.style.display = visualizerEnabled ? "block" : "none";
            if (visualizerEnabled && visualizerRef.current) {
                visualizerRef.current.render();
                if (firstRenderRef.current.visualizer) {
                    console.log("Visualizer first render successful.");
                    firstRenderRef.current.visualizer = false;
                }
            } else if (gl && !visualizerEnabled) {
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                if (!firstRenderRef.current.visualizer) {
                    firstRenderRef.current.visualizer = true;
                }
            }

            // Matrix
            matrixCanvas.style.display = matrixEnabled ? "block" : "none";
            if (matrixEnabled) {
                matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
                matrixCtx.fillRect(0, 0, width, height);

                matrixCtx.font = `${fontSize}px monospace`;
                const fallSpeed = baseFallSpeed + audioIntensity * 1.5;

                for (let i = 0; i < drops.length; i++) {
                    if (drops[i].alpha > 0) {
                        const text = String.fromCharCode(33 + Math.random() * 94);
                        const dynamicAlpha = Math.max(drops[i].alpha, audioIntensity);
                        matrixCtx.fillStyle = `rgba(0, 255, 0, ${dynamicAlpha})`;
                        matrixCtx.fillText(text, i * fontSize, drops[i].y * fontSize);

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
                    matrixCtx.fillStyle = `rgba(0, 255, 0, ${lyric.alpha})`;
                    matrixCtx.fillText(lyric.text, lyric.x, lyric.y);
                    lyric.life--;
                });

                activeLyrics = activeLyrics.filter((lyric) => lyric.life > 0);

                const now = Date.now();
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

                if (firstRenderRef.current.matrix) {
                    console.log("Matrix first render successful.");
                    firstRenderRef.current.matrix = false;
                }
            } else if (matrixCtx && !matrixEnabled) {
                matrixCtx.clearRect(0, 0, width, height);
                if (!firstRenderRef.current.matrix) {
                    firstRenderRef.current.matrix = true;
                }
            }

            // ASCII
            asciiCanvas.style.display = asciiEnabled ? "block" : "none";
            if (asciiEnabled && customTexts.length > 0) {
                asciiCtx.clearRect(0, 0, width, height);
                asciiCtx.font = `${fontSize}px monospace`;
                customTexts.forEach((ct) => {
                    if (ct.isAscii) {
                        const lines = ct.text?.split("\n") || [""];
                        const textWidth = Math.max(...lines.map(line => asciiCtx.measureText(line).width));
                        const textHeight = lines.length * fontSize;
                        const x = (ct.x / 100) * width - textWidth / 2;
                        const y = (ct.y / 100) * height - textHeight / 2;

                        asciiCtx.fillStyle = ct.color;
                        lines.forEach((line, i) => {
                            asciiCtx.fillText(line, x, y + i * fontSize);
                        });
                    }
                });
                if (firstRenderRef.current.ascii) {
                    console.log("ASCII first render successful.");
                    firstRenderRef.current.ascii = false;
                }
            } else if (asciiCtx && !asciiEnabled) {
                asciiCtx.clearRect(0, 0, width, height);
                if (!firstRenderRef.current.ascii) {
                    firstRenderRef.current.ascii = true;
                }
            }

            animationFrameIdRef.current = requestAnimationFrame(renderEffects);
        };

        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
        animationFrameIdRef.current = requestAnimationFrame(renderEffects);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            window.removeEventListener("resize", resizeCanvases);
        };
    }, [isFullscreen, visualizerEnabled, matrixEnabled, asciiEnabled, customTexts, getAudioIntensity]);

    const handlePlayPause = useCallback(() => {
        const webamp = (window as any).webampInstance;
        if (webamp) {
            if (isPlaying) {
                webamp.store.dispatch({ type: "PAUSE" });
            } else {
                webamp.store.dispatch({ type: "PLAY" });
            }
            setIsPlaying((prev) => !prev);
        } else if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setIsPlaying((prev) => !prev);
        }
    }, [isPlaying]);

    const handleStop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    }, []);

    const buildDefaultMappings = useCallback(() => {
        const mappings: KeyMapping[] = [];
        const addRow = (row: string[]) => {
            row.forEach((key) => mappings.push({ key, assignedIndex: null, mappingType: "media", mode: "toggle" }));
        };
        addRow(topRow);
        addRow(secondRow);
        addRow(thirdRow);
        addRow(fourthRow);
        addRow(numpadRow);
        return mappings;
    }, []);
    const [keyMappings, setKeyMappings] = useState<KeyMapping[]>(buildDefaultMappings());
    const boundIndices = Array.from(
        new Set(keyMappings.filter((mapping) => mapping.assignedIndex !== null).map((mapping) => mapping.assignedIndex))
    );
    const unboundMedia = mediaList.map((item, index) => ({ item, index })).filter(({ index }) => !boundIndices.includes(index));

    const onPrimaryAudioDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const fileURL = URL.createObjectURL(file);
            setPrimaryAudioSrc(fileURL);
            if (!primaryAudioRef.current) {
                primaryAudioRef.current = new Audio(fileURL);
            } else {
                primaryAudioRef.current.src = fileURL;
            }
        } else {
            const textData = e.dataTransfer.getData("text/plain");
            if (textData && textData.startsWith("http") && textData.match(/\.(mp3|wav|ogg)$/i)) {
                setPrimaryAudioSrc(textData);
                if (!primaryAudioRef.current) {
                    primaryAudioRef.current = new Audio(textData);
                } else {
                    primaryAudioRef.current.src = textData;
                }
            }
        }
    }, []);

    const [audioProgress, setAudioProgress] = useState<number>(0);

    const updateWorkspaceDimensions = useCallback(() => {
        if (typeof window === "undefined") return;
        if (document.fullscreenElement) {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const targetRatio = containerWidth / containerHeight;
            const screenRatio = sw / sh;
            let width: number, height: number;
            if (screenRatio > targetRatio) {
                height = sh;
                width = height * targetRatio;
            } else {
                width = sw;
                height = width / targetRatio;
            }
            setWorkspaceDimensions({ width, height });
        } else {
            setWorkspaceDimensions({ width: containerWidth, height: containerHeight });
        }
    }, []);

    const handleToggleFullscreen = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
        if (e) e.preventDefault();
        if (typeof document === "undefined") return;
        const container = document.getElementById("fullscreenContainer");
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen()
                .then(() => {
                    setIsFullscreen(true);
                    updateWorkspaceDimensions();
                    if (onToggleFullscreen) onToggleFullscreen();
                })
                .catch((err) => console.error("Error entering fullscreen:", err));
        } else {
            document.exitFullscreen()
                .then(() => {
                    setIsFullscreen(false);
                    updateWorkspaceDimensions();
                    if (onToggleFullscreen) onToggleFullscreen();
                })
                .catch((err) => console.error("Error exiting fullscreen:", err));
        }
    }, [onToggleFullscreen, updateWorkspaceDimensions]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const onFSChange = () => {
            setIsFullscreen(document.fullscreenElement !== null);
            updateWorkspaceDimensions();
        };
        document.addEventListener("fullscreenchange", onFSChange);
        window.addEventListener("resize", updateWorkspaceDimensions);
        return () => {
            document.removeEventListener("fullscreenchange", onFSChange);
            window.removeEventListener("resize", updateWorkspaceDimensions);
        };
    }, [updateWorkspaceDimensions]);

    useEffect(() => {
        if (customTexts.length === 0) {
            setCustomTexts([{
                id: Date.now(),
                text: AsciiArt,
                isAscii: true,
                x: 50,
                y: 50,
                scale: isFullscreen ? 0.5 : 1.1,
                flashSpeed: 3,
                flashIntensity: 5,
                color: "#00ff00",
                isDefault: true,
            }]);
        }
    }, [customTexts.length, isFullscreen]);

    useEffect(() => {
        const ratio = Math.max(workspaceDimensions.width / containerWidth, workspaceDimensions.height / containerHeight);
        const adjustedScale = isFullscreen ? ratio * 1.1 : 1.1;
        setCustomTexts((prevTexts) =>
            prevTexts.map((ct) => (ct.isAscii ? { ...ct, scale: adjustedScale } : ct))
        );
    }, [isFullscreen, workspaceDimensions]);

    useEffect(() => {
        if (mediaList.length === 0) {
            const defaultMedia: MediaItem[] = [
                {
                    type: "image",
                    src: "https://eaccelerate.me/tetsuo/tetsuo-unit-frame.gif", // Corrected URL
                    x: 90,
                    y: 10,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                    interruptOnPlay: true
                },
                {
                    type: "image",
                    src: "https://eaccelerate.me/tetsuo/launchpad-SKRYR.gif", // Corrected URL (case-sensitive)
                    x: 50,
                    y: 50,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                    interruptOnPlay: true
                },
            ];
            setMediaList(defaultMedia);
            setKeyMappings((prev) => {
                const newMappings = [...prev];
                newMappings[0] = { ...newMappings[0], assignedIndex: 0, mappingType: "media", mode: "toggle" };
                newMappings[1] = { ...newMappings[1], assignedIndex: 1, mappingType: "media", mode: "toggle" };
                return newMappings;
            });
        }
    }, [mediaList.length]);

    const fpsRef = useRef<number>(performance.now());
    const [fps, setFps] = useState<number>(0);
    useEffect(() => {
        let rafId: number;
        const updateFps = () => {
            const now = performance.now();
            setFps(Math.round(1000 / (now - fpsRef.current)));
            fpsRef.current = now;
            rafId = requestAnimationFrame(updateFps);
        };
        rafId = requestAnimationFrame(updateFps);
        return () => cancelAnimationFrame(rafId);
    }, []);

    useEffect(() => {
        const video = document.getElementById("video-player") as HTMLVideoElement;
        if (video) video.playbackRate = videoSpeed;
    }, [videoSpeed]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setMediaList((prev) =>
            prev.map((media) => ({
                ...media,
                visible: media.isManuallyControlled ? media.visible : media.showAt <= currentTime && media.hideAt >= currentTime,
            }))
        );
    }, [currentTime]);

    const triggerKeyMapping = useCallback((key: string) => {
        if (key === " " || key.toLowerCase() === "space") {
            handlePlayPause();
            return;
        }

        const mapping = keyMappings.find((m) => m.key.toUpperCase() === key.toUpperCase());
        if (mapping && mapping.assignedIndex !== null) {
            const media = mediaList[mapping.assignedIndex];
            if (!media) return;

            setMediaList((prev) =>
                prev.map((item, index) => {
                    if (index === mapping.assignedIndex) {
                        return { ...item, visible: !item.visible, isManuallyControlled: true };
                    } else if (media.interruptOnPlay && item.visible) {
                        return { ...item, visible: false };
                    }
                    return item;
                })
            );
        }
    }, [keyMappings, mediaList, handlePlayPause]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const onKeyDown = (e: KeyboardEvent) => triggerKeyMapping(e.key);
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [triggerKeyMapping]);

    const handleZoomChange = useCallback((delta: number) => {
        setZoomLevel((prev) => clamp(prev + delta, 0.5, 3));
    }, []);

    const removeMedia = useCallback((index: number) => {
        const updated = mediaList.filter((_, i) => i !== index);
        setMediaList(updated);
        localStorage.setItem("mediaList", JSON.stringify(updated));
        setSelectedElement(null);
    }, [mediaList]);

    const getDeltaPercentages = (startX: number, startY: number, currentX: number, currentY: number) => {
        const deltaX = ((currentX - startX) / containerWidth) * 100;
        const deltaY = ((currentY - startY) / containerHeight) * 100;
        return { deltaX, deltaY };
    };

    const onVideoMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        videoDragStart.current = { mouseX: e.clientX, mouseY: e.clientY, posX: videoPos.x, posY: videoPos.y };
        const onMouseMove = (ev: MouseEvent) => {
            if (videoDragStart.current) {
                const { deltaX, deltaY } = getDeltaPercentages(
                    videoDragStart.current.mouseX,
                    videoDragStart.current.mouseY,
                    ev.clientX,
                    ev.clientY
                );
                setVideoPos({
                    x: clamp(videoDragStart.current.posX + deltaX, 0, 100),
                    y: clamp(videoDragStart.current.posY + deltaY, 0, 100),
                });
            }
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            videoDragStart.current = null;
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [videoPos]);

    const moveElementForward = useCallback((index: number) => {
        setMediaList((prev) => {
            if (index >= prev.length - 1) return prev;
            const updated = [...prev];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated;
        });
    }, []);

    const moveElementBackward = useCallback((index: number) => {
        setMediaList((prev) => {
            if (index <= 0) return prev;
            const updated = [...prev];
            [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
            return updated;
        });
    }, []);

    const onImageMouseDown = useCallback((e: React.MouseEvent, index: number) => {
        e.preventDefault();
        imageDragStarts.current[index] = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            posX: mediaList[index].x,
            posY: mediaList[index].y,
        };
        const onMouseMove = (ev: MouseEvent) => {
            const start = imageDragStarts.current[index];
            if (start) {
                const { deltaX, deltaY } = getDeltaPercentages(start.mouseX, start.mouseY, ev.clientX, ev.clientY);
                const newX = clamp(start.posX + deltaX, 0, 100);
                const newY = clamp(start.posY + deltaY, 0, 100);
                setMediaList((prev) => prev.map((item, i) => (i === index ? { ...item, x: newX, y: newY } : item)));
            }
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            delete imageDragStarts.current[index];
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [mediaList]);

    const onCustomTextMouseDown = useCallback((e: React.MouseEvent, id: number) => {
        e.preventDefault();
        customTextDragStarts.current[id] = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            posX: customTexts.find((ct) => ct.id === id)?.x ?? 50,
            posY: customTexts.find((ct) => ct.id === id)?.y ?? 50,
        };
        const onMouseMove = (ev: MouseEvent) => {
            const start = customTextDragStarts.current[id];
            if (start) {
                const { deltaX, deltaY } = getDeltaPercentages(start.mouseX, start.mouseY, ev.clientX, ev.clientY);
                setCustomTexts((prev) =>
                    prev.map((ct) =>
                        ct.id === id ? { ...ct, x: clamp(start.posX + deltaX, 0, 100), y: clamp(start.posY + deltaY, 0, 100) } : ct
                    )
                );
            }
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            delete customTextDragStarts.current[id];
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, [customTexts]);

    const handleWorkspaceDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const mediaIndexData = e.dataTransfer.getData("application/x-media-index");
        if (mediaIndexData) {
            const mediaIndex = parseInt(mediaIndexData, 10);
            if (!isNaN(mediaIndex) && mediaList[mediaIndex]) {
                setMediaList((prev) => [
                    ...prev,
                    { ...mediaList[mediaIndex], visible: false, interruptOnPlay: mediaList[mediaIndex].type === "video" },
                ]);
            }
        }
    }, [mediaList]);

    const [showGiphyKeyboard, setShowGiphyKeyboard] = useState(false);

    const handleGifSelect = useCallback((gifUrl: string) => {
        const isVideo = gifUrl.match(/\.(mp4|webm)$/i) ? true : false;
        const newMedia: MediaItem = {
            type: isVideo ? "video" : "image",
            src: gifUrl,
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
            opacity: 1,
            visible: false,
            showAt: 0,
            hideAt: 120,
            interruptOnPlay: false,
        };
        setMediaList((prev) => {
            const newList = [...prev, newMedia];
            setKeyMappings((prevMappings) => {
                const newMappings = [...prevMappings];
                const newIndex = newMappings.findIndex((m) => m.assignedIndex === null);
                if (newIndex !== -1) {
                    newMappings[newIndex] = {
                        ...newMappings[newIndex],
                        assignedIndex: newList.length - 1,
                        mappingType: "media",
                        mode: isVideo ? "launchpad" : "toggle",
                    };
                }
                return newMappings;
            });
            return newList;
        });
        setShowGiphyKeyboard(false);
    }, []);

    const toggleMediaVisibility = useCallback((index: number) => {
        setMediaList((prev) => prev.map((item, i) => (i === index ? { ...item, visible: !item.visible } : item)));
    }, []);

    const openMediaOptions = useCallback((index: number) => {
        setSelectedElement({ type: "media", index });
    }, []);

    const renderKeyboardRow = useCallback((row: string[], startIndex: number): React.ReactNode => {
        return (
            <div className="flex gap-1 mb-1 justify-center">
                {row.map((keyLabel, i) => {
                    const mappingIndex = startIndex + i;
                    const mapping = keyMappings[mappingIndex] || { assignedIndex: null, mappingType: "media", mode: "toggle" };
                    let cellContent: React.ReactNode = keyLabel;
                    let borderStyle = "border border-transparent";
                    let borderWidth = "border-[1px]";

                    if (mapping.assignedIndex !== null && mediaList[mapping.assignedIndex]) {
                        const media = mediaList[mapping.assignedIndex];
                        if (media.type === "image") {
                            cellContent = <img src={media.src} alt={keyLabel} className="w-6 h-6 object-cover" />;
                        }
                        borderStyle = media.visible ? "border border-solid" : "border border-transparent";
                        borderWidth = media.visible ? "border-[3px]" : "";
                    } else {
                        borderStyle = "border border-solid";
                        borderWidth = "border-[1px]";
                    }

                    return (
                        <div
                            key={mappingIndex}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded cursor-pointer select-none transition-all ${borderStyle} ${borderWidth}`}
                            style={{ borderColor: computedColor, backgroundColor: "rgba(0, 0, 0, 0.8)" }}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("mapping-index", mappingIndex.toString())}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const srcMappingIndexStr = e.dataTransfer.getData("mapping-index");
                                if (srcMappingIndexStr) {
                                    const srcIdx = parseInt(srcMappingIndexStr, 10);
                                    setKeyMappings((prev) => {
                                        const newMappings = [...prev];
                                        [newMappings[mappingIndex], newMappings[srcIdx]] = [newMappings[srcIdx], newMappings[mappingIndex]];
                                        return newMappings;
                                    });
                                    return;
                                }
                                const mediaIndexData = e.dataTransfer.getData("application/x-media-index");
                                if (mediaIndexData) {
                                    const mediaIndex = parseInt(mediaIndexData, 10);
                                    if (!isNaN(mediaIndex)) {
                                        setKeyMappings((prev) => {
                                            const newMappings = [...prev];
                                            newMappings[mappingIndex].assignedIndex = mediaIndex;
                                            newMappings[mappingIndex].mappingType = "media";
                                            newMappings[mappingIndex].mode = "toggle";
                                            return newMappings;
                                        });
                                        return;
                                    }
                                }
                                const textData = e.dataTransfer.getData("text/plain");
                                if (textData && textData.startsWith("http")) {
                                    let newType: MediaItem["type"] = "image";
                                    if (textData.match(/\.(jpeg|jpg|png|gif)$/i)) newType = "image";
                                    else if (textData.match(/\.(mp4|webm)$/i)) newType = "video";
                                    const newMedia: MediaItem = {
                                        type: newType,
                                        src: textData,
                                        x: 50,
                                        y: 50,
                                        scale: 1,
                                        rotation: 0,
                                        opacity: 1,
                                        visible: true,
                                        showAt: 0,
                                        hideAt: 120,
                                        interruptOnPlay: true,
                                    };
                                    setMediaList((prev) => {
                                        const newList = [...prev, newMedia];
                                        setKeyMappings((prevMappings) => {
                                            const newMappings = [...prevMappings];
                                            newMappings[mappingIndex].assignedIndex = newList.length - 1;
                                            newMappings[mappingIndex].mappingType = "media";
                                            newMappings[mappingIndex].mode = "toggle";
                                            return newMappings;
                                        });
                                        return newList;
                                    });
                                }
                            }}
                        >
                            {cellContent}
                        </div>
                    );
                })}
            </div>
        );
    }, [keyMappings, mediaList, computedColor]);

    const renderVirtualKeyboardPanel = useCallback((): JSX.Element => {
        let currentIndex = 0;
        return (
            <div className="p-2 border border-gray-500 rounded text-white text-center bg-black/80 shadow-lg">
                <div className="mb-2 font-bold" style={{ color: computedColor }}>Media Launchpad (drag & drop)</div>
                {renderKeyboardRow(topRow, currentIndex)}
                {(() => { currentIndex += topRow.length; return null; })()}
                {renderKeyboardRow(secondRow, currentIndex)}
                {(() => { currentIndex += secondRow.length; return null; })()}
                {renderKeyboardRow(thirdRow, currentIndex)}
                {(() => { currentIndex += thirdRow.length; return null; })()}
                {renderKeyboardRow(fourthRow, currentIndex)}
                {(() => { currentIndex += fourthRow.length; return null; })()}
                <div className="mt-2" style={{ color: computedColor }}>Numpad:</div>
                {renderKeyboardRow(numpadRow, currentIndex)}
            </div>
        );
    }, [renderKeyboardRow, computedColor]);

    const renderOptionsContent = useCallback((): JSX.Element | null => {
        if (!selectedElement) return null;

        if (selectedElement.type === "media") {
            const media = mediaList[selectedElement.index];
            return (
                <div className="p-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-sm" style={{ color: computedColor }}>{media.src.split("/").pop() ?? "Untitled"}</div>
                        <button
                            onClick={() => setSelectedElement(null)}
                            className="px-2 py-1 text-sm font-bold bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                            style={{ color: computedColor }}
                        >
                            X
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <Button
                            onClick={() => setMediaList((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, scale: workspaceDimensions.width / 256 } : item)))}
                            className="w-full h-10 text-2xl border-2 hover:bg-gray-700"
                            style={{ color: computedColor }}
                            title="Fit Fullscreen"
                        >
                            <i className="fa-solid fa-expand" />
                        </Button>
                        <Button
                            onClick={() => setMediaList((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, x: 50, y: 50 } : item)))}
                            className="w-full h-10 text-2xl border-2 hover:bg-gray-700"
                            style={{ color: computedColor }}
                            title="Center Workspace"
                        >
                            <i className="fa-solid fa-crosshairs" />
                        </Button>
                        <Button
                            onClick={() => setMediaList((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, interruptOnPlay: !item.interruptOnPlay } : item)))}
                            className={`w-full h-10 text-2xl border-2 ${media.interruptOnPlay ? "border-green-500 text-green-500" : "border-red-500 text-red-500"} hover:bg-gray-700`}
                            title="Toggle Interrupt Others"
                        >
                            <i className={`fa-solid ${media.interruptOnPlay ? "fa-toggle-on" : "fa-toggle-off"}`} />
                        </Button>
                        <Button
                            onClick={() => moveElementForward(selectedElement.index)}
                            className="w-full h-10 text-2xl border-2 hover:bg-gray-700"
                            style={{ color: computedColor }}
                            title="Move Forward"
                        >
                            <i className="fa-solid fa-arrow-up" />
                        </Button>
                        <Button
                            onClick={() => moveElementBackward(selectedElement.index)}
                            className="w-full h-10 text-2xl border-2 hover:bg-gray-700"
                            style={{ color: computedColor }}
                            title="Move Backward"
                        >
                            <i className="fa-solid fa-arrow-down" />
                        </Button>
                        <Button
                            onClick={() => removeMedia(selectedElement.index)}
                            className="w-full h-10 text-2xl border-2 border-red-500 text-red-500 hover:bg-red-700"
                            title="Remove Media"
                        >
                            <i className="fa-solid fa-trash" />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-1" style={{ color: computedColor }}>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Scale</span>
                            <Slider
                                min={0.5}
                                max={10}
                                step={0.1}
                                value={[media.scale]}
                                onValueChange={(value: number[]) => setMediaList((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, scale: value[0] } : item)))}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Rotation</span>
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[media.rotation]}
                                onValueChange={(value: number[]) => setMediaList((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, rotation: value[0] } : item)))}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Opacity</span>
                            <Slider
                                min={0}
                                max={1}
                                step={0.1}
                                value={[media.opacity]}
                                onValueChange={(value: number[]) => setMediaList((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, opacity: value[0] } : item)))}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            );
        } else if (selectedElement.type === "customText") {
            const ct = customTexts[selectedElement.index];
            return (
                <div className="flex flex-col gap-1 max-h-screen overflow-auto" style={{ color: computedColor }}>
                    <div className="text-lg font-bold mb-2">ASCII/Text Options</div>
                    {ct.isAscii ? (
                        <textarea
                            value={ct.text || ""}
                            onChange={(e) => setCustomTexts((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, text: e.target.value } : item)))}
                            className="w-full h-48 bg-transparent p-2 whitespace-pre-wrap border border-gray-500 rounded"
                            style={{ borderColor: computedColor, color: computedColor }}
                        />
                    ) : (
                        <Input
                            type="text"
                            placeholder="Edit Text"
                            value={ct.text || ""}
                            onChange={(e) => setCustomTexts((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, text: e.target.value } : item)))}
                            className="bg-transparent border-gray-500"
                            style={{ color: computedColor }}
                        />
                    )}
                    <div className="flex flex-row gap-1">
                        <Input
                            type="color"
                            value={ct.color}
                            onChange={(e) => setCustomTexts((prev) => prev.map((item, i) => (i === selectedElement.index ? { ...item, color: e.target.value } : item)))}
                            className="w-2/3"
                        />
                        <Button
                            onClick={() => {
                                setCustomTexts((prev) => prev.filter((_, i) => i !== selectedElement.index));
                                setSelectedElement(null);
                            }}
                            className="w-full h-10 text-2xl bg-red-600 hover:bg-red-700"
                            title="Remove Text"
                        >
                            <i className="fa-solid fa-trash" />
                        </Button>
                    </div>
                </div>
            );
        }
        return null;
    }, [selectedElement, mediaList, customTexts, workspaceDimensions, computedColor, moveElementForward, moveElementBackward, removeMedia]);

    return (
        <>
            <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          color: ${computedColor};
          background-color: #000;
        }
        button {
          background-color: rgba(0, 0, 0, 0.8);
          color: ${computedColor};
          transition: background-color 0.3s ease-in-out;
          border-color: ${computedColor};
        }
        button:hover {
          background-color: rgba(50, 50, 50, 0.8);
        }
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: ${computedColor};
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
            <div
                id="fullscreenContainer"
                className="relative text-white overflow-hidden"
                style={{
                    background: isFullscreen ? "#000" : `url(https://eaccelerate.me/tetsuo/skryr-bg.png)`,
                    margin: 0,
                    padding: 0,
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                    color: computedColor,
                }}
            >
                <Suspense fallback={<div>Loading...</div>}>
                    <SkryrPalette
                        isFullscreen={isFullscreen}
                        handleToggleFullscreen={handleToggleFullscreen}
                        showPalette={showPalette}
                        setShowPalette={setShowPalette}
                        backgroundEnabled={visualizerEnabled}
                        setBackgroundEnabled={setVisualizerEnabled}
                        embeddedMode={matrixEnabled}
                        setEmbeddedMode={setMatrixEnabled}
                    >
                        <SkryrToolbar
                            isPlaying={isPlaying}
                            handlePlayPause={handlePlayPause}
                            handleStop={handleStop}
                            handleZoomChange={handleZoomChange}
                            handleToggleFullscreen={handleToggleFullscreen}
                            isFullscreen={isFullscreen}
                            showToolsInFullscreen={showToolsInFullscreen}
                            setShowToolsInFullscreen={setShowToolsInFullscreen}
                            showPalette={showPalette}
                            setShowPalette={setShowPalette}
                            backgroundEnabled={visualizerEnabled}
                            setBackgroundEnabled={(val) => {
                                console.log("Visualizer toggled to:", val);
                                setVisualizerEnabled(val);
                            }}
                            embeddedMode={matrixEnabled}
                            setEmbeddedMode={(val) => {
                                console.log("Matrix toggled to:", val);
                                setMatrixEnabled(val);
                            }}
                            primaryAudioSrc={primaryAudioSrc}
                            primaryAudioRef={primaryAudioRef}
                            audioProgress={audioProgress}
                            setAudioProgress={setAudioProgress}
                            onPrimaryAudioDrop={onPrimaryAudioDrop}
                            selectedElement={selectedElement}
                            renderOptionsContent={renderOptionsContent}
                            mediaList={mediaList}
                            keyMappings={keyMappings}
                            onToggleMedia={toggleMediaVisibility}
                            onOpenOptions={openMediaOptions}
                            setKeyMappings={setKeyMappings}
                            setMediaList={setMediaList}
                            showGiphyKeyboard={showGiphyKeyboard}
                            setShowGiphyKeyboard={setShowGiphyKeyboard}
                            handleGifSelect={handleGifSelect}
                            renderVirtualKeyboardPanel={renderVirtualKeyboardPanel}
                            toggleMatrixMode={() => setMatrixEnabled((prev) => !prev)}
                            toggleAsciiMode={() => setAsciiEnabled((prev) => !prev)}
                            isMatrixModeActive={matrixEnabled}
                            isAsciiModeActive={asciiEnabled}
                            onDeselectElement={() => setSelectedElement(null)}
                        />
                    </SkryrPalette>
                </Suspense>
                <div className="relative flex justify-center" style={{ height: "100vh", margin: 0, padding: 0 }}>
                    <div
                        id="workspace"
                        onDrop={handleWorkspaceDrop}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                            width: isFullscreen ? workspaceDimensions.width : containerWidth,
                            height: isFullscreen ? workspaceDimensions.height : containerHeight,
                            border: isFullscreen ? "none" : "1px solid white",
                            overflow: "hidden",
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: "top center",
                            marginTop: "0px",
                            backgroundColor: "black",
                            position: "relative",
                            display: "block",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                zIndex: 3,
                            }}
                        >
                            <WinampPage onAudioDataUpdate={setAudioData} onToggleFullscreen={handleToggleFullscreen} />
                        </div>
                        {asciiEnabled && customTexts.map((ct) => (
                            <div
                                key={ct.id}
                                onMouseDown={(e) => onCustomTextMouseDown(e, ct.id)}
                                onDoubleClick={() => setSelectedElement({ type: "customText", index: customTexts.findIndex((item) => item.id === ct.id) })}
                                className="absolute select-none"
                                style={{
                                    top: `${ct.y}%`,
                                    left: `${ct.x}%`,
                                    transform: `translate(-50%, -50%) scale(${ct.scale})`,
                                    cursor: "move",
                                    zIndex: 4,
                                }}
                            >
                                <pre style={{ color: ct.color, whiteSpace: "pre-wrap" }}>{ct.text}</pre>
                            </div>
                        ))}
                        {mediaList.map((item, index) => item.visible && (
                            <div
                                key={index}
                                style={{
                                    position: "absolute",
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                    transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
                                    opacity: item.opacity,
                                    border: boundIndices.includes(index) ? "2px solid yellow" : "1px solid gray",
                                    zIndex: 5,
                                }}
                                onMouseDown={(e) => onImageMouseDown(e, index)}
                                onDoubleClick={() => setSelectedElement({ type: "media", index })}
                            >
                                {item.type === "video" ? (
                                    <video id="video-player" src={item.src} className="w-64 border border-gray-700 rounded-md" loop autoPlay muted />
                                ) : item.type === "image" ? (
                                    <img src={item.src} alt="Media" className="max-w-[300px]" draggable={false} />
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pb-40"></div>
            </div>
        </>
    );
};

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof document !== "undefined" && document.querySelector(`script[src="${src}"]`)) {
            console.log(`Script already loaded: ${src}`);
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
            console.log(`Script loaded: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(script);
    });
}

export default SkryrPage;