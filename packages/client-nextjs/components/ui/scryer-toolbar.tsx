import React from "react";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/components/pages/MediaPage/ScryerPage";
import type { SelectedElement } from "@/components/pages/MediaPage/ScryerPage";

interface ScryerToolbarProps {
    isPlaying: boolean;
    handlePlayPause: () => void;
    handleRewind: () => void;
    handleStop: () => void;
    handleFastForward: () => void;
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
    renderVirtualKeyboardPanel: () => JSX.Element;
    selectedElement: SelectedElement | null;
    renderOptionsContent: () => JSX.Element | null;
}

const ScryerToolbar: React.FC<ScryerToolbarProps> = ({
    isPlaying,
    handlePlayPause,
    handleRewind,
    handleStop,
    handleFastForward,
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
    renderOptionsContent,
}) => {
    return (
        <div className="flex space-x-4 items-start">
            {/* Main Controls */}
            <div className="bg-gray-800 p-4 space-y-4 flex flex-col items-center rounded-lg shadow-lg w-[600px]">
                <div className="w-full flex justify-between items-center space-x-2">
                    {/* Group 1: Help, Matrix, ASCII */}
                    <div className="flex space-x-2">
                        <Button onClick={() => alert("Hotkeys & Instructions")} title="Help">❓</Button>
                        <Button
                            onClick={() => setBackgroundEnabled((prev) => !prev)}
                            className={backgroundEnabled ? "bg-green-600" : "bg-red-600"}
                            title="Toggle Matrix"
                        >
                            🌌
                        </Button>
                        <Button
                            onClick={() => setEmbeddedMode((prev) => !prev)}
                            className={embeddedMode ? "bg-green-600" : "bg-red-600"}
                            title="Toggle ASCII"
                        >
                            🎭
                        </Button>
                    </div>

                    {/* Group 2: Playback Controls */}
                    <div className="flex space-x-2">
                        <Button onClick={handleRewind} className="w-10 h-10 text-2xl bg-blue-700" title="Rewind">⏪</Button>
                        <Button onClick={handlePlayPause} className="w-10 h-10 text-2xl bg-blue-600" title="Play / Pause">
                            {isPlaying ? "⏸" : "▶"}
                        </Button>
                        <Button onClick={handleStop} className="w-10 h-10 text-2xl bg-red-600" title="Stop">⏹</Button>
                        <Button onClick={handleFastForward} className="w-10 h-10 text-2xl bg-blue-700" title="Fast Forward">⏩</Button>
                    </div>

                    {/* Group 3: Fullscreen & Tools Toggle */}
                    <div className="flex space-x-2">
                        <Button onClick={handleToggleFullscreen} className="w-10 h-10 text-2xl bg-purple-600" title="Toggle Fullscreen">⛶</Button>
                        <Button
                            onClick={() => setShowToolsInFullscreen((prev) => !prev)}
                            className={`w-10 h-10 text-2xl ${showToolsInFullscreen ? "bg-green-600" : "bg-red-600"}`}
                            title="Toggle Fullscreen Tools"
                        >
                            🛠
                        </Button>
                    </div>
                </div>

                {/* Audio Timeline */}
                <div className="w-full flex flex-col">
                    {primaryAudioSrc ? (
                        <>
                            <span className="text-xs text-center text-gray-400">Audio Timeline</span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={0.1}
                                value={audioProgress}
                                onChange={(e) => {
                                    if (primaryAudioRef.current && primaryAudioRef.current.duration) {
                                        const newTime = (parseFloat(e.target.value) / 100) * primaryAudioRef.current.duration;
                                        primaryAudioRef.current.currentTime = newTime;
                                        setAudioProgress(parseFloat(e.target.value));
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <div
                            className="p-2 border-dashed border-2 border-gray-400 rounded text-xs text-center"
                            onDrop={onPrimaryAudioDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            Drag & Drop Primary Audio Here
                        </div>
                    )}
                </div>

                {/* Virtual Keyboard Panel */}
                <div className="w-full flex flex-col justify-center mt-2 space-y-1">
                    {renderVirtualKeyboardPanel()}
                </div>
            </div>

            {/* Media Options Panel */}
            <div className="w-[300px] bg-gray-800 p-4 space-y-2 flex flex-col items-center rounded-lg shadow-lg">
                {selectedElement ? (
                    renderOptionsContent()
                ) : (
                    <div className="text-xs text-gray-300">Double-click an element for options</div>
                )}
            </div>
        </div>
    );
};

export default ScryerToolbar;
