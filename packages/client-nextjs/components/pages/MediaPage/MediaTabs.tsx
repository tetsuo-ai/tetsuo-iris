"use client";

import React, { useState } from "react";
import DallePage from "./DallePage";
import FluxPage from "./FluxPage";
import AnimationPage from "./AnimationPage";
import AsciiPage from "./SkryrPage/ui/skryr-ascii-page";
import GiphyGifKeyboard from "./SkryrPage/ui/skryr-giphy-keyboard";
import type { MediaItem, CustomTextItem } from "./SkryrPage/hooks/useMediaState";
import { useSkryrColor } from "./SkryrPage/ui/skryr-color-context";

export interface MediaTabsProps {
    onMediaSelect: (media: MediaItem | CustomTextItem) => void;
    onMediaDragStart: (media: MediaItem | CustomTextItem) => void;
    onDoubleClick?: (index: number) => void;
}

const MediaTabs: React.FC<MediaTabsProps> = ({ onMediaSelect, onMediaDragStart }) => {
    const [activeTab, setActiveTab] = useState<"dalle" | "flux" | "animate" | "gif" | "ascii">("dalle");
    const { computedColor } = useSkryrColor();

    return (
        <div className="px-2 py-1 flex flex-col gap-2">
            <div className="flex gap-1 justify-around border-b pb-1" style={{ borderColor: computedColor, lineHeight: 0 }}>
                <button
                    onClick={() => setActiveTab("dalle")}
                    className={`px-4 py-2 bg-transparent ${activeTab === "dalle" ? "border-2" : "border opacity-50"} hover:bg-gray-600 rounded-md transition-colors`}
                    style={{ color: activeTab === "dalle" ? computedColor : "#D1D5DB", borderColor: computedColor }}
                    title="DALL-E"
                >
                    <i className="fa-solid fa-paint-brush" />
                </button>
                <button
                    onClick={() => setActiveTab("flux")}
                    className={`px-4 py-2 bg-transparent ${activeTab === "flux" ? "border-2" : "border opacity-50"} hover:bg-gray-600 rounded-md transition-colors`}
                    style={{ color: activeTab === "flux" ? computedColor : "#D1D5DB", borderColor: computedColor }}
                    title="Flux"
                >
                    <i className="fa-solid fa-water" />
                </button>
                <button
                    onClick={() => setActiveTab("animate")}
                    className={`px-4 py-2 bg-transparent ${activeTab === "animate" ? "border-2" : "border opacity-50"} hover:bg-gray-600 rounded-md transition-colors`}
                    style={{ color: activeTab === "animate" ? computedColor : "#D1D5DB", borderColor: computedColor }}
                    title="Animate"
                >
                    <i className="fa-solid fa-film" />
                </button>
                <button
                    onClick={() => setActiveTab("gif")}
                    className={`px-4 py-2 bg-transparent ${activeTab === "gif" ? "border-2" : "border opacity-50"} hover:bg-gray-600 rounded-md transition-colors`}
                    style={{ color: activeTab === "gif" ? computedColor : "#D1D5DB", borderColor: computedColor }}
                    title="GIF"
                >
                    <i className="fa-solid fa-images" />
                </button>
                <button
                    onClick={() => setActiveTab("ascii")}
                    className={`px-4 py-2 bg-transparent ${activeTab === "ascii" ? "border-2" : "border opacity-50"} hover:bg-gray-600 rounded-md transition-colors`}
                    style={{ color: activeTab === "ascii" ? computedColor : "#D1D5DB", borderColor: computedColor }}
                    title="ASCII"
                >
                    <i className="fa-solid fa-terminal" />
                </button>
            </div>
            <div className="p-2">
                {activeTab === "dalle" && <DallePage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />}
                {activeTab === "flux" && <FluxPage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />}
                {activeTab === "animate" && <AnimationPage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />}
                {activeTab === "gif" && (
                    <GiphyGifKeyboard
                        onGifSelect={(gifUrl: string) => {
                            const media: MediaItem = {
                                id: `media-${Date.now()}`,
                                type: "image",
                                src: gifUrl,
                                x: 50,
                                y: 50,
                                scale: 1,
                                rotation: 0,
                                opacity: 1,
                                visible: true,
                                showAt: 0,
                                hideAt: 120,
                            };
                            onMediaSelect(media);
                        }}
                    />
                )}
                {activeTab === "ascii" && <AsciiPage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />}
            </div>
        </div>
    );
};

export default MediaTabs;