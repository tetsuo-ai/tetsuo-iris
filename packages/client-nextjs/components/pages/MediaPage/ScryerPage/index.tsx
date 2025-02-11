"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Slider from "@/components/ui/slider";
import ScryerToolbar from "@/components/ui/scryer-toolbar";
import ScryerPalette from "@/components/ui/scryer-palette";
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

// Virtual Keyboard Layout
const topRow = ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];
const secondRow = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"];
const thirdRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];
const fourthRow = ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"];
const numpadRow = ["7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "0", "."];

// Workspace dimensions & helper
const containerWidth = 800;
const containerHeight = 450;
const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

const ScryerPage = () => {
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
    const [videoPos, setVideoPos] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [showPalette, setShowPalette] = useState<boolean>(true);
    const [showToolsInFullscreen, setShowToolsInFullscreen] = useState<boolean>(true);
    const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);

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

    // REFS FOR DRAG HANDLING (for video, images, custom texts)
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
        const interval = window.setInterval(() => {
            if (primaryAudioRef.current?.duration) {
                setAudioProgress(
                    (primaryAudioRef.current.currentTime / primaryAudioRef.current.duration) * 100
                );
            }
        }, 250);
        return () => clearInterval(interval);
    }, [primaryAudioSrc]);

    // Global F10 toggles palette
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === "F10") {
                e.preventDefault();
                setShowPalette((prev) => !prev);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // ---------------------
    // Workspace dimensions & fullscreen handling
    // ---------------------
    const [workspaceDimensions, setWorkspaceDimensions] = useState<{ width: number; height: number }>({
        width: containerWidth,
        height: containerHeight,
    });
    const updateWorkspaceDimensions = () => {
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

    // Request full screen on a wrapping container (so that palette and workspace remain visible)
    const handleToggleFullscreen = () => {
        const container = document.getElementById("fullscreenContainer");
        if (!container) return;
        if (!document.fullscreenElement) {
            container
                .requestFullscreen()
                .then(() => {
                    setIsFullscreen(true);
                    updateWorkspaceDimensions();
                })
                .catch((err) => console.error("Error entering fullscreen:", err));
        } else {
            document
                .exitFullscreen()
                .then(() => {
                    setIsFullscreen(false);
                    updateWorkspaceDimensions();
                })
                .catch((err) => console.error("Error exiting fullscreen:", err));
        }
    };

    useEffect(() => {
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
    }, []);

    // ---------------------
    // Initialize default ASCII text using the preloaded string
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
                    scale: isFullscreen ? 2.2 : 1,
                    flashSpeed: 3,
                    flashIntensity: 5,
                    color: "#00ff00",
                    isDefault: true,
                },
            ]);
        }
    }, []);

    // ---------------------
    // Initialize default media item
    // ---------------------
    useEffect(() => {
        if (mediaList.length === 0) {
            const defaultMedia: MediaItem = {
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
            };
            setMediaList([defaultMedia]);
            setKeyMappings((prev) => {
                const newMappings = [...prev];
                newMappings[0] = { ...newMappings[0], assignedIndex: 0, mappingType: "media", mode: "toggle" };
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
            prev.map((media) =>
                media.isManuallyControlled
                    ? media
                    : { ...media, visible: media.showAt <= currentTime && media.hideAt >= currentTime }
            )
        );
    }, [currentTime]);

    // ---------------------
    // Matrix rain background
    // ---------------------
    useEffect(() => {
        const workspace = document.getElementById("workspace");
        if (!workspace) return;
        let canvas = document.getElementById("matrixCanvas") as HTMLCanvasElement;
        if (!backgroundEnabled) {
            if (canvas) canvas.remove();
            return;
        }
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "matrixCanvas";
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.zIndex = "0";
            canvas.style.pointerEvents = "none";
            workspace.appendChild(canvas);
        }
        canvas.width = workspace.clientWidth;
        canvas.height = workspace.clientHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const fontSize = 16;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = Array(columns).fill(1);
        const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#0f0";
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < drops.length; i++) {
                const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                ctx.fillText(text, x, y);
                if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, [backgroundEnabled, isFullscreen]);

    // ---------------------
    // Keyboard event handler for media mapping
    // ---------------------
    const triggerKeyMapping = (key: string) => {
        if (key === " " || key.toLowerCase() === "space") {
            handlePlayPause();
            return;
        }
        const mapping = keyMappings.find((m) => m.key.toUpperCase() === key.toUpperCase());
        if (mapping && mapping.assignedIndex !== null) {
            const media = mediaList[mapping.assignedIndex];
            if (!media) return;
            if (mapping.mappingType === "media") {
                if (mapping.mode === "toggle") {
                    if (media.interruptOnPlay) {
                        setMediaList((prev) =>
                            prev.map((item, index) =>
                                index !== mapping.assignedIndex && item.type === media.type
                                    ? { ...item, visible: false, isManuallyControlled: true }
                                    : item
                            )
                        );
                    }
                    setMediaList((prev) =>
                        prev.map((item, index) =>
                            index === mapping.assignedIndex
                                ? { ...item, visible: !item.visible, isManuallyControlled: true }
                                : item
                        )
                    );
                } else if (mapping.mode === "launchpad") {
                    setMediaList((prev) =>
                        prev.map((item, index) =>
                            index === mapping.assignedIndex
                                ? { ...item, visible: true, isManuallyControlled: true }
                                : { ...item, visible: false, isManuallyControlled: true }
                        )
                    );
                }
            }
        }
    };
    useEffect(() => {
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
    const getDeltaPercentages = (startX: number, startY: number, currentX: number, currentY: number) => {
        const deltaX = ((currentX - startX) / containerWidth) * 100;
        const deltaY = ((currentY - startY) / containerHeight) * 100;
        return { deltaX, deltaY };
    };
    const onVideoMouseDown = (e: React.MouseEvent) => {
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
    };

    // ---------------------
    // MEDIA KEYBOARD PANEL
    // ---------------------
    const renderKeyboardRow = (row: string[], startIndex: number): ReactNode => {
        return (
            <div className="flex gap-1 mb-1 justify-center">
                {row.map((keyLabel, i) => {
                    const mappingIndex = startIndex + i;
                    const mapping = keyMappings[mappingIndex];
                    let cellContent: ReactNode = keyLabel;
                    if (mapping.assignedIndex !== null && mediaList[mapping.assignedIndex]) {
                        const media = mediaList[mapping.assignedIndex];
                        if (media.type === "image") {
                            cellContent = <img src={media.src} alt={keyLabel} className="w-6 h-6 object-cover" />;
                        }
                    }
                    return (
                        <div
                            key={mappingIndex}
                            className="w-8 h-8 flex items-center justify-center text-xs border rounded cursor-pointer select-none"
                            style={{
                                backgroundColor:
                                    mapping.assignedIndex !== null && mediaList[mapping.assignedIndex]
                                        ? mediaList[mapping.assignedIndex].visible
                                            ? "green"
                                            : "red"
                                        : "gray",
                            }}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("mapping-index", mappingIndex.toString());
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                const srcIdxStr = e.dataTransfer.getData("mapping-index");
                                if (srcIdxStr) {
                                    const srcIdx = parseInt(srcIdxStr, 10);
                                    setKeyMappings((prev) => {
                                        const newMappings = [...prev];
                                        const temp = newMappings[mappingIndex];
                                        newMappings[mappingIndex] = newMappings[srcIdx];
                                        newMappings[srcIdx] = temp;
                                        return newMappings;
                                    });
                                } else {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        const file = e.dataTransfer.files[0];
                                        const fileURL = URL.createObjectURL(file);
                                        const fileType = file.type;
                                        if (fileType.startsWith("audio")) return;
                                        let newType: MediaItem["type"] = "image";
                                        if (fileType.startsWith("video")) newType = "video";
                                        const newMedia: MediaItem = {
                                            type: newType,
                                            src: fileURL,
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
                                    } else {
                                        const textData = e.dataTransfer.getData("text/plain");
                                        if (textData && textData.startsWith("http")) {
                                            if (textData.match(/\.(mp3|wav|ogg)$/i)) return;
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
                                    }
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
            <div className="p-2 border border-gray-500 bg-gray-800 rounded text-white text-center">
                <div className="mb-2 font-bold">Media Launchpad (drag & drop)</div>
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
            const video = document.getElementById("video-player") as HTMLVideoElement;
            if (video) {
                video.paused ? video.play() : video.pause();
            }
            if (primaryAudioSrc && primaryAudioRef.current) {
                primaryAudioRef.current.paused ? primaryAudioRef.current.play() : primaryAudioRef.current.pause();
            }
        } catch (err) {
            console.error("Error during playback:", err);
            setError("An unexpected error occurred during playback.");
        }
    };

    const handleRewind = () => {
        try {
            const video = document.getElementById("video-player") as HTMLVideoElement;
            if (video) video.currentTime = Math.max(0, video.currentTime - 5);
            if (primaryAudioSrc && primaryAudioRef.current) {
                primaryAudioRef.current.currentTime = Math.max(0, primaryAudioRef.current.currentTime - 5);
            }
        } catch (err) {
            console.error("Error during rewind:", err);
        }
    };

    const handleFastForward = () => {
        try {
            const video = document.getElementById("video-player") as HTMLVideoElement;
            if (video) video.currentTime = Math.min(video.duration, video.currentTime + 5);
            if (primaryAudioSrc && primaryAudioRef.current) {
                primaryAudioRef.current.currentTime = Math.min(
                    primaryAudioRef.current.duration,
                    primaryAudioRef.current.currentTime + 5
                );
            }
        } catch (err) {
            console.error("Error during fast forward:", err);
        }
    };

    const handleStop = () => {
        try {
            const video = document.getElementById("video-player") as HTMLVideoElement;
            if (video) {
                video.pause();
                video.currentTime = 0;
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
                <div className="flex flex-col gap-1 max-h-screen overflow-auto">
                    <div className="text-lg font-bold mb-2">Media Options: {media.src.split('/').pop() || `Media ${selectedElement.index + 1}`}</div>
                    {/* Button Group */}
                    <div className="grid grid-cols-3 gap-1">
                        <Button onClick={() => setMediaList((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, scale: workspaceDimensions.width / 256 } : item))} className="w-full h-10 text-2xl bg-purple-500" title="Fit Fullscreen">⛶</Button>
                        <Button onClick={() => setMediaList((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, x: 50, y: 50 } : item))} className="w-full h-10 text-2xl bg-blue-500" title="Center Workspace">⌖</Button>
                        <Button onClick={() => setMediaList((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, interruptOnPlay: !item.interruptOnPlay } : item))} className={`w-full h-10 text-2xl ${media.interruptOnPlay ? "bg-green-600" : "bg-red-600"}`} title="Toggle Interrupt Others">{media.interruptOnPlay ? "🟢" : "🔴"}</Button>
                        <Button onClick={() => moveElementForward(selectedElement.index)} className="w-full h-10 text-2xl bg-blue-500" title="Move Forward">⏩</Button>
                        <Button onClick={() => moveElementBackward(selectedElement.index)} className="w-full h-10 text-2xl bg-blue-500" title="Move Backward">⏪</Button>
                        <Button onClick={() => { removeMedia(selectedElement.index); setSelectedElement(null); }} className="w-full h-10 text-2xl bg-red-600" title="Remove Media">🗑</Button>
                    </div>

                    {/* Sliders Section */}
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Scale</span>
                            <Slider min={0.5} max={10} step={0.1} value={[media.scale]} onValueChange={(value: number[]) => setMediaList((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, scale: value[0] } : item))} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Rotation</span>
                            <Slider min={0} max={360} step={1} value={[media.rotation]} onValueChange={(value: number[]) => setMediaList((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, rotation: value[0] } : item))} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm">Opacity</span>
                            <Slider min={0} max={1} step={0.1} value={[media.opacity]} onValueChange={(value: number[]) => setMediaList((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, opacity: value[0] } : item))} />
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
                        <textarea value={ct.text || ""} onChange={(e) => setCustomTexts((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, text: e.target.value } : item))} className="w-full h-48 bg-gray-800 text-white p-2 whitespace-pre-wrap" />
                    ) : (
                        <Input type="text" placeholder="Edit Text" value={ct.text || ""} onChange={(e) => setCustomTexts((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, text: e.target.value } : item))} />
                    )}
                    <div className="flex flex-row gap-1">
                        <Input type="color" value={ct.color} onChange={(e) => setCustomTexts((prev) => prev.map((item, i) => i === selectedElement.index ? { ...item, color: e.target.value } : item))} className="w-2/3" />
                        <Button onClick={() => { setCustomTexts((prev) => prev.filter((_, i) => i !== selectedElement.index)); setSelectedElement(null); }} className="w-full h-10 text-2xl bg-red-600" title="Remove Text">🗑</Button>
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
        // Wrap palette and workspace in a container so that full screen includes both.
        <div id="fullscreenContainer" className="relative w-full min-h-screen bg-black text-white overflow-hidden">
            {/* Palette (with drag-handle) */}
            <ScryerPalette
                isFullscreen={isFullscreen}
                handleToggleFullscreen={handleToggleFullscreen}
                showPalette={showPalette}
                setShowPalette={setShowPalette}
                showToolsInFullscreen={showToolsInFullscreen}
                setShowToolsInFullscreen={setShowToolsInFullscreen}
                backgroundEnabled={backgroundEnabled}
                setBackgroundEnabled={setBackgroundEnabled}
                embeddedMode={embeddedMode}
                setEmbeddedMode={setEmbeddedMode}
            >
                <ScryerToolbar
                    isPlaying={isPlaying}
                    handlePlayPause={handlePlayPause}
                    handleRewind={handleRewind}
                    handleStop={handleStop}
                    handleFastForward={handleFastForward}
                    handleZoomChange={handleZoomChange}
                    handleToggleFullscreen={handleToggleFullscreen}
                    isFullscreen={isFullscreen}
                    showToolsInFullscreen={showToolsInFullscreen}
                    setShowToolsInFullscreen={setShowToolsInFullscreen}
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
                    renderOptionsContent={/* Pass your renderOptionsContent function here */ renderOptionsContent}
                />
            </ScryerPalette>

            {/* Workspace */}
            <div
                id="workspace"
                style={{
                    position: "relative",
                    margin: "60px auto 0 auto",
                    transform: `scale(${zoomLevel})`,
                    width: `${workspaceDimensions.width}px`,
                    height: `${workspaceDimensions.height}px`,
                    border: "1px solid white",
                    background: "transparent",
                    transformOrigin: "top center",
                    overflow: "hidden",
                }}
            >
                {/* Render custom texts as preformatted text */}
                {embeddedMode &&
                    customTexts.map((ct) => (
                        <div
                            key={ct.id}
                            onMouseDown={(e) => onCustomTextMouseDown(e, ct.id)}
                            onDoubleClick={() =>
                                setSelectedElement({ type: "customText", index: customTexts.findIndex((item) => item.id === ct.id) })
                            }
                            className="absolute select-none"
                            style={{
                                top: `${ct.y}%`,
                                left: `${ct.x}%`,
                                transform: `translate(-50%, -50%) scale(${ct.scale})`,
                                cursor: "move",
                            }}
                        >
                            <pre style={{ color: ct.color, whiteSpace: "pre-wrap" }}>{ct.text}</pre>
                        </div>
                    ))}
                {/* Render media items */}
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
                                    border:
                                        selectedElement &&
                                            selectedElement.type === "media" &&
                                            selectedElement.index === index
                                            ? "2px solid yellow"
                                            : "1px solid gray",
                                }}
                                onMouseDown={(e) => onImageMouseDown(e, index)}
                                onDoubleClick={() => setSelectedElement({ type: "media", index })}
                            >
                                {item.type === "video" ? (
                                    <video
                                        id="video-player"
                                        src={item.src}
                                        className="w-64 border border-gray-700 rounded-md"
                                        controls
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
            <div className="pb-40"></div>
        </div>
    );
};

export default ScryerPage;
