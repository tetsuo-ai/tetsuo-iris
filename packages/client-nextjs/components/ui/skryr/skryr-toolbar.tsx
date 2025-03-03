"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { SelectedElement } from "@/components/pages/MediaPage/SkryrPage";
import UnboundMediaList, { MediaItem } from "@/components/ui/UnboundMediaList";
import MediaTabs from "@/components/pages/MediaPage/MediaTabs";
import { useSkryrColor } from "./SkryrColorContext";

interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

interface SkryrToolbarProps {
    isPlaying: boolean;
    handlePlayPause: () => void;
    handleStop: () => void;
    handleZoomChange: (delta: number) => void;
    handleToggleFullscreen: () => void;
    isFullscreen: boolean;
    showToolsInFullscreen: boolean;
    setShowToolsInFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
    showPalette: boolean;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    embeddedMode: boolean;
    setEmbeddedMode: React.Dispatch<React.SetStateAction<boolean>>;
    primaryAudioSrc: string | null;
    primaryAudioRef: React.RefObject<HTMLAudioElement>;
    audioProgress: number;
    setAudioProgress: (value: number) => void;
    onPrimaryAudioDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    selectedElement: SelectedElement | null;
    renderOptionsContent: () => JSX.Element | null;
    mediaList: MediaItem[];
    keyMappings: KeyMapping[];
    onToggleMedia: (index: number) => void;
    onOpenOptions: (index: number) => void;
    setKeyMappings: React.Dispatch<React.SetStateAction<KeyMapping[]>>;
    setMediaList: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    showGiphyKeyboard: boolean;
    setShowGiphyKeyboard: React.Dispatch<React.SetStateAction<boolean>>;
    handleGifSelect: (gifUrl: string) => void;
    renderVirtualKeyboardPanel: () => JSX.Element;
    toggleMatrixMode: () => void;
    toggleAsciiMode: () => void;
    isMatrixModeActive: boolean;
    isAsciiModeActive: boolean;
    onDeselectElement: () => void;
}

const SkryrToolbar: React.FC<SkryrToolbarProps> = ({
    isPlaying,
    handlePlayPause,
    handleStop,
    handleZoomChange,
    handleToggleFullscreen,
    isFullscreen,
    showToolsInFullscreen,
    setShowToolsInFullscreen,
    showPalette,
    setShowPalette,
    backgroundEnabled,
    setBackgroundEnabled,
    embeddedMode,
    setEmbeddedMode,
    primaryAudioSrc,
    primaryAudioRef,
    audioProgress,
    setAudioProgress,
    onPrimaryAudioDrop,
    renderVirtualKeyboardPanel,
    selectedElement,
    showGiphyKeyboard,
    setShowGiphyKeyboard,
    handleGifSelect,
    mediaList,
    keyMappings,
    onToggleMedia,
    onOpenOptions,
    renderOptionsContent,
    setKeyMappings,
    setMediaList,
    toggleMatrixMode = () => {},
    toggleAsciiMode = () => {},
    isMatrixModeActive = true,
    isAsciiModeActive = true,
    onDeselectElement = () => {}
}) => {
    // Internal toggle states for panels inside the palette
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css";
        document.head.appendChild(link);
    }, []);

    const [showLaunchpad, setShowLaunchpad] = useState(true);
    const [showMediaPanel, setShowMediaPanel] = useState(true);
    const [showUnboundMediaList, setShowUnboundMediaList] = useState(true);
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);
    const { computedColor } = useSkryrColor();
    
    // Filter out already bound media from Unbound Media List
    const boundIndices = keyMappings
        .filter((mapping) => mapping.assignedIndex !== null)
        .map((mapping) => mapping.assignedIndex);

    const unboundMedia = mediaList
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !boundIndices.includes(index));
    
    // Save previous panel states when toggling all off
    const [prevPanels, setPrevPanels] = useState({
        launchpad: true,
        mediaPanel: true,
        unboundMediaList: true,
        virtualKeyboard: true,
    });

    // Toggle all panels at once
    const toggleAllPanels = () => {
        if (showPalette) {
            setPrevPanels({
                launchpad: showLaunchpad,
                mediaPanel: showMediaPanel,
                unboundMediaList: showUnboundMediaList,
                virtualKeyboard: showVirtualKeyboard,
            });
            setShowPalette(false);
            setShowLaunchpad(false);
            setShowMediaPanel(false);
            setShowUnboundMediaList(false);
            setShowVirtualKeyboard(false);
        } else {
            setShowPalette(true);
            setShowLaunchpad(prevPanels.launchpad);
            setShowMediaPanel(prevPanels.mediaPanel);
            setShowUnboundMediaList(prevPanels.unboundMediaList);
            setShowVirtualKeyboard(prevPanels.virtualKeyboard);
        }
    };

    const handleMediaSelect = (media: MediaItem) => {
        setMediaList((prev) => [...prev, media]);
    };
    // Render a row for the keybinding keyboard panel.
    const renderKeyboardRow = (row: string[], startIndex: number): JSX.Element => (
        <div className="flex gap-1 mb-1 justify-center">
            {row.map((keyLabel, i) => {
                const mappingIndex = startIndex + i;
                const mapping = keyMappings[mappingIndex];
                let cellContent: React.ReactNode = keyLabel;

                if (mapping.assignedIndex !== null && mediaList[mapping.assignedIndex]) {
                    const media = mediaList[mapping.assignedIndex];
                    if (media.type === "image") {
                        cellContent = (
                            <img src={media.src} alt={keyLabel} className="w-6 h-6 object-cover" />
                        );
                    }
                }

                return (
                    <div
                        key={mappingIndex}
                        className="w-8 h-8 flex items-center justify-center text-xs border rounded cursor-pointer select-none"
                        style={{
                            borderColor: mapping.assignedIndex !== null ? computedColor : "transparent",
                        }}
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

    // Render the keybinding keyboard panel.
    const renderKeybindingKeyboardPanel = (): JSX.Element => {
        let currentIndex = 0;
        return (
            <div className="p-2 border border-gray-500 rounded text-center !bg-transparent shadow-none">
                <div className="mb-2 font-bold">Media Launchpad</div>
                {renderKeyboardRow(["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="], currentIndex)}
                {(() => {
                    currentIndex += 13;
                    return null;
                })()}
                {renderKeyboardRow(["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"], currentIndex)}
                {(() => {
                    currentIndex += 13;
                    return null;
                })()}
                {renderKeyboardRow(["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"], currentIndex)}
                {(() => {
                    currentIndex += 11;
                    return null;
                })()}
                {renderKeyboardRow(["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"], currentIndex)}
                {(() => {
                    currentIndex += 10;
                    return null;
                })()}
                <div className="mt-2">Numpad:</div>
                {renderKeyboardRow(["7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "0", "."], currentIndex)}
            </div>
        );
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case "Escape": // 🔹 Toggle Virtual Keyboard (Fix for Border Sync)
                    event.preventDefault();
                    onDeselectElement();
                    break;
                case "F1":
                    event.preventDefault();
                    alert(`🔥 Hotkey Guide:
- Tab: Toggle All Panels
- F1: Help
- F2: Toggle Launchpad Keyboard
- F3: Toggle Media Tabs
- F4: Toggle Unbound Media Items
- F7: Toggle ASCII Mode
- F8: Toggle Matrix Mode
- Space: Play/Pause
- F9: Stop
- F10: Stop + Play
- F11: Fullscreen Toggle
- PageUp: Zoom In
- PageDown: Zoom Out
`);

                case "F2": // 🔹 Toggle Virtual Keyboard (Fix for Border Sync)
                    event.preventDefault();
                    setShowVirtualKeyboard((prev) => !prev);
                    break;
                case "F3": // 🔹 Toggle Media Panel
                    event.preventDefault();
                    setShowMediaPanel((prev) => !prev);
                    break;
                case "F4": // 🔹 Toggle Unbound Media
                    event.preventDefault();
                    setShowUnboundMediaList((prev) => !prev);
                    break;
                case "F7": // 🔹 Toggle ASCII Mode
                    event.preventDefault();
                    setEmbeddedMode((prev: boolean) => !prev);
                    break;
                case "F8": // 🔹 Toggle Matrix Mode
                    event.preventDefault();
                    setBackgroundEnabled((prev: boolean) => !prev);
                    break;
                case "Tab": // 🔹 Toggle All Panels
                    event.preventDefault();
                    toggleAllPanels();
                    break;
                case "Space":
                    event.preventDefault();
                    handlePlayPause();
                    break;
                case "F9":
                    event.preventDefault();
                    handleStop();
                    break;
                case "F10":
                    event.preventDefault();
                    // Execute stop then play
                    handleStop();
                    handlePlayPause();
                    break;
                case "F11":
                    event.preventDefault();
                    handleToggleFullscreen();
                    break;
                case "PageUp":
                    event.preventDefault();
                    handleZoomChange(0.1);
                    break;
                case "PageDown":
                    event.preventDefault();
                    handleZoomChange(-0.1);
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        toggleAllPanels,
        setShowLaunchpad,
        setShowMediaPanel,
        setShowUnboundMediaList,
        setEmbeddedMode,
        setBackgroundEnabled,
        handlePlayPause,
        handleStop,
        handleToggleFullscreen,
        handleZoomChange
    ]);

    return (
        <div className="flex flex-row mx-auto  justify-center space-x-4" style={{ minWidth: "777px", width: showPalette ? "auto" : "0px", transition: "width 0.3s ease-in-out", backgroundColor: "rgb(0 0 0 / 0%)"}}>
                    {/* Unbound Media Panel */}
                    <div
                        className="transition-all duration-300 ease-in-out"
                        style={{
                            width: showUnboundMediaList ? "250px" : "0px",
                            minWidth: showUnboundMediaList ? "250px" : "0px",
                            height: showUnboundMediaList ? "250px" : "0px",
                            minHeight: showUnboundMediaList ? "250px" : "0px",
                            opacity: showUnboundMediaList ? 1 : 0,
                            visibility: showUnboundMediaList ? "visible" : "hidden",
                            transition: "all 0.3s ease-in-out",
                    // backgroundColor: "rgba(0, 0, 0, 0.8)"
                        }}
                    >
                        <UnboundMediaList mediaList={mediaList} onToggleMedia={onToggleMedia} keyMappings={keyMappings} onOpenOptions={onOpenOptions} />
                    </div>

                    {/* Media Panel */}
                    <div
                        className="transition-all duration-300 ease-in-out"
                        style={{
                            width: showMediaPanel ? "400px" : "0px",
                            minWidth: showMediaPanel ? "400px" : "0px",
                            height: showMediaPanel ? "400px" : "0px",
                            minHeight: showMediaPanel ? "400px" : "0px",
                            opacity: showMediaPanel ? 1 : 0,
                            visibility: showMediaPanel ? "visible" : "hidden",
                            transition: "all 0.3s ease-in-out",
                            backgroundColor: "rgba(0,0,0,0.8)"
                        }}
                    >
                <MediaTabs
                    onMediaSelect={(media) => setMediaList((prev) => [...prev, media])}
                    onMediaDragStart={(media) => {setMediaList((prev) => [...prev, media])}} />
                    </div>


            {/* CENTER COLUMN: Controls (buttons and audio timeline) */}

            {showPalette && (
                <div className="flex-1 p-4 rounded shadow flex flex-col space-y-4 transition-all duration-300 ease-in-out" style={{ minWidth: "600px", backgroundColor: "rgb(0 0 0 / 80%)" }}>

                    {/* Header row: Three groups */}
                    <div className="flex flex-row items-center justify-between">
                        {/* Left: Toggle buttons */}
                        <div className="flex flex-row gap-2">
                            <Button onClick={() => setShowVirtualKeyboard((prev) => !prev)} className={`w-10 h-10 text-2xl ${showVirtualKeyboard ? "border-2" : "border-0"}`} title="Toggle Keyboard">
                                <i className="fa-solid fa-keyboard"></i>
                            </Button>
                            <Button onClick={() => setShowUnboundMediaList((prev) => !prev)} className={`w-10 h-10 text-2xl ${showUnboundMediaList ? "border-2" : "border-0"}`} title="Toggle Unbound Media">
                                <i className="fa-solid fa-box"></i>
                            </Button>

                            <Button onClick={() => setShowMediaPanel((prev) => !prev)} className={`w-10 h-10 text-2xl ${showMediaPanel ? "border-2" : "border-0"}`} title="Toggle Media Panel">
                                <i className="fa-solid fa-images"></i>
                            </Button>
                            <Button onClick={() => setBackgroundEnabled((prev) => !prev)} className={`w-10 h-10 text-2xl ${backgroundEnabled ? "border-2" : "border-0"}`} title="Toggle Matrix Mode">
                                <i className="fa-solid fa-globe"></i>
                            </Button>
                            <Button onClick={() => setEmbeddedMode((prev) => !prev)} className={`w-10 h-10 text-2xl ${embeddedMode ? "border-2" : "border-0"}`} title="Toggle ASCII Mode">
                                <i className="fa-solid fa-theater-masks"></i>
                            </Button>
                            <Button onClick={toggleAllPanels} className={`w-10 h-10 text-2xl ${showPalette ? "border-2" : "border-0"}`} title="Toggle All">
                                <i className="fa-solid fa-layer-group"></i>
                            </Button>
                            <Button onClick={handlePlayPause} className="w-10 h-10 text-2xl border-2 border-current text-gray-500" title="Play / Pause">
                                {isPlaying ? <i className="fa-solid fa-pause" /> : <i className="fa-solid fa-play" />}
                            </Button>
                            <Button onClick={handleStop} className="w-10 h-10 text-2xl border-2 border-current text-gray-500" title="Stop (F9)">
                                <i className="fa-solid fa-stop" />
                            </Button>
                            <Button
                                onClick={() => handleZoomChange(0.1)}
                                title="Zoom In (PageUp)"
                                className="w-10 h-10 text-2xl border-2 border-current text-gray-500"
                            >
                                <i className="fa-solid fa-plus" />
                            </Button>
                            <Button
                                onClick={() => handleZoomChange(-0.1)}
                                title="Zoom Out (PageDown)"
                                className="w-10 h-10 text-2xl border-2 border-current text-gray-500"
                            >
                                <i className="fa-solid fa-minus" />
                            </Button>
                            <Button
                                onClick={handleToggleFullscreen}
                                title="Toggle Fullscreen (F11)"
                                className="w-10 h-10 text-2xl border-2 border-current text-gray-500"
                            >
                                <i className="fa-solid fa-expand" />
                            </Button>
                            <Button
                                onClick={() =>
                                    alert(`🔥 Hotkey Guide:
- Tab: Toggle All Panels
- F1: Help
- F2: Toggle Launchpad Keyboard
- F3: Toggle Media Tabs
- F4: Toggle Unbound Media Items
- F7: Toggle ASCII Mode
- F8: Toggle Matrix Mode
- Space: Play/Pause
- F9: Stop
- F10: Stop + Play
- F11: Toggle Fullscreen
- PageUp: Zoom In
- PageDown: Zoom Out
`)
                                }
                                title="Help (F1)"
                                className="w-10 h-10 text-2xl border-2 border-current text-gray-500"
                            >
                                <i className="fa-solid fa-question" />
                            </Button>
                        </div>
                    </div>


                    {/* Audio Timeline */}
                    <div className="min-w-[150px]" style={{ color: computedColor,  }}>
                        {primaryAudioSrc ? (
                            <div className="flex flex-col">
                                <span className="text-xs text-center text-gray-600">Audio Timeline</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    value={audioProgress}
                                    onChange={(e) => {
                                        if (primaryAudioRef.current && primaryAudioRef.current.duration) {
                                            const newTime =
                                                (parseFloat(e.target.value) / 100) * primaryAudioRef.current.duration;
                                            primaryAudioRef.current.currentTime = newTime;
                                            setAudioProgress(parseFloat(e.target.value));
                                        }
                                    }}
                                    className="w-full"
                                />
                            </div>
                        ) : (
<div
  className="p-2 border-dashed border-2 border-gray-400 rounded text-xs text-center"
  style={{ borderColor: computedColor }}
  onDrop={(e) => {
    e.preventDefault();
    onPrimaryAudioDrop(e);
  }}
  onDragOver={(e) => e.preventDefault()}
>
  Drag & Drop Primary Audio Here
</div>

                        )}
                    </div>

                    {/* Launchpad Keyboard */}
                    {showLaunchpad && (
                        <div className={`transition-all duration-300 ease-in-out ${showVirtualKeyboard ? "opacity-100 scale-100 visible" : "opacity-0 scale-90 invisible absolute"}`}>
                            {renderVirtualKeyboardPanel()}
                        </div>
                    )}
                </div>
            )}


            {/* 🔹 OPTIONS PANEL (With Animation) */}
            {showPalette && (
                <div className={`p-4 w-[220px] max-w-[220px] rounded shadow flex flex-col items-center transition-all duration-300 ease-in-out ${showPalette ? "opacity-100 scale-100 visible" : "opacity-0 scale-90 invisible absolute"}`} style={{ backgroundColor: "rgb(0 0 0 / 80%)", color: computedColor }}>
                    {selectedElement ? renderOptionsContent() : <div className="text-xs text-gray-600">Double-click an element for options</div>}
                </div>
                        // </div>
            )}
            
            {/* Tailwind Animations & Button Styling */}
            <style>
                {`
                .icon-button {
                    @apply w-10 h-10 text-2xl text-gray-500 transition-all duration-300 hover:bg-opacity-50;
                }
                .icon-button.border-2 {
                    @apply border-current;
                }
                .icon-button.border-0 {
                    border: none !important;
                }
                `}
            </style>
        </div>

    );
};

export default SkryrToolbar;
