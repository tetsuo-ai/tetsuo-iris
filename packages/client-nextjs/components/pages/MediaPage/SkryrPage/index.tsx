"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Slider from "@/components/ui/slider";
// Dynamically import these so that they are only loaded on the client.
const SkryrToolbar = dynamic(
    () => import("@/components/ui/skryr/skryr-toolbar"),
    { ssr: false }
);
const SkryrPalette = dynamic(
    () => import("@/components/ui/skryr/skryr-palette"),
    { ssr: false }
);
const GiphyGifKeyboard = dynamic(
    () => import("@/components/ui/GiphyGifKeyboard"),
    { ssr: false }
);

// Import the preloaded ASCII string (not a component) from your asciis module.
import AsciiArt from "@/components/ui/asciis";

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

export type SelectedElement =
    | { type: "media" | "customText"; index: number }
    | null;

type MappingModeVisual = "toggle" | "launchpad";
type MappingModeAudio = "oneshot" | "playPause";
type MappingMode = MappingModeVisual | MappingModeAudio;

interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: MappingMode;
}

// Virtual Keyboard Layout
const topRow = [
    "`",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "-",
    "=",
];
const secondRow = [
    "Q",
    "W",
    "E",
    "R",
    "T",
    "Y",
    "U",
    "I",
    "O",
    "P",
    "[",
    "]",
    "\\",
];
const thirdRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];
const fourthRow = ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"];
const numpadRow = [
    "7",
    "8",
    "9",
    "-",
    "4",
    "5",
    "6",
    "+",
    "1",
    "2",
    "3",
    "0",
    ".",
];

// Workspace dimensions & helper
const containerWidth = 960;
const containerHeight = 540;
const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

const SkryrPage = () => {
    // STATE DECLARATIONS
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [customTexts, setCustomTexts] = useState<CustomTextItem[]>([]);
    const [customTextInput, setCustomTextInput] = useState<string>("");
    const [videoSpeed, setVideoSpeed] = useState<number>(1);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [backgroundEnabled, setBackgroundEnabled] = useState<boolean>(true);
    const [embeddedMode, setEmbeddedMode] = useState<boolean>(true);
    const [primaryAudioSrc, setPrimaryAudioSrc] = useState<string | null>(null);
    const primaryAudioRef = useRef<HTMLAudioElement | null>(null);
    const [videoPos, setVideoPos] = useState<{ x: number; y: number }>({
        x: 50,
        y: 30,
    });
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [showPalette, setShowPalette] = useState<boolean>(true);
    const [showToolsInFullscreen, setShowToolsInFullscreen] =
        useState<boolean>(true);
    const [selectedElement, setSelectedElement] =
        useState<SelectedElement | null>(null);

    const handleDeselectElement = () => {
        setSelectedElement(null);
    };
    // Color states
    const [hueRotation, setHueRotation] = useState(0);
    const [saturation, setSaturation] = useState(5);
    const [sepia, setSepia] = useState(1);
    const [invert, setInvert] = useState(1);

    // Dynamically compute your color
    const computedColor = `hsl(${hueRotation}, ${saturation * 10}%, ${invert * 50}%)`;

    // KEYBOARD MAPPING STATE
    const buildDefaultMappings = () => {
        const mappings: KeyMapping[] = [];
        const addRow = (row: string[]) => {
            row.forEach((key) => {
                mappings.push({ key, assignedIndex: null, mappingType: "media", mode: "toggle" });
            });
        };
        addRow(topRow);
        addRow(secondRow);
        addRow(thirdRow);
        addRow(fourthRow);
        addRow(numpadRow);
        return mappings;
    };
    const [keyMappings, setKeyMappings] = useState<KeyMapping[]>(buildDefaultMappings());
    const boundIndices = Array.from(
        new Set(
            keyMappings
                .filter((mapping) => mapping.assignedIndex !== null)
                .map((mapping) => mapping.assignedIndex)
        )
    );
    const unboundMedia = mediaList
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !boundIndices.includes(index));

    // REFS FOR DRAG HANDLING
    const videoDragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
    const imageDragStarts = useRef<{ [key: number]: { mouseX: number; mouseY: number; posX: number; posY: number } }>({});
    const customTextDragStarts = useRef<{ [id: number]: { mouseX: number; mouseY: number; posX: number; posY: number } }>({});

    // PRIMARY AUDIO DROP & TIMELINE HANDLING
    const onPrimaryAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
    };

    const [audioProgress, setAudioProgress] = useState<number>(0);
    useEffect(() => {
        // Ensure we run in the browser
        if (typeof window === "undefined") return;
        const interval = window.setInterval(() => {
            if (primaryAudioRef.current?.duration) {
                setAudioProgress(
                    (primaryAudioRef.current.currentTime / primaryAudioRef.current.duration) * 100
                );
            }
        }, 250);
        return () => clearInterval(interval);
    }, [primaryAudioSrc]);

    // ---------------------
    // Workspace dimensions & fullscreen handling
    // ---------------------
    const [workspaceDimensions, setWorkspaceDimensions] = useState<{ width: number; height: number }>({
        width: containerWidth,
        height: containerHeight,
    });
    const updateWorkspaceDimensions = () => {
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
    };

    const handleToggleFullscreen = (e?: React.MouseEvent<HTMLDivElement>) => {
        if (e) e.preventDefault();
        if (typeof document === "undefined") return;
        const container = document.getElementById("fullscreenContainer");
        if (!container) return;
        try {
            if (!document.fullscreenElement) {
                const request =
                    (container.requestFullscreen as any) ||
                    (container as any).webkitRequestFullscreen ||
                    (container as any).mozRequestFullScreen ||
                    (container as any).msRequestFullscreen;
                const result = request && request.call(container);
                if (result && typeof result.then === "function") {
                    result
                        .then(() => {
                            setIsFullscreen(true);
                            updateWorkspaceDimensions();
                        })
                        .catch((err: any) => console.error("Error entering fullscreen:", err));
                } else {
                    setIsFullscreen(true);
                    updateWorkspaceDimensions();
                }
            } else {
                const exit =
                    (document.exitFullscreen as any) ||
                    (document as any).webkitExitFullscreen ||
                    (document as any).mozCancelFullScreen ||
                    (document as any).msExitFullscreen;
                const result = exit && exit.call(document);
                if (result && typeof result.then === "function") {
                    result
                        .then(() => {
                            setIsFullscreen(false);
                            updateWorkspaceDimensions();
                        })
                        .catch((err: any) => console.error("Error exiting fullscreen:", err));
                } else {
                    setIsFullscreen(false);
                    updateWorkspaceDimensions();
                }
            }
        } catch (err) {
            console.error("Permissions check failed:", err);
        }
    };

    useEffect(() => {
        if (typeof document === "undefined") return;
        const onFSChange = () => {
            setIsFullscreen(document.fullscreenElement !== null);
            updateWorkspaceDimensions();
        };
        document.addEventListener("fullscreenchange", onFSChange);
        if (typeof window !== "undefined") {
            window.addEventListener("resize", updateWorkspaceDimensions);
        }
        return () => {
            document.removeEventListener("fullscreenchange", onFSChange);
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", updateWorkspaceDimensions);
            }
        };
    }, []);

    // ---------------------
    // Initialize default ASCII text
    // ---------------------
    useEffect(() => {
        if (customTexts.length === 0) {
            setCustomTexts([
                {
                    id: Date.now(),
                    text: AsciiArt,
                    isAscii: true,
                    x: 50,
                    y: 50,
                    scale: isFullscreen ? 2.2 : 1.1,
                    flashSpeed: 3,
                    flashIntensity: 5,
                    color: "#00ff00",
                    isDefault: true,
                },
            ]);
        }
    }, []);

    useEffect(() => {
        // Compute the ratio needed to cover the entire workspace
        const ratio = Math.max(
            workspaceDimensions.width / containerWidth,
            workspaceDimensions.height / containerHeight
        );
        // Multiply the ratio by a factor (1.1) to adjust from 2 to 2.2 when needed.
        const adjustedScale = isFullscreen ? ratio * 1.1 : 1.1;
        setCustomTexts((prevTexts) =>
            prevTexts.map((ct) =>
                ct.isAscii
                    ? {
                        ...ct,
                        scale: adjustedScale,
                    }
                    : ct
            )
        );
    }, [isFullscreen, workspaceDimensions]);

    // ---------------------
    // Initialize default media item
    // ---------------------
    useEffect(() => {
        if (mediaList.length === 0) {
            const defaultMedia: MediaItem[] = [
                {
                    type: "image",
                    src: "https://eaccelerate.me/tetsuo/tetsuo-unit-frame.gif",
                    x: 90,
                    y: 10,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                    interruptOnPlay: true,
                },
                {
                    type: "image",
                    src: "https://eaccelerate.me/tetsuo/launchpad-SKRYR.gif",
                    x: 50,
                    y: 50,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                    interruptOnPlay: true,
                },
            ];

            setMediaList(defaultMedia);

            setKeyMappings((prev) => {
                const newMappings = [...prev];

                // Map first media to `Q` (default index 0)
                newMappings[0] = { ...newMappings[0], assignedIndex: 0, mappingType: "media", mode: "toggle" };

                // Map second media to `1` (index 1)
                newMappings[1] = { ...newMappings[1], assignedIndex: 1, mappingType: "media", mode: "toggle" };

                return newMappings;
            });
        }
    }, []);

    // ---------------------
    // Performance counter (optional)
    // ---------------------
    const fpsRef = useRef<number>(performance.now());
    const [fps, setFps] = useState<number>(0);
    useEffect(() => {
        const updateFps = () => {
            const now = performance.now();
            setFps(Math.round(1000 / (now - fpsRef.current)));
            fpsRef.current = now;
            requestAnimationFrame(updateFps);
        };
        updateFps();
    }, []);

    // ---------------------
    // Video playback speed
    // ---------------------
    useEffect(() => {
        if (typeof document === "undefined") return;
        const video = document.getElementById("video-player") as HTMLVideoElement;
        if (video) video.playbackRate = videoSpeed;
    }, [videoSpeed]);

    // ---------------------
    // Global media timer
    // ---------------------
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        setMediaList((prev) =>
            prev.map((media) => ({
                ...media,
                visible: media.isManuallyControlled
                    ? media.visible
                    : media.showAt <= currentTime && media.hideAt >= currentTime,
            }))
        );
    }, [currentTime]);

    // ---------------------
    // Matrix rain background effect
    // ---------------------
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return;

        let canvas = document.getElementById("matrixCanvas") as HTMLCanvasElement;

        // If background is disabled, just clear the canvas instead of removing it
        if (!backgroundEnabled) {
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        // Ensure the canvas is created
        let parentEl = isFullscreen ? document.body : document.getElementById("workspace");
        if (!parentEl) return;

        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "matrixCanvas";
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.zIndex = "-1";
            canvas.style.pointerEvents = "none";
            parentEl.appendChild(canvas);
        }

        // Ensure the canvas is found in the DOM before using `getContext`
        canvas = document.getElementById("matrixCanvas") as HTMLCanvasElement;
        if (!canvas) return; // Safety check

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize canvas properly
        const width = isFullscreen ? window.innerWidth : parentEl.offsetWidth;
        const height = isFullscreen ? window.innerHeight : parentEl.offsetHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const fontSize = 16;
        const columns = Math.floor(width / fontSize);
        const drops = Array(columns).fill(1);

        // Lyrics for random insertion (common + rare)
        const commonLyrics = [
            "Did you feel?",
            "Did you see?",
            "You are here.",
            "Strap in.",
            "Launchpad",
            "SKRYR",
            "Launchpad SKRYR",
            "tetsuo.ai",
            "SYSTEM ONLINE",
            "GATEWAY OPEN",
            "TETSUO",
            "Solana Agents",
        ];

        const rareLyrics = [
            "Launch set.",
            "Visuals burn.",
            "Frequencies higher.",
            "Ghosts hum.",
            "Dreams stream.",
            "Say the word.",
            "Wired deep.",
            "Neon hums.",
            "Keys flash.",
            "Bass drums.",
            "Pixels scream.",
            "Time decays.",
            "Press play.",
            "World erased.",
        ];

        // Store active lyrics that should persist
        let activeLyrics: { text: string; x: number; y: number; life: number }[] = [];

        let intervalId: NodeJS.Timeout;
        let frameCounter = 0;
        const slowFactor = 6; // Slower text drop effect
        const lyricDuration = 44; // Lyrics persist longer

        // Track last lyric timestamps
        let lastCommonLyricTime = Date.now();
        let lastRareLyricTime = Date.now();

        // Ensures text stays within visible canvas
        const getBoundedX = (text: string): number => {
            const textWidth = ctx.measureText(text).width;
            return Math.max(0, Math.min(width - textWidth, Math.random() * (width - textWidth)));
        };

        const getBoundedY = (): number => {
            return Math.max(fontSize, Math.random() * (height - fontSize * 2));
        };

        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "#0f0";
            ctx.font = `${fontSize}px monospace`;

            // Draw active lyrics
            activeLyrics.forEach((lyric) => {
                ctx.fillText(lyric.text, lyric.x, lyric.y);
                lyric.life--;
            });

            // Remove expired lyrics
            activeLyrics = activeLyrics.filter((lyric) => lyric.life > 0);

            // Time-based lyric insertion
            const now = Date.now();
            if (now - lastCommonLyricTime > 3000 + Math.random() * 3000) {
                lastCommonLyricTime = now;
                const text = commonLyrics[Math.floor(Math.random() * commonLyrics.length)];
                activeLyrics.push({ text, x: getBoundedX(text), y: getBoundedY(), life: lyricDuration });
            }

            if (now - lastRareLyricTime > 8000 + Math.random() * 7000) {
                lastRareLyricTime = now;
                const text = rareLyrics[Math.floor(Math.random() * rareLyrics.length)];
                activeLyrics.push({ text, x: getBoundedX(text), y: getBoundedY(), life: lyricDuration });
            }

            for (let i = 0; i < drops.length; i++) {
                if (frameCounter % slowFactor === 0) {
                    const text = String.fromCharCode(33 + Math.random() * 94);
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }
            frameCounter++;
        };

        intervalId = setInterval(() => {
            draw();
        }, 1000 / 60);

        return () => {
            clearInterval(intervalId);
        };
    }, [backgroundEnabled, isFullscreen]);

    // ---------------------
    // Keyboard event handler for media mapping
    // ---------------------
    const triggerKeyMapping = (key: string) => {
        if (key === " " || key.toLowerCase() === "space") {
            handlePlayPause();
            return;
        }

        const mapping = keyMappings.find(
            (m) => m.key.toUpperCase() === key.toUpperCase()
        );
        if (mapping && mapping.assignedIndex !== null) {
            const media = mediaList[mapping.assignedIndex];
            if (!media) return;

            setMediaList((prev) => {
                return prev.map((item, index) => {
                    if (index === mapping.assignedIndex) {
                        return {
                            ...item,
                            visible: !item.visible, // Toggle visibility
                            isManuallyControlled: true,
                        };
                    } else if (media.interruptOnPlay && item.visible) {
                        return { ...item, visible: false }; // Hide other media if this one interrupts
                    }
                    return item;
                });
            });
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const onKeyDown = (e: KeyboardEvent) => {
            triggerKeyMapping(e.key);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [keyMappings, mediaList]);

    // ---------------------
    // Zoom functionality
    // ---------------------
    const handleZoomChange = (delta: number) => {
        setZoomLevel((prev) => clamp(prev + delta, 0.5, 3));
    };
    const removeMedia = (index: number) => {
        const updated = mediaList.filter((_, i) => i !== index);
        setMediaList(updated);
        localStorage.setItem("mediaList", JSON.stringify(updated));
    };

    // ---------------------
    // DRAG HANDLERS for workspace items
    // ---------------------
    const getDeltaPercentages = (
        startX: number,
        startY: number,
        currentX: number,
        currentY: number
    ) => {
        const deltaX = ((currentX - startX) / containerWidth) * 100;
        const deltaY = ((currentY - startY) / containerHeight) * 100;
        return { deltaX, deltaY };
    };
    const onVideoMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        videoDragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            posX: videoPos.x,
            posY: videoPos.y,
        };
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
    };
    const moveElementForward = (index: number) => {
        setMediaList((prev) => {
            if (index >= prev.length - 1) return prev;
            const updated = [...prev];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated;
        });
    };
    const moveElementBackward = (index: number) => {
        setMediaList((prev) => {
            if (index <= 0) return prev;
            const updated = [...prev];
            [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
            return updated;
        });
    };
    const onImageMouseDown = (e: React.MouseEvent, index: number) => {
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
                const { deltaX, deltaY } = getDeltaPercentages(
                    start.mouseX,
                    start.mouseY,
                    ev.clientX,
                    ev.clientY
                );
                const newX = clamp(start.posX + deltaX, 0, 100);
                const newY = clamp(start.posY + deltaY, 0, 100);
                setMediaList((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, x: newX, y: newY } : item))
                );
            }
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            delete imageDragStarts.current[index];
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };
    const onCustomTextMouseDown = (e: React.MouseEvent, id: number) => {
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
                const { deltaX, deltaY } = getDeltaPercentages(
                    start.mouseX,
                    start.mouseY,
                    ev.clientX,
                    ev.clientY
                );
                setCustomTexts((prev) =>
                    prev.map((ct) =>
                        ct.id === id
                            ? { ...ct, x: clamp(start.posX + deltaX, 0, 100), y: clamp(start.posY + deltaY, 0, 100) }
                            : ct
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
    };

    // ---------------------
    // Importing media from the media launchpad keyboard
    // ---------------------
    const handleWorkspaceDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const mediaIndexData = e.dataTransfer.getData("application/x-media-index");

        if (mediaIndexData) {
            const mediaIndex = parseInt(mediaIndexData, 10);

            if (!isNaN(mediaIndex) && mediaList[mediaIndex]) {
                const mediaToImport = { ...mediaList[mediaIndex] };

                setMediaList((prev) => [
                    ...prev,
                    {
                        ...mediaToImport,
                        visible: false, // Ensure it starts hidden
                        interruptOnPlay: mediaToImport.type === "video",
                    },
                ]);
            }
        }
    };

    // ---------------------
    // MEDIA KEYBOARD PANEL
    // ---------------------
    const [showGiphyKeyboard, setShowGiphyKeyboard] = useState(false);

    const handleGifSelect = (gifUrl: string) => {
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

        setMediaList((prev) => [...prev, newMedia]);

        setKeyMappings((prevMappings) => {
            const newMappings = [...prevMappings];
            const newIndex = newMappings.findIndex((m) => m.assignedIndex === null);

            if (newIndex !== -1) {
                newMappings[newIndex] = {
                    ...newMappings[newIndex],
                    assignedIndex: mediaList.length, // Use the new media's index
                    mappingType: "media",
                    mode: isVideo ? "launchpad" : "toggle",
                };
            }

            return newMappings;
        });

        setShowGiphyKeyboard(false);
    };

    const toggleMediaVisibility = (index: number) => {
        setMediaList((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, visible: !item.visible } : item
            )
        );
    };
    const openMediaOptions = (index: number) => {
        setSelectedElement({ type: "media", index });
    };
    const renderKeyboardRow = (row: string[], startIndex: number): React.ReactNode => {
        return (
            <div className="flex gap-1 mb-1 justify-center">
                {row.map((keyLabel, i) => {
                    const mappingIndex = startIndex + i;
                    const mapping = keyMappings[mappingIndex];
                    let cellContent: React.ReactNode = keyLabel;
                    let borderStyle = "border border-transparent"; // Default no border
                    let borderWidth = "border-[1px]"; // Default thin border

                    if (mapping.assignedIndex !== null && mediaList[mapping.assignedIndex]) {
                        const media = mediaList[mapping.assignedIndex];

                        // Show media preview if bound
                        if (media.type === "image") {
                            cellContent = (
                                <img
                                    src={media.src}
                                    alt={keyLabel}
                                    className="w-6 h-6 object-cover"
                                />
                            );
                        }

                        if (media.visible) {
                            // Media is bound and toggled ON → **Thick border**
                            borderStyle = "border border-solid";
                            borderWidth = "border-[3px]";
                        } else {
                            // Media is bound but toggled OFF → **No border**
                            borderStyle = "border border-transparent";
                            borderWidth = "";
                        }
                    } else {
                        // No media bound → **Thin border with computedColor**
                        borderStyle = "border border-solid";
                        borderWidth = "border-[1px]";
                    }

                    return (
                        <div
                            key={mappingIndex}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded cursor-pointer select-none transition-all ${borderStyle} ${borderWidth}`}
                            style={{ borderColor: computedColor }}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("mapping-index", mappingIndex.toString());
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const srcMappingIndexStr = e.dataTransfer.getData("mapping-index");
                                if (srcMappingIndexStr) {
                                    const srcIdx = parseInt(srcMappingIndexStr, 10);
                                    setKeyMappings((prev) => {
                                        const newMappings = [...prev];
                                        const temp = newMappings[mappingIndex];
                                        newMappings[mappingIndex] = newMappings[srcIdx];
                                        newMappings[srcIdx] = temp;
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
    };
    const renderVirtualKeyboardPanel = (): JSX.Element => {
        let currentIndex = 0;
        return (
            <div className="p-2 border border-gray-500 rounded text-white text-center">
                <div className="mb-2 font-bold">
                    Media Launchpad (drag & drop)
                </div>
                {renderKeyboardRow(topRow, currentIndex)}
                {(() => {
                    currentIndex += topRow.length;
                    return null;
                })()}
                {renderKeyboardRow(secondRow, currentIndex)}
                {(() => {
                    currentIndex += secondRow.length;
                    return null;
                })()}
                {renderKeyboardRow(thirdRow, currentIndex)}
                {(() => {
                    currentIndex += thirdRow.length;
                    return null;
                })()}
                {renderKeyboardRow(fourthRow, currentIndex)}
                {(() => {
                    currentIndex += fourthRow.length;
                    return null;
                })()}
                <div className="mt-2">Numpad:</div>
                {renderKeyboardRow(numpadRow, currentIndex)}
            </div>
        );
    };

    // ---------------------
    // PLAYBACK HANDLERS
    // ---------------------
    const handlePlayPause = () => {
        setError(null);
        setIsPlaying((prev) => !prev);
        try {
            if (typeof document !== "undefined") {
                const video = document.getElementById("video-player") as HTMLVideoElement;
                if (video) {
                    video.paused ? video.play() : video.pause();
                }
            }
            if (primaryAudioSrc && primaryAudioRef.current) {
                primaryAudioRef.current.paused
                    ? primaryAudioRef.current.play()
                    : primaryAudioRef.current.pause();
            }
        } catch (err) {
            console.error("Error during playback:", err);
            setError("An unexpected error occurred during playback.");
        }
    };

    const handleStop = () => {
        try {
            if (typeof document !== "undefined") {
                const video = document.getElementById("video-player") as HTMLVideoElement;
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }
            if (primaryAudioSrc && primaryAudioRef.current) {
                primaryAudioRef.current.pause();
                primaryAudioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
        } catch (err) {
            console.error("Error stopping playback:", err);
        }
    };

    const renderOptionsContent = (): JSX.Element | null => {
        if (!selectedElement) return null;

        if (selectedElement.type === "media") {
            const media = mediaList[selectedElement.index];

            return (
                <div className="p-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-sm">
                            Media Options: {media.src.split("/").pop() ?? "Untitled"}
                        </div>
                        <button
                            onClick={() => {
                                setSelectedElement(null);
                            }}
                            className="px-2 py-1 text-sm font-bold bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                        >
                            X
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <Button
                            onClick={() =>
                                setMediaList((prev) =>
                                    prev.map((item, i) =>
                                        i === selectedElement.index
                                            ? { ...item, scale: workspaceDimensions.width / 256 }
                                            : item
                                    )
                                )
                            }
                            className="w-full h-10 text-2xl border-2 border-current text-gray-500"
                            title="Fit Fullscreen"
                        >
                            <i className="fa-solid fa-expand" />
                        </Button>
                        <Button
                            onClick={() =>
                                setMediaList((prev) =>
                                    prev.map((item, i) =>
                                        i === selectedElement.index ? { ...item, x: 50, y: 50 } : item
                                    )
                                )
                            }
                            className="w-full h-10 text-2xl border-2 border-current text-gray-500"
                            title="Center Workspace"
                        >
                            <i className="fa-solid fa-crosshairs" />
                        </Button>
                        <Button
                            onClick={() =>
                                setMediaList((prev) =>
                                    prev.map((item, i) =>
                                        i === selectedElement.index
                                            ? { ...item, interruptOnPlay: !item.interruptOnPlay }
                                            : item
                                    )
                                )
                            }
                            className={`w-full h-10 text-2xl border-2 ${media.interruptOnPlay
                                    ? "border-green-500 text-green-500"
                                    : "border-red-500 text-red-500"
                                }`}
                            title="Toggle Interrupt Others"
                        >
                            <i
                                className={`fa-solid ${media.interruptOnPlay ? "fa-toggle-on" : "fa-toggle-off"
                                    }`}
                            />
                        </Button>
                        <Button
                            onClick={() => moveElementForward(selectedElement.index)}
                            className="w-full h-10 text-2xl border-2 border-current text-gray-500"
                            title="Move Forward"
                        >
                            <i className="fa-solid fa-arrow-up" />
                        </Button>
                        <Button
                            onClick={() => moveElementBackward(selectedElement.index)}
                            className="w-full h-10 text-2xl border-2 border-current text-gray-500"
                            title="Move Backward"
                        >
                            <i className="fa-solid fa-arrow-down" />
                        </Button>
                        <Button
                            onClick={() => {
                                removeMedia(selectedElement.index);
                                setSelectedElement(null);
                            }}
                            className="w-full h-10 text-2xl border-2 border-red-500 text-red-500"
                            title="Remove Media"
                        >
                            <i className="fa-solid fa-trash" />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Scale</span>
                            <Slider
                                min={0.5}
                                max={10}
                                step={0.1}
                                value={[media.scale]}
                                onValueChange={(value: number[]) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, scale: value[0] } : item
                                        )
                                    )
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Rotation</span>
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[media.rotation]}
                                onValueChange={(value: number[]) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, rotation: value[0] } : item
                                        )
                                    )
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Opacity</span>
                            <Slider
                                min={0}
                                max={1}
                                step={0.1}
                                value={[media.opacity]}
                                onValueChange={(value: number[]) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, opacity: value[0] } : item
                                        )
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            );
        } else if (selectedElement.type === "customText") {
            const ct = customTexts[selectedElement.index];
            return (
                <div className="flex flex-col gap-1 max-h-screen overflow-auto">
                    <div className="text-lg font-bold mb-2">ASCII/Text Options</div>
                    {ct.isAscii ? (
                        <textarea
                            value={ct.text || ""}
                            onChange={(e) =>
                                setCustomTexts((prev) =>
                                    prev.map((item, i) =>
                                        i === selectedElement.index ? { ...item, text: e.target.value } : item
                                    )
                                )
                            }
                            className="w-full h-48 bg-gray-text-white p-2 whitespace-pre-wrap border"
                            style={{ backgroundColor: "transparent", borderColor: computedColor }}
                        />
                    ) : (
                        <Input
                            type="text"
                            placeholder="Edit Text"
                            value={ct.text || ""}
                            onChange={(e) =>
                                setCustomTexts((prev) =>
                                    prev.map((item, i) =>
                                        i === selectedElement.index ? { ...item, text: e.target.value } : item
                                    )
                                )
                            }
                        />
                    )}
                    <div className="flex flex-row gap-1">
                        <Input
                            type="color"
                            value={ct.color}
                            onChange={(e) =>
                                setCustomTexts((prev) =>
                                    prev.map((item, i) =>
                                        i === selectedElement.index ? { ...item, color: e.target.value } : item
                                    )
                                )
                            }
                            className="w-2/3"
                        />
                        <Button
                            onClick={() => {
                                setCustomTexts((prev) => prev.filter((_, i) => i !== selectedElement.index));
                                setSelectedElement(null);
                            }}
                            className="w-full h-10 text-2xl bg-red-600"
                            title="Remove Text"
                        >
                            🗑
                        </Button>
                    </div>
                </div>
            );
        }
        return null;
    };

    // ---------------------
    // RENDER
    // ---------------------
    return (
        <>
            {/* Global CSS */}
            <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          color: ${computedColor};
        }
      `}</style>
            <div
                id="fullscreenContainer"
                className="relative text-white overflow-hidden"
                style={{
                    background: isFullscreen
                        ? "#000"
                        : `url(https://eaccelerate.me/tetsuo/skryr-bg.png)`,
                    margin: 0,
                    padding: 0,
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                    color: computedColor,
                }}
            >
                <SkryrPalette
                    isFullscreen={isFullscreen}
                    handleToggleFullscreen={handleToggleFullscreen}
                    showPalette={showPalette}
                    setShowPalette={setShowPalette}
                    backgroundEnabled={backgroundEnabled}
                    setBackgroundEnabled={setBackgroundEnabled}
                    embeddedMode={embeddedMode}
                    setEmbeddedMode={setEmbeddedMode}
                >
                    <SkryrToolbar
                        isPlaying={isPlaying}
                        handlePlayPause={handlePlayPause}
                        handleStop={handleStop}
                        handleZoomChange={handleZoomChange}
                        handleToggleFullscreen={handleToggleFullscreen}
                        isFullscreen={isFullscreen}
                        showPalette={showPalette}
                        setShowPalette={setShowPalette}
                        backgroundEnabled={backgroundEnabled}
                        setBackgroundEnabled={setBackgroundEnabled}
                        embeddedMode={embeddedMode}
                        setEmbeddedMode={setEmbeddedMode}
                        primaryAudioSrc={primaryAudioSrc}
                        primaryAudioRef={primaryAudioRef}
                        audioProgress={audioProgress}
                        setAudioProgress={setAudioProgress}
                        onPrimaryAudioDrop={onPrimaryAudioDrop}
                        renderVirtualKeyboardPanel={renderVirtualKeyboardPanel}
                        selectedElement={selectedElement}
                        showGiphyKeyboard={showGiphyKeyboard}
                        setShowGiphyKeyboard={setShowGiphyKeyboard}
                        handleGifSelect={handleGifSelect}
                        mediaList={mediaList}
                        keyMappings={keyMappings}
                        onToggleMedia={toggleMediaVisibility}
                        onOpenOptions={openMediaOptions}
                        renderOptionsContent={renderOptionsContent}
                        setKeyMappings={setKeyMappings}
                        onDeselectElement={handleDeselectElement}
                        setMediaList={setMediaList}
                        showToolsInFullscreen={false}
                        setShowToolsInFullscreen={() => { }}
                        toggleMatrixMode={() => { }}
                        toggleAsciiMode={() => { }}
                        isMatrixModeActive={false}
                        isAsciiModeActive={false}
                    />
                </SkryrPalette>
                {/* Workspace Container */}
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
                        }}
                    >
                        {/* Render custom texts */}
                        {embeddedMode &&
                            customTexts.map((ct) => (
                                <div
                                    key={ct.id}
                                    onMouseDown={(e) => onCustomTextMouseDown(e, ct.id)}
                                    onDoubleClick={() =>
                                        setSelectedElement({
                                            type: "customText",
                                            index: customTexts.findIndex((item) => item.id === ct.id),
                                        })
                                    }
                                    className="absolute select-none"
                                    style={{
                                        top: `${ct.y}%`,
                                        left: `${ct.x}%`,
                                        transform: `translate(-50%, -50%) scale(${ct.scale})`,
                                        cursor: "move",
                                    }}
                                >
                                    <pre style={{ color: ct.color, whiteSpace: "pre-wrap" }}>
                                        {ct.text}
                                    </pre>
                                </div>
                            ))}
                        {/* Render all media items */}
                        {mediaList.map(
                            (item, index) =>
                                item.visible && (
                                    <div
                                        key={index}
                                        style={{
                                            position: "absolute",
                                            left: `${item.x}%`,
                                            top: `${item.y}%`,
                                            transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
                                            opacity: item.opacity,
                                            border: boundIndices.includes(index)
                                                ? "2px solid yellow"
                                                : "1px solid gray",
                                        }}
                                        onMouseDown={(e) => onImageMouseDown(e, index)}
                                        onDoubleClick={() =>
                                            setSelectedElement({ type: "media", index })
                                        }
                                    >
                                        {item.type === "video" ? (
                                            <video
                                                id="video-player"
                                                src={item.src}
                                                className="w-64 border border-gray-700 rounded-md"
                                                loop
                                                autoPlay
                                                muted
                                            />
                                        ) : item.type === "image" ? (
                                            <img src={item.src} alt="Media" className="max-w-[300px]" draggable={false} />
                                        ) : null}
                                    </div>
                                )
                        )}
                    </div>
                </div>
                <div className="pb-40"></div>
            </div>
        </>
    );
};

export default SkryrPage;
