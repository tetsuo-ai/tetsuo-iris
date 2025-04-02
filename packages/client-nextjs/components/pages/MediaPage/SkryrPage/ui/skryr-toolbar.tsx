"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import UnboundMediaList, { MediaItem } from "@/components/pages/MediaPage/SkryrPage/ui/skryr-unbound-media";
import MediaTabs from "@/components/pages/MediaPage/MediaTabs";
import { useSkryrColor } from "./skryr-color-context";
import Slider from "@/components/ui/slider";

interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

type SelectedElement = { type: "media" | "customText"; index: number } | null;
type SelectedLayer = "milkdrop" | "matrix" | "ascii" | "allMedia" | "background" | null;
type MixBlendMode =
    | "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" |
    "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";

type ExtendedMediaType = "audio" | "video" | "image" | "text";

export interface ExtendedMediaItem extends Omit<MediaItem, "type"> {
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
}) => {
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css";
        document.head.appendChild(link);
    }, []);

    const { computedColor } = useSkryrColor();
    const [showMediaOptions, setShowMediaOptions] = React.useState(false);

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
        setShowMediaOptions(true);
    };

    const unboundMediaList: MediaItem[] = mediaList
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

    const renderMediaOptions = () => {
        if (!selectedElement || selectedElement.index >= mediaList.length) return null;
        const media = mediaList[selectedElement.index];

        const updateMediaProperty = (property: keyof ExtendedMediaItem, value: any) => {
            setMediaList(prev => {
                const newList = [...prev];
                newList[selectedElement.index] = { ...newList[selectedElement.index], [property]: value };
                return newList;
            });
        };

        const isMediaType = ["image", "gif", "video"].includes(media.type);

        return (
            <div className="flex flex-col gap-2 text-white">
                <h3 className="text-lg font-semibold">Media Options</h3>

                {isMediaType && (
                    <>
                        <div className="flex flex-col gap-1">
                            <span>Opacity: {Math.round(media.opacity * 100)}%</span>
                            <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={[media.opacity]}
                                onValueChange={(value) => updateMediaProperty("opacity", value[0])}
                                className="w-full"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span>Rotation</span>
                            <input
                                type="number"
                                value={parseInt(media.transform?.match(/rotate\((\d+)/)?.[1] || "0")}
                                onChange={(e) => updateMediaProperty("transform", `rotate(${e.target.value}deg)`)}
                                className="bg-gray-800 text-white p-1 rounded"
                            />
                        </div>
                    </>
                )}

                {media.type === "text" && (
                    <div className="flex flex-col gap-1">
                        <span>Text Content</span>
                        <textarea
                            value={media.textContent || ""}
                            onChange={(e) => updateMediaProperty("textContent", e.target.value)}
                            className="bg-gray-800 text-white p-2 rounded h-24 resize-y"
                            placeholder="Enter ASCII/text content"
                        />
                    </div>
                )}

                <Button
                    onClick={() => setShowMediaOptions(false)}
                    className="bg-gray-700 hover:bg-gray-600 mt-2"
                >
                    Close
                </Button>
            </div>
        );
    };

    return (
        <div
            className="flex flex-row gap-2 justify-center"
            style={{ width: showPalette ? "fit-content" : "0px", transition: "width 0.3s ease-in-out", backgroundColor: "transparent" }}
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
                    onMediaSelect={(media) => setMediaList((prev) => [...prev, { ...media, type: media.type as ExtendedMediaType, opacity: 1 }])}
                    onMediaDragStart={(media) => setMediaList((prev) => [...prev, { ...media, type: media.type as ExtendedMediaType, opacity: 1 }])}
                />
            </div>

            {showPalette && (
                <div className="flex flex-col gap-3 p-3 bg-black/80 rounded-lg shadow-lg">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                            onClick={() => setShowVirtualKeyboard((prev) => !prev)}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: showVirtualKeyboard ? computedColor : "gray" }}
                            title="Toggle Keyboard (F2)"
                        >
                            <i className="fa-solid fa-keyboard text-xl" />
                        </Button>
                        <Button
                            onClick={() => setShowUnboundMediaList((prev) => !prev)}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: showUnboundMediaList ? computedColor : "gray" }}
                            title="Toggle Unbound Media (F4)"
                        >
                            <i className="fa-solid fa-box text-xl" />
                        </Button>
                        <Button
                            onClick={() => setShowMediaPanel((prev) => !prev)}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: showMediaPanel ? computedColor : "gray" }}
                            title="Toggle Media Panel (F3)"
                        >
                            <i className="fa-solid fa-images text-xl" />
                        </Button>
                        <Button
                            onClick={toggleLayerPanel}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: showLayerPanel ? computedColor : "gray" }}
                            title="Toggle Layer Panel (F7)"
                        >
                            <i className="fa-solid fa-layer-group text-xl" />
                        </Button>
                        <Button
                            onClick={toggleAllPanels}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
                            title="Toggle All Panels (Tab)"
                        >
                            <i className="fa-solid fa-tools text-xl" />
                        </Button>
                        <Button
                            onClick={toggleRecording}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: isRecording ? computedColor : "gray" }}
                            title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                            <i className={`fa-solid ${isRecording ? "fa-stop" : "fa-video"} text-xl`} />
                        </Button>
                        <Button
                            onClick={handleToggleFullscreen}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
                            title="Toggle Fullscreen (F11)"
                        >
                            <i className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"} text-xl`} />
                        </Button>
                        <Button
                            onClick={handleZoomIn}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
                            title="Zoom In (PageUp)"
                        >
                            <i className="fa-solid fa-plus text-xl" />
                        </Button>
                        <Button
                            onClick={handleZoomOut}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
                            title="Zoom Out (PageDown)"
                        >
                            <i className="fa-solid fa-minus text-xl" />
                        </Button>
                        <Button
                            onClick={toggleWinamp}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: showWinamp ? computedColor : "gray" }}
                            title="Toggle Winamp"
                        >
                            <i className="fa-solid fa-compact-disc text-xl" />
                        </Button>
                        <Button
                            onClick={handleClearAllMedia}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
                            title="Clear All Media"
                        >
                            <i className="fa-solid fa-eraser text-xl" />
                        </Button>
                        <Button
                            onClick={handleClear404Media}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
                            title="Clear 404 Media"
                        >
                            <i className="fa-solid fa-trash text-xl" />
                        </Button>
                        <Button
                            onClick={toggleAudioIntegration}
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: isAudioIntegrationActive ? computedColor : "gray" }}
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
                            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                            style={{ backgroundColor: computedColor }}
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

            <div
                className={`transition-all duration-300 ease-in-out p-2 bg-black/80 rounded-lg shadow-lg animate-panel ${showMediaOptions ? "panel-open" : "panel-closed"}`}
                style={{
                    width: showMediaOptions ? "300px" : "0px",
                    maxHeight: showMediaOptions ? "calc(100vh - 100px)" : "0px",
                    opacity: showMediaOptions ? 1 : 0,
                    visibility: showMediaOptions ? "visible" : "hidden",
                    overflowY: "auto",
                }}
            >
                {renderMediaOptions()}
            </div>

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