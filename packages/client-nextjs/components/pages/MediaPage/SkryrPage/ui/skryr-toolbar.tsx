"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import UnboundMediaList from "./skryr-unbound-media";
import MediaTabs from "../../MediaTabs";
import { useSkryrColor } from "./skryr-color-context";
import Slider from "@/components/ui/slider";
import { CustomTextItem, MediaItem as StateMediaItem } from "../hooks/useMediaState";
export interface UnboundMediaItem {
    type: "audio" | "video" | "image";
    src: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    visible: boolean;
    interruptOnPlay: boolean;
    isManuallyControlled: boolean;
    showAt: number;
    hideAt: number;
}

interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

type SelectedElement = { type: "media" | "customText"; index: number } | null;
type SelectedLayer = "milkdrop" | "matrix" | "ascii" | "allMedia" | "background" | null;
type MixBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";
type ExtendedMediaType = "audio" | "video" | "image" | "text";

export interface ExtendedMediaItem extends Omit<StateMediaItem, "type"> {
    type: ExtendedMediaType;
    showControls?: boolean;
    mixBlendMode?: MixBlendMode;
    optimizedSrc?: string;
    transform?: string;
    opacity: number;
    textContent?: string;
    src: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    visible: boolean;
    interruptOnPlay: boolean;
    isManuallyControlled: boolean;
    showAt: number;
    hideAt: number;
    color?: string;
    fontStyle?: string;
    fontWeight?: string;
}

export interface SkryrToolbarProps {
    isPlaying: boolean;
    handlePlayPause: () => void;
    handleStop: () => void;
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
    selectedElement: SelectedElement | null;
    setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement>>;
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
    showWinamp: boolean;
    swapLayerOrder: () => void;
    onSelectLayer: (layer: SelectedLayer) => void;
    toggleLayerPanel: () => void;
    showLayerPanel: boolean;
    onToggleMedia: (index: number) => void;
    fps: number;
    isRecording: boolean;
    toggleRecording: () => void;
    audioData: Uint8Array;
    renderAudioControls: () => JSX.Element;
    toggleAudioPanel: () => void;
    isFFmpegLoaded: boolean;
    isStreaming: boolean;
    toggleStreaming: () => void;
    streamBitrate: number;
    setStreamBitrate: React.Dispatch<React.SetStateAction<number>>;
    streamResolution: string;
    setStreamResolution: React.Dispatch<React.SetStateAction<string>>;
    streamServerUrl: string;
    setStreamServerUrl: React.Dispatch<React.SetStateAction<string>>;
    streamKey: string;
    setStreamKey: React.Dispatch<React.SetStateAction<string>>;
    handleClearAllMedia: () => void;
    handleClear404Media: () => void;
    toggleAudioIntegration: () => void;
    isAudioIntegrationActive: boolean;
    setCustomTexts: React.Dispatch<React.SetStateAction<CustomTextItem[]>>;
}

const SkryrToolbar: React.FC<SkryrToolbarProps> = ({
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
    selectedElement,
    setSelectedElement,
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
    showWinamp,
    swapLayerOrder,
    onSelectLayer,
    toggleLayerPanel,
    showLayerPanel,
    onToggleMedia,
    fps,
    isRecording,
    toggleRecording,
    audioData,
    renderAudioControls,
    toggleAudioPanel,
    isFFmpegLoaded,
    handleClearAllMedia,
    handleClear404Media,
    toggleAudioIntegration,
    isAudioIntegrationActive,
    setCustomTexts,
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

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const handleZoomIn = () => {
        setAudioProgress(clamp(audioProgress + 0.1, 0.5, 3));
    };

    const handleZoomOut = () => {
        setAudioProgress(clamp(audioProgress - 0.1, 0.5, 3));
    };

    const handleMediaDoubleClick = (index: number) => {
        const media = mediaList[index];
        setSelectedElement({ type: media.type === "text" ? "customText" : "media", index });
    };

    const unboundMediaList: UnboundMediaItem[] = mediaList
        .filter((item) => ["audio", "video", "image"].includes(item.type))
        .map((item) => ({
            type: item.type as "audio" | "video" | "image",
            src: item.src,
            x: item.x,
            y: item.y,
            scale: item.scale,
            rotation: item.rotation,
            visible: item.visible,
            interruptOnPlay: item.interruptOnPlay,
            isManuallyControlled: item.isManuallyControlled,
            showAt: item.showAt,
            hideAt: item.hideAt,
        }));

    const handleMediaSelect = (media: StateMediaItem | CustomTextItem) => {
        if ("text" in media && "isAscii" in media) { // CustomTextItem
            const customText = media as CustomTextItem;
            console.log("Adding to customTexts:", customText);
            setCustomTexts((prev) => [...prev, customText]);
        } else { // MediaItem
            const mediaItem = media as StateMediaItem;
            const extendedMedia: ExtendedMediaItem = {
                id: mediaItem.id,
                type: mediaItem.type as ExtendedMediaType,
                src: mediaItem.src,
                x: mediaItem.x ?? 50,
                y: mediaItem.y ?? 50,
                scale: mediaItem.scale ?? 1,
                rotation: mediaItem.rotation ?? 0,
                opacity: mediaItem.opacity ?? 1,
                visible: mediaItem.visible ?? true,
                showAt: mediaItem.showAt ?? 0,
                hideAt: mediaItem.hideAt ?? Infinity,
                interruptOnPlay: mediaItem.interruptOnPlay ?? true,
                isManuallyControlled: mediaItem.isManuallyControlled ?? false,
                showControls: mediaItem.showControls,
                mixBlendMode: (mediaItem.mixBlendMode ?? "normal") as MixBlendMode,
                optimizedSrc: mediaItem.optimizedSrc,
                transform: mediaItem.transform,
                textContent: mediaItem.textContent,
            };
            console.log("Adding to mediaList:", extendedMedia);
            setMediaList((prev) => [...prev, extendedMedia]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="flex flex-row gap-2 justify-center"
            style={{ width: showPalette ? "fit-content" : "0px", transition: "width 0.3s ease-in-out", backgroundColor: "transparent" }}
            onKeyDown={handleKeyDown}
        >
            <div
                className={`transition-all duration-300 ease-in-out p-2 bg-black/80 rounded-lg shadow-lg animate-panel ${showUnboundMediaList ? "panel-open" : "panel-closed"}`}
                style={{
                    width: showUnboundMediaList ? "300px" : "0px",
                    maxHeight: showUnboundMediaList ? "calc(100vh - 100px)" : "0px",
                    opacity: showUnboundMediaList ? 1 : 0,
                    visibility: showUnboundMediaList ? "visible" : "hidden",
                    overflowY: "auto",
                }}
            >
                <UnboundMediaList
                    mediaList={unboundMediaList}
                    onToggleMedia={onToggleMedia}
                    keyMappings={keyMappings}
                    onOpenOptions={handleMediaDoubleClick}
                />
            </div>

            <div
                className={`transition-all duration-300 ease-in-out p-2 bg-black/80 rounded-lg shadow-lg animate-panel ${showMediaPanel ? "panel-open" : "panel-closed"}`}
                style={{
                    width: showMediaPanel ? "420px" : "0px",
                    maxHeight: showMediaPanel ? "calc(100vh - 100px)" : "0px",
                    opacity: showMediaPanel ? 1 : 0,
                    visibility: showMediaPanel ? "visible" : "hidden",
                    overflowY: "auto",
                }}
            >
                <MediaTabs
                    onMediaSelect={handleMediaSelect}
                    onMediaDragStart={handleMediaSelect}
                />
            </div>

            {showPalette && (
                <div className="flex flex-col gap-3 p-3 bg-black/80 rounded-lg shadow-lg">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {/* Toggle Buttons */}
                        <Button
                            onClick={() => setShowVirtualKeyboard((prev) => !prev)}
                            className={`p-4 bg-transparent ${showVirtualKeyboard ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: showVirtualKeyboard ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title="Toggle Keyboard (F2)"
                        >
                            <i className="fa-solid fa-keyboard text-xl" />
                        </Button>
                        <Button
                            onClick={() => setShowUnboundMediaList((prev) => !prev)}
                            className={`p-4 bg-transparent ${showUnboundMediaList ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: showUnboundMediaList ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title="Toggle Unbound Media (F4)"
                        >
                            <i className="fa-solid fa-box text-xl" />
                        </Button>
                        <Button
                            onClick={() => setShowMediaPanel((prev) => !prev)}
                            className={`p-4 bg-transparent ${showMediaPanel ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: showMediaPanel ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title="Toggle Media Panel (F3)"
                        >
                            <i className="fa-solid fa-images text-xl" />
                        </Button>
                        <Button
                            onClick={toggleLayerPanel}
                            className={`p-4 bg-transparent ${showLayerPanel ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: showLayerPanel ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title="Toggle Layer Panel (F7)"
                        >
                            <i className="fa-solid fa-layer-group text-xl" />
                        </Button>
                        {/* Non-Toggle Buttons */}
                        <Button
                            onClick={toggleAllPanels}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Toggle All Panels (Tab)"
                        >
                            <i className="fa-solid fa-tools text-xl" />
                        </Button>
                        <Button
                            onClick={toggleRecording}
                            className={`p-4 bg-transparent ${isRecording ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: isRecording ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                            <i className={`fa-solid ${isRecording ? "fa-stop" : "fa-video"} text-xl`} />
                        </Button>
                        <Button
                            onClick={handleToggleFullscreen}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Toggle Fullscreen (F11)"
                        >
                            <i className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"} text-xl`} />
                        </Button>
                        {/* <Button
                            onClick={handleZoomIn}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Zoom In (PageUp)"
                        >
                            <i className="fa-solid fa-plus text-xl" />
                        </Button>
                        <Button
                            onClick={handleZoomOut}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Zoom Out (PageDown)"
                        >
                            <i className="fa-solid fa-minus text-xl" />
                        </Button>
                        <Button
                            onClick={toggleWinamp}
                            className={`p-4 bg-transparent ${showWinamp ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: showWinamp ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title="Toggle Winamp"
                        >
                            <i className="fa-solid fa-compact-disc text-xl" />
                        </Button> */}
                        <Button
                            onClick={() => {
                                console.log("Clear 404 Media button clicked");
                                handleClear404Media();
                            }}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Clear 404 Media"
                        >
                            <i className="fa-solid fa-eraser text-xl" />
                        </Button>
                        <Button
                            onClick={() => {
                                console.log("Clear All Media button clicked");
                                handleClearAllMedia();
                            }}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Clear All Media"
                        >
                            <i className="fa-solid fa-trash text-xl" />
                        </Button>
                        <Button
                            onClick={toggleAudioIntegration}
                            className={`p-4 bg-transparent ${isAudioIntegrationActive ? "border-2" : "border opacity-50"} hover:bg-gray-600 text-white rounded-md transition-colors`}
                            style={{ color: isAudioIntegrationActive ? computedColor : "#D1D5DB", borderColor: computedColor }}
                            title={isAudioIntegrationActive ? "Disable ASIO" : "Enable ASIO"}
                        >
                            <i className="fa-solid fa-volume-high text-xl" />
                        </Button>
                        <Button
                            onClick={() => alert(`🔥 Hotkey Guide:
- Escape: Deselect Element
- Tab: Toggle All Panels
- F1: Help
- F2: Toggle Launchpad Keyboard
- F3: Toggle Media Tabs
- F4: Toggle Unbound Media Items
- F7: Toggle Layer Panel
- F11: Fullscreen Toggle
- PageUp: Zoom In
- PageDown: Zoom Out`)}
                            className="p-4 bg-transparent border hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ color: computedColor, borderColor: computedColor }}
                            title="Help (F1)"
                        >
                            <i className="fa-solid fa-question text-xl" />
                        </Button>
                    </div>

                    {primaryAudioSrc && (
                        <div className="w-full" style={{ color: computedColor }}>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-center text-gray-400">Audio Timeline</span>
                                <Slider
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    value={[audioProgress * 100]}
                                    onValueChange={(value: number[]) => {
                                        if (primaryAudioRef.current && primaryAudioRef.current.duration) {
                                            const newTime = (value[0] / 100) * primaryAudioRef.current.duration;
                                            primaryAudioRef.current.currentTime = newTime;
                                            setAudioProgress(value[0] / 100);
                                        }
                                    }}
                                    className="w-full"
                                    style={{ accentColor: computedColor }}
                                    showTooltip={true}
                                />
                            </div>
                        </div>
                    )}

                    <div
                        className={`transition-all duration-300 ease-in-out animate-panel ${showVirtualKeyboard ? "panel-open" : "panel-closed"}`}
                        style={{
                            width: "100%",
                            maxHeight: showVirtualKeyboard ? "calc(100vh - 50px)" : "0px",
                            opacity: showVirtualKeyboard ? 1 : 0,
                            visibility: showVirtualKeyboard ? "visible" : "hidden",
                            padding: showVirtualKeyboard ? "4px" : "0",
                            overflowY: "auto",
                        }}
                    >
                        {renderVirtualKeyboardPanel()}
                    </div>
                </div>
            )}

            <style>{`
                .animate-panel {
                    animation: rollOut 0.3s ease-in-out forwards;
                }
                .panel-closed {
                    animation: retract 0.3s ease-in-out forwards;
                }
                @keyframes rollOut {
                    from { max-height: 0; opacity: 0; }
                    to { max-height: calc(100vh - 100px); opacity: 1; }
                }
                @keyframes retract {
                    from { max-height: calc(100vh - 100px); opacity: 1; }
                    to { max-height: 0; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default SkryrToolbar;