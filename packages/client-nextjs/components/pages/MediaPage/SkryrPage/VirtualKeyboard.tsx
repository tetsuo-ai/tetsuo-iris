import React from "react";
import { topRow, secondRow, thirdRow, fourthRow, numpadRow } from "./hooks/useMediaState";

// Re-export the keyboard rows for use in SkryrPage.tsx
export { topRow, secondRow, thirdRow, fourthRow, numpadRow };

// Export MediaItem interface
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
    isManuallyControlled?: boolean;
    interruptOnPlay?: boolean;
}

// Export KeyMapping interface
export interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

interface VirtualKeyboardProps {
    keyMappings: KeyMapping[];
    mediaList: MediaItem[];
    setKeyMappings: (mappings: KeyMapping[]) => void;
    setMediaList: (mediaList: MediaItem[]) => void;
    computedColor: string;
    onSelectElement?: (elem: { type: "media" | "customText"; index: number } | null) => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
    keyMappings,
    mediaList,
    setKeyMappings,
    setMediaList,
    computedColor,
    onSelectElement,
}) => {
    const renderKeyboardRow = (row: string[], startIndex: number) => (
        <div className="flex gap-1 mb-1 justify-center">
            {row.map((keyLabel, i) => {
                const mappingIndex = startIndex + i;
                const mapping = keyMappings[mappingIndex] || { assignedIndex: null, mappingType: "media", mode: "toggle" };
                let cellContent: React.ReactNode = keyLabel;
                let borderStyle = "border border-transparent";
                let borderWidth = "border-[1px]";

                if (mapping.assignedIndex !== null && mediaList[mapping.assignedIndex]) {
                    const media = mediaList[mapping.assignedIndex];
                    if (media.type === "image") {
                        cellContent = <img src={media.src} alt={keyLabel} className="w-6 h-6 object-cover" />;
                    }
                    borderStyle = media.visible ? "border border-solid" : "border border-transparent";
                    borderWidth = media.visible ? "border-[3px]" : "";
                } else {
                    borderStyle = "border border-solid";
                    borderWidth = "border-[1px]";
                }

                return (
                    <div
                        key={mappingIndex}
                        className={`w-8 h-8 flex items-center justify-center text-xs rounded cursor-pointer select-none transition-all ${borderStyle} ${borderWidth}`}
                        style={{ borderColor: computedColor, backgroundColor: "rgba(0, 0, 0, 0.8)" }}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("mapping-index", mappingIndex.toString())}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const srcMappingIndexStr = e.dataTransfer.getData("mapping-index");
                            if (srcMappingIndexStr) {
                                const srcIdx = parseInt(srcMappingIndexStr, 10);
                                const newMappings = [...keyMappings];
                                [newMappings[mappingIndex], newMappings[srcIdx]] = [newMappings[srcIdx], newMappings[mappingIndex]];
                                setKeyMappings(newMappings);
                                return;
                            }
                            const mediaIndexData = e.dataTransfer.getData("application/x-media-index");
                            if (mediaIndexData) {
                                const mediaIndex = parseInt(mediaIndexData, 10);
                                if (!isNaN(mediaIndex)) {
                                    const newMappings = [...keyMappings];
                                    newMappings[mappingIndex].assignedIndex = mediaIndex;
                                    newMappings[mappingIndex].mappingType = "media";
                                    newMappings[mappingIndex].mode = "toggle";
                                    setKeyMappings(newMappings);
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
                                const newList = [...mediaList, newMedia];
                                setMediaList(newList);
                                const newMappings = [...keyMappings];
                                newMappings[mappingIndex].assignedIndex = newList.length - 1;
                                newMappings[mappingIndex].mappingType = "media";
                                newMappings[mappingIndex].mode = "toggle";
                                setKeyMappings(newMappings);
                            }
                        }}
                        onClick={() => {
                            if (mapping.assignedIndex !== null && onSelectElement) {
                                onSelectElement({ type: "media", index: mapping.assignedIndex });
                            }
                        }}
                    >
                        {cellContent}
                    </div>
                );
            })}
        </div>
    );

    const rows = [topRow, secondRow, thirdRow, fourthRow, numpadRow];
    let currentIndex = 0;

    return (
        <div className="p-2 border border-gray-500 rounded text-white text-center bg-black/80 shadow-lg">
            <div className="mb-2 font-bold" style={{ color: computedColor }}>Media Launchpad (drag & drop)</div>
            {rows.map((row, index) => {
                const rowElement = renderKeyboardRow(row, currentIndex);
                currentIndex += row.length;
                return (
                    <React.Fragment key={index}>
                        {rowElement}
                        {index === 3 && <div className="mt-2" style={{ color: computedColor }}>Numpad:</div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default VirtualKeyboard;