
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SkryrPaletteProps {
    isFullscreen: boolean;
    handleToggleFullscreen: () => void;
    showPalette: boolean;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    showToolsInFullscreen: boolean;
    setShowToolsInFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    embeddedMode: boolean;
    setEmbeddedMode: React.Dispatch<React.SetStateAction<boolean>>;
    children: React.ReactNode;
}

const SkryrPalette: React.FC<SkryrPaletteProps> = ({
    isFullscreen,
    handleToggleFullscreen,
    showPalette,
    setShowPalette,
    showToolsInFullscreen,
    setShowToolsInFullscreen,
    backgroundEnabled,
    setBackgroundEnabled,
    embeddedMode,
    setEmbeddedMode,
    children,
}) => {
    const paletteRef = useRef<HTMLDivElement>(null);
    // Always store the palette position as pixel values.
    const [position, setPosition] = useState({ x: 10, y: 10 });

    // When switching to full screen, ensure the palette is within bounds.
    useEffect(() => {
        if (isFullscreen) {
            const maxX = window.innerWidth - 200; // adjust as needed
            const maxY = window.innerHeight - 100; // adjust as needed
            setPosition((prev) => ({
                x: Math.min(prev.x, maxX),
                y: Math.min(prev.y, maxY),
            }));
        }
    }, [isFullscreen]);

    // Drag handle – only the header initiates dragging.
    const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const initPos = { ...position };
        const onMouseMove = (ev: MouseEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaY = ev.clientY - startY;
            setPosition({ x: initPos.x + deltaX, y: initPos.y + deltaY });
        };
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case "F11":
                    event.preventDefault();
                    handleToggleFullscreen();
                    break;
                case "F10":
                    event.preventDefault();
                    setShowPalette((prev) => !prev);
                    break;
                case "Home":
                    event.preventDefault();
                    setBackgroundEnabled((prev) => !prev);
                    break;
                case "End":
                    event.preventDefault();
                    setEmbeddedMode((prev) => !prev);
                    break;
                case "PageUp":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("zoom", { detail: 0.1 }));
                    break;
                case "PageDown":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("zoom", { detail: -0.1 }));
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("rewind"));
                    break;
                case "ArrowRight":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("fastforward"));
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("stop"));
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("restart"));
                    break;
                case "Space":
                    event.preventDefault();
                    document.dispatchEvent(new CustomEvent("playpause"));
                    break;
                case "F1":
                    event.preventDefault();
                    alert(`🔥 Hotkey Guide:
- Space: Play/Pause
- Left Arrow: Rewind
- Right Arrow: Fast Forward
- Down Arrow: Stop
- Up Arrow: Restart
- F11: Toggle Fullscreen
- F10: Toggle Palette
- Page Up: Zoom In
- Page Down: Zoom Out
- Home: Toggle Matrix Background
- End: Toggle ASCII Mode
- Esc: Exit Fullscreen
`);
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleToggleFullscreen, setShowPalette, setBackgroundEnabled, setEmbeddedMode]);

    return (
        <div
            ref={paletteRef}
            className="fixed z-[100] bg-gray-900 rounded-lg shadow-lg"
            style={{
                left: "50%",
                bottom: "0px",
                transform: "translateX(-50%)",
                display: showPalette ? "block" : "none",
                cursor: "default",
                background: "url(https://eaccelerate.me/tetsuo/skryr-palette-logo.png) no-repeat center/cover",
            }}
        >
            {/* Drag Handle */}
            <div
                className="flex items-center px-2 py-1 cursor-move select-none"
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0);"}}
                onMouseDown={handleDragHandleMouseDown}
            >
                <span className="text-lg bold">☰ Launchpad SKRYR </span>
            </div>
            {/* Palette Content */}
            <div className="p-4">{children}</div>
        </div>
    );
};

export default SkryrPalette;
