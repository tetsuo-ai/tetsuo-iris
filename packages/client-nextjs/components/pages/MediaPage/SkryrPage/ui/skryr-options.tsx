"use client";

import React from "react";

const truncateFileName = (name: string): string =>
    name.length > 8 ? name.substring(0, 8) + "..." : name;

interface SkryrOptionsProps {
    selectedElement: {
        type: "media" | "customText";
        index: number;
        fileName?: string;
    } | null;
    selectedLayer: 'milkdrop' | 'matrix' | 'ascii' | 'allMedia' | 'reorder' | null; // Added 'reorder'
    renderOptionsContent: () => JSX.Element | null;
    profileColor: string;
    onDeselectElement: () => void;
}

const SkryrOptions: React.FC<SkryrOptionsProps> = ({
    selectedElement,
    selectedLayer,
    renderOptionsContent,
    profileColor,
    onDeselectElement,
}) => {
    return (
        <div
            className="p-4 space-y-2 flex flex-col items-center rounded-lg shadow-lg w-[300px]"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
        >
            {selectedElement || selectedLayer ? (
                <>
                    {/* Show filename or layer name if available */}
                    {(selectedElement?.fileName || selectedLayer) && (
                        <div className="flex items-center justify-between w-full">
                            <span
                                className="text-sm font-bold"
                                style={{ color: profileColor, backgroundColor: "transparent" }}
                            >
                                {selectedElement?.fileName
                                    ? truncateFileName(selectedElement.fileName)
                                    : selectedLayer
                                        ? selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)
                                        : ""}
                            </span>
                            <button
                                onClick={onDeselectElement}
                                className="px-2 py-1 ml-2 text-sm font-bold bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                                title="Close / Deselect"
                            >
                                X
                            </button>
                        </div>
                    )}
                    <div style={{ color: profileColor }}>{renderOptionsContent()}</div>
                </>
            ) : (
                <div className="text-xs" style={{ color: profileColor }}>
                    Double-click an element or layer for options
                </div>
            )}
        </div>
    );
};

export default SkryrOptions;