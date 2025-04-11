"use client";

import React, { useState } from "react";
import { CustomTextItem } from "../hooks/useMediaState";
import { useSkryrColor } from "./skryr-color-context";

interface AsciiPageProps {
    onMediaSelect: (media: CustomTextItem) => void;
    onMediaDragStart: (media: CustomTextItem) => void;
}

const AsciiPage: React.FC<AsciiPageProps> = ({ onMediaSelect, onMediaDragStart }) => {
    const [inputText, setInputText] = useState("ASCII Art");
    const [color, setColor] = useState("#ffffff");
    const [fontStyle, setFontStyle] = useState("monospace");
    const [fontWeight, setFontWeight] = useState("normal");
    const { computedColor } = useSkryrColor();

    const generateAscii = (text: string) => {
        const lines = text.split("\n");
        const maxWidth = Math.max(...lines.map((line) => line.length));
        const paddedLines = lines.map((line) => line.padEnd(maxWidth, " "));
        return paddedLines.join("\n");
    };

    const handleGenerate = () => {
        const asciiText = generateAscii(inputText);
        const media: CustomTextItem = {
            id: Date.now(),
            text: asciiText,
            isAscii: true,
            x: 50,
            y: 50,
            scale: 1,
            flashSpeed: 0,
            flashIntensity: 0,
            color,
            fontStyle,
            fontWeight,
        };
        console.log("Generated ASCII CustomTextItem:", media);
        onMediaSelect(media);
    };

    const handleDragStart = (e: React.DragEvent) => {
        const asciiText = generateAscii(inputText);
        const media: CustomTextItem = {
            id: Date.now(),
            text: asciiText,
            isAscii: true,
            x: 50,
            y: 50,
            scale: 1,
            flashSpeed: 0,
            flashIntensity: 0,
            color,
            fontStyle,
            fontWeight,
        };
        console.log("Dragging ASCII CustomTextItem:", media);
        onMediaDragStart(media);
        e.dataTransfer.setData("application/x-custom-text", JSON.stringify(media));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div className="flex flex-col gap-2 p-2 bg-black/80 rounded-lg">
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter text for ASCII art"
                className="w-full p-2 bg-black/80 text-white rounded border"
                rows={4}
                style={{ borderColor: computedColor }}
            />
            <div className="flex gap-2 items-center">
                <i className="fa-solid fa-palette text-sm" style={{ color: computedColor }} title="Color" />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-8 h-8 bg-black/80 border"
                    style={{ borderColor: computedColor }}
                />
            </div>
            <div className="flex gap-2 items-center">
                <i className="fa-solid fa-font text-sm" style={{ color: computedColor }} title="Font Style" />
                <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="p-1 bg-black/80 text-white rounded text-sm border"
                    style={{ borderColor: computedColor }}
                >
                    <option value="monospace">Monospace</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                </select>
            </div>
            <div className="flex gap-2 items-center">
                <i className="fa-solid fa-weight-hanging text-sm" style={{ color: computedColor }} title="Font Weight" />
                <select
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="p-1 bg-black/80 text-white rounded text-sm border"
                    style={{ borderColor: computedColor }}
                >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Lighter</option>
                    <option value="bolder">Bolder</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleGenerate}
                    className="p-2 bg-transparent border hover:bg-gray-600 text-white rounded transition-colors"
                    style={{ color: computedColor, borderColor: computedColor }}
                    title="Generate ASCII"
                >
                    <i className="fa-solid fa-terminal" />
                </button>
                <div
                    draggable
                    onDragStart={handleDragStart}
                    className="p-2 bg-transparent border hover:bg-gray-600 text-white rounded cursor-move transition-colors"
                    style={{ color: computedColor, borderColor: computedColor }}
                    title="Drag to Workspace"
                >
                    <i className="fa-solid fa-arrows-alt" />
                </div>
            </div>
            <pre style={{ color, fontFamily: fontStyle, fontWeight, background: "transparent", padding: "8px", borderRadius: "4px" }}>
                {generateAscii(inputText)}
            </pre>
        </div>
    );
};

export default AsciiPage;