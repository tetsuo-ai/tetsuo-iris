import React from "react";

interface ScryerOptionsProps {
    selectedElement: { type: "media" | "customText"; index: number } | null;
    renderOptionsContent: () => JSX.Element | null;
}

const ScryerOptions: React.FC<ScryerOptionsProps> = ({ selectedElement, renderOptionsContent }) => {
    return (
        <div className="bg-gray-800 p-4 space-y-2 flex flex-col items-center rounded-lg shadow-lg w-[300px]">
            {selectedElement ? (
                renderOptionsContent()
            ) : (
                <div className="text-xs text-gray-300">Double-click an element for options</div>
            )}
        </div>
    );
};

export default ScryerOptions;
