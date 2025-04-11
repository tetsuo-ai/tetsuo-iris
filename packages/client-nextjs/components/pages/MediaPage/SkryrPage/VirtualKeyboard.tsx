// VirtualKeyboard.tsx
import React from "react";
import { topRow, secondRow, thirdRow, fourthRow, numpadRow } from "./hooks/useMediaState";
import { ExtendedMediaItem } from "./ui/skryr-toolbar";

export interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

export interface VirtualKeyboardProps {
    keyMappings: KeyMapping[];
    mediaList: ExtendedMediaItem[]; // Changed from MediaItem to ExtendedMediaItem
    setKeyMappings: React.Dispatch<React.SetStateAction<KeyMapping[]>>;
    setMediaList: React.Dispatch<React.SetStateAction<ExtendedMediaItem[]>>; // Changed from MediaItem to ExtendedMediaItem
    computedColor: string;
    onSelectElement?: (elem: { type: "media" | "customText"; index: number } | null) => void;
    checkMediaValidity?: (item: ExtendedMediaItem, index: number) => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
    keyMappings,
    mediaList,
    setKeyMappings,
    setMediaList,
    computedColor,
    onSelectElement,
    checkMediaValidity,
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
                        onDragStart={(e) => {
                            if (mapping.assignedIndex !== null) {
                                e.dataTransfer.setData("application/x-media-index", mapping.assignedIndex.toString());
                            }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Drop event triggered with data:", e.dataTransfer.getData("application/x-media-index"));

                            // Handle drag from UnboundMediaList
                            const mediaIndexData = e.dataTransfer.getData("application/x-media-index");
                            if (mediaIndexData) {
                                const mediaIndex = parseInt(mediaIndexData, 10);
                                console.log("Dragging media index:", mediaIndex, "Media at index:", mediaList[mediaIndex]);
                                if (!isNaN(mediaIndex) && mediaList[mediaIndex]) {
                                    const newMappings = [...keyMappings];
                                    // Ensure all indices up to mappingIndex are populated
                                    for (let i = 0; i <= mappingIndex; i++) {
                                        if (!newMappings[i]) {
                                            newMappings[i] = {
                                                key: String.fromCharCode(48 + i), // e.g., "0", "1", "2", ...
                                                assignedIndex: null,
                                                mappingType: "media",
                                                mode: "toggle",
                                            };
                                        }
                                    }
                                    newMappings[mappingIndex] = {
                                        key: keyLabel,
                                        assignedIndex: mediaIndex,
                                        mappingType: mediaList[mediaIndex].type === "audio" ? "audio" : "media",
                                        mode: "toggle",
                                    };
                                    setKeyMappings(newMappings);
                                    console.log(`Bound existing media ${mediaList[mediaIndex].src} to key ${keyLabel} at index ${mediaIndex}`);
                                    if (onSelectElement) {
                                        onSelectElement({ type: "media", index: mediaIndex });
                                    }
                                    return;
                                } else {
                                    console.error("Invalid media index or media not found:", mediaIndex);
                                    return;
                                }
                            }

                            // Handle local file drop
                            const files = e.dataTransfer.files;
                            if (files && files.length > 0) {
                                const file = files[0];
                                const fileType = file.type;
                                let newType: ExtendedMediaItem["type"] = "image";

                                if (fileType.startsWith("video/")) newType = "video";
                                else if (fileType.startsWith("audio/")) newType = "audio";
                                else if (fileType.startsWith("image/")) newType = "image";
                                else if (fileType.startsWith("text/")) newType = "text";

                                const src = URL.createObjectURL(file);
                                const newMedia: ExtendedMediaItem = {
                                    id: `media-${Date.now()}`, // Add unique ID
                                    type: newType,
                                    src: src,
                                    x: 0,
                                    y: 0,
                                    scale: 1,
                                    rotation: 0,
                                    opacity: 1,
                                    visible: true,
                                    showAt: 0,
                                    hideAt: 120,
                                    interruptOnPlay: true,
                                    isManuallyControlled: true,
                                    mixBlendMode: "normal",
                                    showControls: newType === "video",
                                };

                                setMediaList((prev: ExtendedMediaItem[]) => {
                                    const newList = [...prev, newMedia];
                                    const newIndex = newList.length - 1;
                                    setKeyMappings((prevMappings: KeyMapping[]) => {
                                        const newMappings = [...prevMappings];
                                        // Ensure all indices up to mappingIndex are populated
                                        for (let i = 0; i <= mappingIndex; i++) {
                                            if (!newMappings[i]) {
                                                newMappings[i] = {
                                                    key: String.fromCharCode(48 + i), // e.g., "0", "1", "2", ...
                                                    assignedIndex: null,
                                                    mappingType: "media",
                                                    mode: "toggle",
                                                };
                                            }
                                        }
                                        newMappings[mappingIndex] = {
                                            key: keyLabel,
                                            assignedIndex: newIndex,
                                            mappingType: newType === "audio" ? "audio" : "media",
                                            mode: "toggle",
                                        };
                                        console.log(`Bound new local media ${src} to key ${keyLabel} at index ${newIndex}`);
                                        console.log("Updated keyMappings:", newMappings);
                                        if (onSelectElement) {
                                            onSelectElement({ type: "media", index: newIndex });
                                        }
                                        return newMappings;
                                    });
                                    if (checkMediaValidity) {
                                        checkMediaValidity(newMedia, newIndex);
                                    }
                                    return newList;
                                });
                                return;
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