"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Workspace } from "./Workspace";
import { useEffects } from "./hooks/useEffects";
import { WebampMilkdrop } from "./WebampMilkdrop";
import VirtualKeyboard, { KeyMapping, MediaItem } from "./VirtualKeyboard";
import { useFullscreen } from "./hooks/useFullscreen";
import { useMediaState, CustomTextItem } from "./hooks/useMediaState";
import { useDrag } from "./hooks/useDrag";
import { useAudioSetup } from "./audioSetup";
import { Button } from "@/components/ui/button";
import Slider from "@/components/ui/slider";

const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

const SkryrToolbar = dynamic(() => import("@/components/ui/skryr/skryr-toolbar"), { ssr: false });
const SkryrPalette = dynamic(() => import("@/components/ui/skryr/skryr-palette"), { ssr: false });

type SelectedElement = { type: "media" | "customText"; index: number } | null;

const SkryrPage: React.FC<{ backgroundEnabled?: boolean }> = ({ backgroundEnabled = true }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!isClient) return; // ✅ This is allowed

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isClient]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [matrixEnabled, setMatrixEnabled] = useState(true);
    const [asciiEnabled, setAsciiEnabled] = useState(true);
    const [visualizerEnabled, setVisualizerEnabled] = useState(backgroundEnabled);
    const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(32));
    const [zoomLevel, setZoomLevel] = useState(1);
    const [primaryAudioSrc, setPrimaryAudioSrc] = useState<string>("");
    const [fps, setFps] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [webampReady, setWebampReady] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [showGiphyKeyboard, setShowGiphyKeyboard] = useState(true);
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);
    const [showMediaPanel, setShowMediaPanel] = useState(true);
    const [showUnboundMediaList, setShowUnboundMediaList] = useState(true);
    const [showPalette, setShowPalette] = useState(true);
    const [countdown, setCountdown] = useState<number>(10);
    // const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    const audioRef = useRef<HTMLAudioElement>(null);
    const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
    const barCanvasRef = useRef<HTMLCanvasElement>(null);
    const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

    const { isFullscreen, workspaceDimensions, handleToggleFullscreen } = useFullscreen();
    const { mediaList, setMediaList, customTexts, setCustomTexts, keyMappings, setKeyMappings } = useMediaState(isFullscreen);
    const { onImageMouseDown, onCustomTextMouseDown } = useDrag(mediaList, customTexts, setMediaList, setCustomTexts);
    const { audioContext, analyser } = useAudioSetup(audioRef.current);
    const [computedColor, setComputedColor] = useState("#00ff00");

    // Help tips matching F1 glossary
    const helpTips = [
        "NEW: Right click on the Winamp Milkdrop visualizer to enable Desktop mode.",
        "Press 'Tab' to toggle all panels.",
        "Press 'F1' for help.",
        "Press 'F2' to toggle the launchpad keyboard.",
        "Press 'F3' to toggle media tabs.",
        "Press 'F4' to toggle unbound media items.",
        "Press 'F7' to toggle ASCII mode.",
        "Press 'F8' to toggle matrix mode.",
        "Press 'Space' to play or pause.",
        "Press 'F9' to stop playback.",
        "Press 'F10' to stop and restart playback.",
        "Press 'F11' to toggle fullscreen mode.",
        "Press 'PageUp' to zoom in.",
        "Press 'PageDown' to zoom out.",
    ];
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const onSelectElement = useCallback((elem: SelectedElement) => {
        setSelectedElement(elem);
    }, []);
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: `100vw`,
                height: `100vh`
            });
        };

        handleResize(); // Set initial size
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    // Moved useCallback declarations before useEffect
    const togglePlayPause = useCallback(() => {
        setIsPlaying((prev) => {
            const newState = !prev;
            if (audioRef.current) {
                if (newState) {
                    audioRef.current.play().catch((e) => console.error("Play error:", e));
                } else {
                    audioRef.current.pause();
                }
            }
            return newState;
        });
    }, []);

    const handleStop = useCallback(() => {
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    const handleStart = useCallback(() => {
        setIsStarted(true);
        if (webampReady && audioRef.current && audioReady) {
            audioRef.current.play().catch((e) => console.error("Start play error:", e));
            setIsPlaying(true);
        }
    }, [webampReady, audioReady]);

    const handleWebampReady = useCallback(() => {
        setWebampReady(true);
    }, []);

    const handleGifSelect = useCallback((gifUrl: string) => {
        setMediaList((prev: MediaItem[]) => [
            ...prev,
            {
                type: "image",
                src: gifUrl,
                x: 50,
                y: 50,
                scale: 1,
                rotation: 0,
                opacity: 1,
                visible: true,
                interruptOnPlay: false,
                isManuallyControlled: true,
                showAt: 0,
                hideAt: Infinity,
            } as MediaItem,
        ]);
        setShowGiphyKeyboard(false);
    }, [setMediaList]);

    // Countdown and tip rotation
    useEffect(() => {
        if (!isStarted && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isStarted, countdown]);

    useEffect(() => {
        if (!isStarted) {
            const tipTimer = setInterval(() => {
                setCurrentTipIndex((prev) => (prev + 1) % helpTips.length);
            }, 10000);
            return () => clearInterval(tipTimer);
        }
    }, [isStarted, helpTips.length]);

    useEffect(() => {
        if (audioContext && analyser && audioRef.current) {
            setAudioReady(true);
            (window as any).sharedAudioElement = audioRef.current;
            console.log("Audio setup complete in SkryrPage");
        }
    }, [audioContext, analyser]);

    useEffect(() => {
        if (!isStarted || !webampReady || !audioReady || !analyser) return;
        let rafId: number;
        const updateAudioData = () => {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            setAudioData(data);
            rafId = requestAnimationFrame(updateAudioData);
        };
        rafId = requestAnimationFrame(updateAudioData);
        return () => cancelAnimationFrame(rafId);
    }, [isStarted, webampReady, audioReady, analyser]);

    useEffect(() => {
        let rafId: number;
        const fpsRef = { current: performance.now() };
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
        const onKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case " ":
                    togglePlayPause();
                    break;
                case "tab":
                    setShowPalette((prev) => !prev);
                    setShowVirtualKeyboard((prev) => !prev);
                    setShowMediaPanel((prev) => !prev);
                    setShowUnboundMediaList((prev) => !prev);
                    break;
                case "f1":
                    console.log("Help: Press F1 again to hide this log.");
                    break;
                case "f2":
                    setShowVirtualKeyboard((prev) => !prev);
                    break;
                case "f3":
                    setShowMediaPanel((prev) => !prev);
                    break;
                case "f4":
                    setShowUnboundMediaList((prev) => !prev);
                    break;
                case "f7":
                    setAsciiEnabled((prev) => !prev);
                    break;
                case "f8":
                    setMatrixEnabled((prev) => !prev);
                    break;
                case "f9":
                    handleStop();
                    break;
                case "f10":
                    handleStop();
                    togglePlayPause();
                    break;
                case "f11":
                    handleToggleFullscreen();
                    break;
                case "pageup":
                    setZoomLevel((prev) => clamp(prev + 0.1, 0.5, 3));
                    break;
                case "pagedown":
                    setZoomLevel((prev) => clamp(prev - 0.1, 0.5, 3));
                    break;
                default:
                    const mapping = keyMappings.find((m) => m.key.toUpperCase() === e.key.toUpperCase());
                    if (mapping && mapping.assignedIndex !== null) {
                        const media = mediaList[mapping.assignedIndex];
                        if (media) {
                            setMediaList((prev) =>
                                prev.map((item, i) =>
                                    i === mapping.assignedIndex
                                        ? { ...item, visible: !item.visible, isManuallyControlled: true }
                                        : item.interruptOnPlay && media.visible
                                        ? { ...item, visible: false }
                                        : item
                                )
                            );
                        }
                    }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [keyMappings, mediaList, setMediaList, handleToggleFullscreen, togglePlayPause, handleStop]);

    const { computedColor: effectsColor, analyserRef } = useEffects({
        matrixEnabled,
        visualizerEnabled,
        matrixCanvasRef,
        visualizerCanvasRef,
        barCanvasRef,
        audioContext,
        audioData,
        isFullscreen,
        isPlaying,
        computedColor,
    });

    const renderVirtualKeyboardPanel = useCallback(
        () => (
            <VirtualKeyboard
                keyMappings={keyMappings}
                mediaList={mediaList}
                setKeyMappings={setKeyMappings}
                setMediaList={setMediaList}
                computedColor={computedColor}
                onSelectElement={onSelectElement}
            />
        ),
        [keyMappings, mediaList, setKeyMappings, setMediaList, computedColor, onSelectElement]
    );

    const renderOptionsContent = useCallback(() => {
        if (!selectedElement) return <div className="text-xs">Double-click an element to tweak it</div>;

        if (selectedElement.type === "media") {
            const media = mediaList[selectedElement.index];
            return (
                <div className="p-2 flex flex-col gap-2 text-black">
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
                            className={`w-full h-10 text-2xl border-2 ${media.interruptOnPlay ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}
                            title="Toggle Interrupt Others"
                        >
                            <i className={`fa-solid ${media.interruptOnPlay ? "fa-toggle-on" : "fa-toggle-off"}`} />
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedElement.index < mediaList.length - 1) {
                                    const newList = [...mediaList];
                                    [newList[selectedElement.index], newList[selectedElement.index + 1]] = [
                                        newList[selectedElement.index + 1],
                                        newList[selectedElement.index],
                                    ];
                                    setMediaList(newList);
                                }
                            }}
                            className="w-full h-10 text-2xl border-2 border-current text-gray-500"
                            title="Move Forward"
                        >
                            <i className="fa-solid fa-arrow-up" />
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedElement.index > 0) {
                                    const newList = [...mediaList];
                                    [newList[selectedElement.index], newList[selectedElement.index - 1]] = [
                                        newList[selectedElement.index - 1],
                                        newList[selectedElement.index],
                                    ];
                                    setMediaList(newList);
                                }
                            }}
                            className="w-full h-10 text-2xl border-2 border-current text-gray-500"
                            title="Move Backward"
                        >
                            <i className="fa-solid fa-arrow-down" />
                        </Button>
                        <Button
                            onClick={() => {
                                setMediaList((prev) => prev.filter((_, i) => i !== selectedElement.index));
                                setSelectedElement(null);
                            }}
                            className="w-full h-10 text-2xl border-2 border-red-500 text-red-500"
                            title="Remove Media"
                        >
                            <i className="fa-solid fa-trash" />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-arrows-left-right" title="X Position (%)" />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[media.x]}
                                onValueChange={(value) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, x: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{media.x.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-arrows-up-down" title="Y Position (%)" />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[media.y]}
                                onValueChange={(value) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, y: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{media.y.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-expand" title="Scale" />
                            <Slider
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={[media.scale]}
                                onValueChange={(value) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, scale: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{media.scale.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-rotate" title="Rotation (deg)" />
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[media.rotation]}
                                onValueChange={(value) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, rotation: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{media.rotation.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-eye" title="Opacity" />
                            <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={[media.opacity]}
                                onValueChange={(value) =>
                                    setMediaList((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, opacity: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{media.opacity.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            );
        } else if (selectedElement.type === "customText") {
            const ct = customTexts[selectedElement.index];
            return (
                <div className="flex flex-col gap-1 max-h-screen overflow-auto text-black">
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
                            className="w-full h-48 bg-transparent p-2 whitespace-pre-wrap border"
                            style={{ borderColor: computedColor }}
                        />
                    ) : (
                        <input
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
                            className="w-full p-2 border"
                            style={{ borderColor: computedColor }}
                        />
                    )}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-arrows-left-right" title="X Position (%)" />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[ct.x]}
                                onValueChange={(value) =>
                                    setCustomTexts((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, x: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{ct.x.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-arrows-up-down" title="Y Position (%)" />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[ct.y]}
                                onValueChange={(value) =>
                                    setCustomTexts((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, y: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{ct.y.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-expand" title="Scale" />
                            <Slider
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={[ct.scale]}
                                onValueChange={(value) =>
                                    setCustomTexts((prev) =>
                                        prev.map((item, i) =>
                                            i === selectedElement.index ? { ...item, scale: value[0] } : item
                                        )
                                    )
                                }
                                className="flex-1"
                            />
                            <span className="text-sm w-12 text-right">{ct.scale.toFixed(1)}</span>
                        </div>
                        <div className="flex flex-row gap-1">
                            <input
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
                </div>
            );
        }
        return null;
    }, [selectedElement, mediaList, customTexts, setMediaList, setCustomTexts, workspaceDimensions, computedColor]);

    return (
        <div id="fullscreenContainer" style={{ width: "100vw", height: "100vh" }}>
            <audio ref={audioRef} style={{ display: "none" }} />
            <div
                className="relative text-white overflow-hidden"
                style={{ width: "100vw", height: "100vh", background: "transparent" }}
            >
                {audioReady && (
                    <WebampMilkdrop
                        onTrackDrop={() => {}}
                        isPlaying={isPlaying}
                        onPlayPause={togglePlayPause}
                        onStop={handleStop}
                        onReady={handleWebampReady}
                        visualizerCanvasRef={visualizerCanvasRef}
                    />
                )}
                <Suspense fallback={<div>Loading...</div>}>
                    <SkryrPalette
                        isFullscreen={isFullscreen}
                        handleToggleFullscreen={handleToggleFullscreen}
                        showPalette={showPalette}
                        setShowPalette={setShowPalette}
                        backgroundEnabled={visualizerEnabled}
                        setBackgroundEnabled={setVisualizerEnabled}
                        computedColor={computedColor}
                        setComputedColor={setComputedColor}
                    >
                        <SkryrToolbar
                            isPlaying={isPlaying}
                            handlePlayPause={togglePlayPause}
                            handleStop={handleStop}
                            handleZoomChange={(delta: number) =>
                                setZoomLevel((prev) => clamp(prev + delta, 0.5, 3))
                            }
                            handleToggleFullscreen={handleToggleFullscreen}
                            isFullscreen={isFullscreen}
                            showToolsInFullscreen={true}
                            setShowToolsInFullscreen={() => {}}
                            showPalette={showPalette}
                            setShowPalette={setShowPalette}
                            backgroundEnabled={visualizerEnabled}
                            setBackgroundEnabled={setVisualizerEnabled}
                            embeddedMode={matrixEnabled}
                            setEmbeddedMode={setMatrixEnabled}
                            primaryAudioSrc={primaryAudioSrc}
                            primaryAudioRef={audioRef}
                            onPrimaryAudioDrop={() => {}}
                            selectedElement={selectedElement}
                            renderOptionsContent={renderOptionsContent}
                            mediaList={mediaList}
                            keyMappings={keyMappings}
                            setKeyMappings={setKeyMappings}
                            setMediaList={setMediaList}
                            renderVirtualKeyboardPanel={renderVirtualKeyboardPanel}
                            toggleMatrixMode={() => setMatrixEnabled((prev) => !prev)}
                            toggleAsciiMode={() => setAsciiEnabled((prev) => !prev)}
                            isMatrixModeActive={matrixEnabled}
                            isAsciiModeActive={asciiEnabled}
                            onDeselectElement={() => setSelectedElement(null)}
                            onToggleMedia={() => setShowMediaPanel((prev) => !prev)}
                            onOpenOptions={() => {}}
                            showGiphyKeyboard={showGiphyKeyboard}
                            setShowGiphyKeyboard={setShowGiphyKeyboard}
                            handleGifSelect={handleGifSelect}
                            showVirtualKeyboard={showVirtualKeyboard}
                            setShowVirtualKeyboard={setShowVirtualKeyboard}
                            showMediaPanel={showMediaPanel}
                            setShowMediaPanel={setShowMediaPanel}
                            showUnboundMediaList={showUnboundMediaList}
                            setShowUnboundMediaList={setShowUnboundMediaList}
                            audioProgress={audioRef.current ? audioRef.current.currentTime / audioRef.current.duration : 0}
                            setAudioProgress={(progress: number) => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = progress * audioRef.current.duration;
                                }
                            }}
                        />
                    </SkryrPalette>
                </Suspense>
                <Workspace
                    mediaList={mediaList}
                    customTexts={customTexts}
                    isFullscreen={isFullscreen}
                    workspaceDimensions={workspaceDimensions}
                    zoomLevel={zoomLevel}
                    asciiEnabled={asciiEnabled}
                    onMediaListUpdate={setMediaList}
                    onCustomTextsUpdate={setCustomTexts}
                    onSelectElement={onSelectElement}
                    matrixCanvasRef={matrixCanvasRef}
                    visualizerCanvasRef={visualizerCanvasRef}
                    barCanvasRef={barCanvasRef}
                    containerWidth={window.innerWidth}
                    containerHeight={window.innerHeight}
                />
                <canvas
                    ref={barCanvasRef}
                    style={{
                        position: "fixed",
                        bottom: "0",
                        left: "0",
                        width: "100vw",
                        height: "50px",
                        zIndex: 2,
                        background: "transparent",
                        pointerEvents: "none",
                    }}
                />
                {showUnboundMediaList && (
                    <div
                        style={{
                            position: "fixed",
                            bottom: "70px",
                            left: "10px",
                            background: "rgba(0, 0, 0, 0.8)",
                            color: computedColor,
                            padding: "10px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 11,
                        }}
                    >
                        {/* <h3>Unbound Media</h3>
                        {mediaList
                            .map((media, index) => ({ media, index }))
                            .filter(({ index }) => !keyMappings.some((m) => m.assignedIndex === index))
                            .map(({ media, index }) => (
                                <div
                                    key={index}
                                    onDoubleClick={() => onSelectElement({ type: "media", index })}
                                    style={{ cursor: "pointer" }}
                                >
                                    {media.src.split("/").pop()}
                                </div>
                            ))} */}
                    </div>
                )}
                {!isStarted && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            background: "rgba(0, 0, 0, 0.9)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10002,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: "200px",
                                height: "200px",
                                background: countdown > 0 ? "radial-gradient(circle, #666, #333)" : "radial-gradient(circle, #ff0000, #cc0000)",
                                borderRadius: "50%",
                                boxShadow: countdown > 0 ? "0 0 20px #666, inset 0 0 15px #222" : "0 0 20px #ff0000, inset 0 0 15px #800000",
                                border: "5px solid #333",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: countdown > 0 ? "not-allowed" : "pointer",
                                animation: "pulseGlow 2s infinite ease-in-out",
                                pointerEvents: countdown > 0 ? "none" : "auto",
                            }}
                            onClick={countdown === 0 ? handleStart : undefined}
                            title={countdown === 0 ? "Launch Nuclear Audio" : "Please wait..."}
                        >
                            <span
                                style={{
                                    color: "#fff",
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    textShadow: "0 0 5px #000",
                                    textTransform: "uppercase",
                                }}
                            >
                                {countdown > 0 ? countdown : "LAUNCH"}
                            </span>
                            <div
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    border: "2px solid rgba(255, 255, 255, 0.5)",
                                    animation: "spinGlow 3s infinite linear",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                marginTop: "20px",
                                color: computedColor,
                                textAlign: "center",
                                maxWidth: "600px",
                                fontSize: "14px",
                                padding: "10px",
                                background: "rgba(0, 0, 0, 0.7)",
                                borderRadius: "5px",
                            }}
                        >
                            {helpTips[currentTipIndex]}
                        </div>
                        <style jsx>{`
                            @keyframes pulseGlow {
                                0% {
                                    box-shadow: 0 0 20px ${countdown > 0 ? "#666" : "#ff0000"}, inset 0 0 15px ${countdown > 0 ? "#222" : "#800000"};
                                    transform: scale(1);
                                }
                                50% {
                                    box-shadow: 0 0 40px ${countdown > 0 ? "#999" : "#ff5555"}, inset 0 0 25px ${countdown > 0 ? "#444" : "#a00000"};
                                    transform: scale(1.05);
                                }
                                100% {
                                    box-shadow: 0 0 20px ${countdown > 0 ? "#666" : "#ff0000"}, inset 0 0 15px ${countdown > 0 ? "#222" : "#800000"};
                                    transform: scale(1);
                                }
                            }
                            @keyframes spinGlow {
                                0% {
                                    transform: rotate(0deg) scale(1.1);
                                    border-color: rgba(255, 255, 255, 0.5);
                                }
                                50% {
                                    transform: rotate(180deg) scale(1.15);
                                    border-color: rgba(255, 255, 255, 0.8);
                                }
                                100% {
                                    transform: rotate(360deg) scale(1.1);
                                    border-color: rgba(255, 255, 255, 0.5);
                                }
                            }
                        `}</style>
                    </div>
                )}
                <div style={{ position: "fixed", bottom: "60px", right: "10px", color: computedColor, zIndex: 11 }}>
                    FPS: {fps}
                </div>
            </div>
        </div>
    );
};

export default SkryrPage;