"use client";

import React from "react";

// Helper function to truncate filenames
const truncateFileName = (name: string): string =>
    name.length > 8 ? name.substring(0, 8) + "..." : name;

interface SkryrOptionsProps {
    selectedElement: {
        type: "media" | "customText";
        index: number;
        fileName?: string;
    } | null;
    renderOptionsContent: () => JSX.Element | null;
    profileColor: string;

    // Deselect callback from parent
    onDeselectElement: () => void;
}

const SkryrOptions: React.FC<SkryrOptionsProps> = ({
    selectedElement,
    renderOptionsContent,
    profileColor,
    onDeselectElement,
}) => {
    return (
        <div
            className="p-4 space-y-2 flex flex-col items-center rounded-lg shadow-lg w-[220px] max-w-[220px]"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
        >
            {selectedElement ? (
                <>
                    {/* If there's a filename, show it + the "X" in one row */}
                    {selectedElement.fileName && (
                        <div className="flex items-center justify-between w-full">
                            <span
                                className="text-sm font-bold"
                                style={{ color: profileColor, backgroundColor: "transparent" }}
                            >
                                {truncateFileName(selectedElement.fileName)}
                            </span>

                            {/* X Button to deselect */}
                            <button
                                onClick={onDeselectElement}
                                className="px-2 py-1 ml-2 text-sm font-bold bg-gray-700 text-white rounded 
                           hover:bg-gray-600 transition-colors duration-200"
                                title="Close / Deselect"
                            >
                                X
                            </button>
                        </div>
                    )}

                    {/* Render the rest of the options content */}
                    <div style={{ color: profileColor }}>{renderOptionsContent()}</div>
                </>
            ) : (
                <div className="text-xs" style={{ color: profileColor }}>
                    Double-click an element for options
                </div>
            )}
        </div>
    );
};

export default SkryrOptions;
