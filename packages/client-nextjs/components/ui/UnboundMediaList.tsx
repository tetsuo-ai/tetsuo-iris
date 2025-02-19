"use client";

import React from "react";
import { useState } from "react";
import { useSkryrColor } from "./skryr/SkryrColorContext";
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
    interruptOnPlay?: boolean;
}

interface UnboundMediaListProps {
    mediaList: MediaItem[];
    // Each key mapping (from your state) has an "assignedIndex" property.
    keyMappings: { assignedIndex: number | null }[];
    onToggleMedia: (index: number) => void;
    onOpenOptions: (index: number) => void;
}

const UnboundMediaList: React.FC<UnboundMediaListProps> = ({
    mediaList,
    keyMappings,
    onToggleMedia,
    onOpenOptions,
}) => {
    // Compute indices of bound media
    const boundIndices = keyMappings
        .filter((mapping) => mapping.assignedIndex !== null)
        .map((mapping) => mapping.assignedIndex);
    // For each media item, keep its actual index
    const unboundMedia = mediaList
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !boundIndices.includes(index));
    const { computedColor } = useSkryrColor();


    return (
        <div className="p-2 bg-black/50 rounded text-white w-full">
            <div className="font-bold mb-2" style={{ color: computedColor }}>Unbound Media Items</div>
            {unboundMedia.length === 0 && (
                <div className="text-xs text-gray-400" >No unbound media items</div>
            )}
            {/* Responsive grid layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" style={{ color: computedColor }}>
                {unboundMedia.map(({ item, index }) => (
                    <div
                        key={index}
                        className={`flex items-center justify-center border rounded cursor-pointer w-full aspect-square ${item.visible ? "border-green-500" : "border-red-500"
                            }`}
                           
                        draggable
                        onDragStart={(e) => {
                            // Set a custom MIME type with the actual media index.
                            e.dataTransfer.setData("application/x-media-index", index.toString());
                            // Clear text/plain so that fallback code does not fire.
                            e.dataTransfer.setData("text/plain", "");
                        }}
                        onClick={() => onToggleMedia(index)}
                        onDoubleClick={() => onOpenOptions(index)}
                        title="Click to toggle; double-click for options; drag to bind a key"
                    >
                        {item.type === "image" && (
                            <img
                                src={item.src}
                                alt={`Media ${index}`}
                                className="object-cover w-full h-full"
                                
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnboundMediaList;
