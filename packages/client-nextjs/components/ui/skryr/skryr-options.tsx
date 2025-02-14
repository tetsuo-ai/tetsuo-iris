import React from "react";

interface SkryrOptionsProps {
    selectedElement: { type: "media" | "customText"; index: number } | null;
    renderOptionsContent: () => JSX.Element | null;
}

const SkryrOptions: React.FC<SkryrOptionsProps> = ({ selectedElement, renderOptionsContent }) => {
    return (
        <div className="p-4 space-y-2 flex flex-col items-center rounded-lg shadow-lg w-[300px]"
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.8);"
            }}>
            {selectedElement ? (
                renderOptionsContent()
            ) : (
                <div className="text-xs text-gray-300">Double-click an element for options</div>
            )}
        </div>
    );
};

export default SkryrOptions;
