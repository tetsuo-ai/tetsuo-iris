"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import UnboundMediaList, { MediaItem } from "@/components/ui/UnboundMediaList";
import MediaTabs from "@/components/pages/MediaPage/MediaTabs";
import { useSkryrColor } from "./SkryrColorContext";

interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

type SelectedElement = { type: "media" | "customText"; index: number } | null;
type SelectedLayer = "milkdrop" | "matrix" | "ascii" | "allMedia" | null;
type MixBlendMode =
    | "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" |
    "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";

interface ExtendedMediaItem extends MediaItem {
    showControls?: boolean;
    mixBlendMode?: MixBlendMode;
    optimizedSrc?: string;
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
    mediaList: ExtendedMediaItem[];
    keyMappings: KeyMapping[];
    setKeyMappings: React.Dispatch<React.SetStateAction<KeyMapping[]>>;
    setMediaList: React.Dispatch<React.SetStateAction<ExtendedMediaItem[]>>;
    showGiphyKeyboard: boolean;
    setShowGiphyKeyboard: React.Dispatch<React.SetStateAction<boolean>>;
    handleGifSelect: (gifUrl: string) => void;
    renderVirtualKeyboardPanel: () => JSX.Element;
    toggleMatrixMode: () => void;
    toggleAsciiMode: () => void;
    isMatrixModeActive: boolean;
    isAsciiModeActive: boolean;
    onDeselectElement: () => void;
    showVirtualKeyboard: boolean;
    setShowVirtualKeyboard: React.Dispatch<React.SetStateAction<boolean>>;
    showMediaPanel: boolean;
    setShowMediaPanel: React.Dispatch<React.SetStateAction<boolean>>;
    showUnboundMediaList: boolean;
    setShowUnboundMediaList: React.Dispatch<React.SetStateAction<boolean>>;
    toggleWinamp: () => void;
    swapLayerOrder: () => void;
    onSelectLayer: (layer: SelectedLayer) => void;
    toggleLayerPanel: () => void;
    showLayerPanel: boolean;
    onToggleMedia: (index: number) => void;
    fps: number;
    isRecording: boolean;
    toggleRecording: () => void; // Updated prop
    audioData: Uint8Array;
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
    selectedElement,
    renderOptionsContent,
    mediaList,
    keyMappings,
    setKeyMappings,
    setMediaList,
    showGiphyKeyboard,
    setShowGiphyKeyboard,
    handleGifSelect,
    renderVirtualKeyboardPanel,
    toggleMatrixMode,
    toggleAsciiMode,
    isMatrixModeActive,
    isAsciiModeActive,
    onDeselectElement,
    showVirtualKeyboard,
    setShowVirtualKeyboard,
    showMediaPanel,
    setShowMediaPanel,
    showUnboundMediaList,
    setShowUnboundMediaList,
    toggleWinamp,
    swapLayerOrder,
    onSelectLayer,
    toggleLayerPanel,
    showLayerPanel,
    onToggleMedia,
    fps,
    isRecording,
    toggleRecording,
    audioData,
}) => {
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css";
        document.head.appendChild(link);
    }, []);

    const { computedColor } = useSkryrColor();

    const toggleAllPanels = () => {
        setShowPalette((prev) => !prev);
    };

    return (
        <div
            className="flex flex-row mx-auto justify-center space-x-4"
            style={{ minWidth: "600px", width: showPalette ? "auto" : "0px", transition: "width 0.3s ease-in-out", backgroundColor: "rgb(0 0 0 / 0%)" }}
        >
            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    width: showUnboundMediaList ? "250px" : "0px",
                    minWidth: showUnboundMediaList ? "250px" : "0px",
                    height: showUnboundMediaList ? "250px" : "0px",
                    minHeight: showUnboundMediaList ? "250px" : "0px",
                    opacity: showUnboundMediaList ? 1 : 0,
                    visibility: showUnboundMediaList ? "visible" : "hidden",
                }}
            >
                <UnboundMediaList mediaList={mediaList} onToggleMedia={onToggleMedia} keyMappings={keyMappings} onOpenOptions={() => { }} />
            </div>

            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    width: showMediaPanel ? "400px" : "0px",
                    minWidth: showMediaPanel ? "400px" : "0px",
                    height: showMediaPanel ? "400px" : "0px",
                    minHeight: showMediaPanel ? "400px" : "0px",
                    opacity: showMediaPanel ? 1 : 0,
                    visibility: showMediaPanel ? "visible" : "hidden",
                    backgroundColor: "rgba(0,0,0,0.8)",
                }}
            >
                <MediaTabs
                    onMediaSelect={(media) => setMediaList((prev) => [...prev, media])}
                    onMediaDragStart={(media) => setMediaList((prev) => [...prev, media])}
                />
            </div>

            {showPalette && (
                <div className="flex-1 p-4 rounded shadow flex flex-col space-y-4" style={{ minWidth: "600px", backgroundColor: "rgb(0 0 0 / 80%)" }}>
                    <div className="flex flex-col items-center justify-between">
                        <div className="flex flex-row gap-2 flex-wrap justify-between w-full">
                            <div className="flex flex-row gap-2">
                                <Button onClick={() => setShowVirtualKeyboard((prev) => !prev)} className={`w-10 h-10 text-2xl ${showVirtualKeyboard ? "border-2" : "border-0"} text-gray-500 hover:bg-gray-700`} title="Toggle Keyboard (F2)">
                                    <i className="fa-solid fa-keyboard" />
                                </Button>
                                <Button onClick={() => setShowUnboundMediaList((prev) => !prev)} className={`w-10 h-10 text-2xl ${showUnboundMediaList ? "border-2" : "border-0"} text-gray-500 hover:bg-gray-700`} title="Toggle Unbound Media (F4)">
                                    <i className="fa-solid fa-box" />
                                </Button>
                                <Button onClick={() => setShowMediaPanel((prev) => !prev)} className={`w-10 h-10 text-2xl ${showMediaPanel ? "border-2" : "border-0"} text-gray-500 hover:bg-gray-700`} title="Toggle Media Panel (F3)">
                                    <i className="fa-solid fa-images" />
                                </Button>
                                <Button onClick={toggleLayerPanel} className={`w-10 h-10 text-2xl ${showLayerPanel ? "border-2" : "border-0"} text-gray-500 hover:bg-gray-700`} title="Toggle Layer Panel (F7)">
                                    <i className="fa-solid fa-layer-group" />
                                </Button>
                                <Button onClick={toggleAllPanels} className={`w-10 h-10 text-2xl ${showPalette ? "border-2" : "border-0"} text-gray-500 hover:bg-gray-700`} title="Toggle All Panels (Tab)">
                                    <i className="fa-solid fa-tools" />
                                </Button>
                                <Button onClick={handlePlayPause} className={`w-10 h-10 text-2xl ${isPlaying ? "border-2 border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`} title="Play / Pause (Space)">
                                    {isPlaying ? <i className="fa-solid fa-pause" /> : <i className="fa-solid fa-play" />}
                                </Button>
                                <Button onClick={() => handleZoomChange(0.1)} className="w-10 h-10 text-2xl border-2 border-current text-gray-500 hover:bg-gray-700" title="Zoom In (PageUp)">
                                    <i className="fa-solid fa-plus" />
                                </Button>
                                <Button onClick={() => handleZoomChange(-0.1)} className="w-10 h-10 text-2xl border-2 border-current text-gray-500 hover:bg-gray-700" title="Zoom Out (PageDown)">
                                    <i className="fa-solid fa-minus" />
                                </Button>
                                <Button onClick={handleToggleFullscreen} className="w-10 h-10 text-2xl border-2 border-current text-gray-500 hover:bg-gray-700" title="Toggle Fullscreen (F11)">
                                    <i className="fa-solid fa-expand" />
                                </Button>
                                <Button onClick={toggleWinamp} className="w-10 h-10 text-2xl border-2 border-current text-gray-500 hover:bg-gray-700" title="Toggle Winamp">
                                    <i className="fa-solid fa-compact-disc" />
                                </Button>
                                <Button
                                    onClick={toggleRecording}
                                    className={`w-10 h-10 text-2xl ${isRecording ? "border-2 border-red-500 text-red-500" : "border-0 text-gray-500"} hover:bg-gray-700`}
                                    title={isRecording ? "Stop Recording" : "Start Recording"}
                                >
                                    <i className={`fa-solid ${isRecording ? "fa-stop" : "fa-video"}`} />
                                </Button>
                                <Button onClick={() => alert(`🔥 Hotkey Guide:
- Escape: Deselect Element
- Tab: Toggle All Panels
- F1: Help
- F2: Toggle Launchpad Keyboard
- F3: Toggle Media Tabs
- F4: Toggle Unbound Media Items
- F7: Toggle Layer Panel
- Space: Play/Pause
- F11: Fullscreen Toggle
- PageUp: Zoom In
- PageDown: Zoom Out`)} className="w-10 h-10 text-2xl border-2 border-current text-gray-500 hover:bg-gray-700" title="Help (F1)">
                                    <i className="fa-solid fa-question" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-[150px]" style={{ color: computedColor }}>
                        {primaryAudioSrc ? (
                            <div className="flex flex-col">
                                <span className="text-xs text-center text-gray-600">Audio Timeline</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    value={audioProgress * 100}
                                    onChange={(e) => {
                                        if (primaryAudioRef.current && primaryAudioRef.current.duration) {
                                            const newTime = (parseFloat(e.target.value) / 100) * primaryAudioRef.current.duration;
                                            primaryAudioRef.current.currentTime = newTime;
                                            setAudioProgress(parseFloat(e.target.value) / 100);
                                        }
                                    }}
                                    className="w-full"
                                />
                            </div>
                        ) : (
                            <div
                                className="p-2 border-dashed border-2 border-gray-400 rounded text-xs text-center"
                                style={{ borderColor: computedColor }}
                                onDrop={onPrimaryAudioDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                Drag & Drop Primary Audio Here
                            </div>
                        )}
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out ${showVirtualKeyboard ? "opacity-100 scale-100 visible" : "opacity-0 scale-90 invisible absolute"}`}
                    >
                        {renderVirtualKeyboardPanel()}
                    </div>
                </div>
            )}

            <style>{`
                .icon-button {
                    @apply w-10 h-10 text-2xl text-gray-500 transition-all duration-300 hover:bg-opacity-50;
                }
                .icon-button.border-2 {
                    @apply border-current;
                }
                .icon-button.border-0 {
                    border: none !important;
                }
            `}</style>
        </div>
    );
};

export default SkryrToolbar;