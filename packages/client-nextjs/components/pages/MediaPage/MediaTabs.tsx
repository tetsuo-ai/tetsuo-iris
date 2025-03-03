"use client";

import React, { useState } from "react";
import DallePage from "./DallePage";
import FluxPage from "./FluxPage";
import AnimationPage from "./AnimationPage";
import GiphyGifKeyboard from "@/components/ui/GiphyGifKeyboard";
import type { MediaItem } from "@/components/ui/UnboundMediaList";

export interface MediaTabsProps {
    onMediaSelect: (media: MediaItem) => void;
    onMediaDragStart?: (media: MediaItem) => void;
}

const MediaTabs: React.FC<MediaTabsProps> = ({ onMediaSelect, onMediaDragStart }) => {
    const [activeTab, setActiveTab] = useState<"dalle" | "flux" | "animate" | "gif">("dalle");

    return (
        <div className="p-2">
            {/* Tab Headers */}
            <div className="flex space-x-4 border-b mb-2">
                <button
                    onClick={() => setActiveTab("dalle")}
                    className={`px-3 py-1 ${activeTab === "dalle" ? "border-b-2 border-blue-500" : ""}`}
                >
                    DALL‑E
                </button>
                <button
                    onClick={() => setActiveTab("flux")}
                    className={`px-3 py-1 ${activeTab === "flux" ? "border-b-2 border-blue-500" : ""}`}
                >
                    Flux
                </button>
                <button
                    onClick={() => setActiveTab("animate")}
                    className={`px-3 py-1 ${activeTab === "animate" ? "border-b-2 border-blue-500" : ""}`}
                >
                    Animate
                </button>
                <button
                    onClick={() => setActiveTab("gif")}
                    className={`px-3 py-1 ${activeTab === "gif" ? "border-b-2 border-blue-500" : ""}`}
                >
                    GIF
                </button>
            </div>
            {/* Tab Content */}
            <div className="p-2">
                {activeTab === "dalle" && (
                    <DallePage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />
                )}
                {activeTab === "flux" && (
                    <FluxPage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />
                )}
                {activeTab === "animate" && (
                    <AnimationPage onMediaSelect={onMediaSelect} onMediaDragStart={onMediaDragStart} />
                )}
                {activeTab === "gif" && (
                    <GiphyGifKeyboard
                        onGifSelect={(gifUrl: string) => {
                            // Wrap the GIF URL into a MediaItem
                            const media: MediaItem = {
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
                                interruptOnPlay: true,
                            };
                            onMediaSelect(media);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default MediaTabs;
