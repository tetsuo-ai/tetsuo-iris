"use client";

import React from "react";
import { useSkryrColor } from "./skryr-color-context";

export interface MediaItem {
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

interface UnboundMediaListProps {
    mediaList: MediaItem[];
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
    // Compute indices of bound media with null safety
    console.log("keyMappings before filter:", keyMappings); // Debug log
    const boundIndices = keyMappings
        .filter((mapping) => mapping && mapping.assignedIndex !== null)
        .map((mapping) => mapping!.assignedIndex!);
    // For each media item, keep its actual index
    const unboundMedia = mediaList
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !boundIndices.includes(index));
    const { computedColor } = useSkryrColor();

    return (
        <div className="p-2 bg-black/50 rounded text-white w-full">
            <div className="font-bold mb-2" style={{ color: computedColor }}>Unbound Media Items</div>
            {unboundMedia.length === 0 && (
                <div className="text-xs text-gray-400">No unbound media items</div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" style={{ color: computedColor }}>
                {unboundMedia.map(({ item, index }) => (
                    <div
                        key={index}
                        className={`flex items-center justify-center border rounded cursor-pointer w-full aspect-square ${item.visible ? "border-green-500" : "border-red-500"}`}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData("application/x-media-index", index.toString());
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