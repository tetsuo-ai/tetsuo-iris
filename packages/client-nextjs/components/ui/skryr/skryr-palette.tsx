"use client";

import React, { useEffect, useRef, useState } from "react";
import Slider from "@/components/ui/slider";

interface SkryrPaletteProps {
    isFullscreen: boolean;
    handleToggleFullscreen: (e?: React.MouseEvent<HTMLDivElement>) => void;
    showPalette: boolean;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    children?: React.ReactNode;
    computedColor?: string; // Add computedColor as an optional prop
    setComputedColor?: React.Dispatch<React.SetStateAction<string>>; // Add setter as an optional prop
}

const usePaletteDrag = (initialPosition: { x: number; y: number } | null, setPosition: (pos: { x: number; y: number }) => void) => {
    const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("input, button, select")) return;
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initPos = initialPosition ? { ...initialPosition } : { x: 0, y: 0 };

        const onMouseMove = (ev: MouseEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaY = ev.clientY - startY;
            setPosition({
                x: initPos.x + deltaX,
                y: initPos.y + deltaY,
            });
        };

        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    return { handleDragHandleMouseDown };
};

const SkryrPalette: React.FC<SkryrPaletteProps> = ({
    isFullscreen,
    handleToggleFullscreen,
    showPalette,
    setShowPalette,
    backgroundEnabled,
    setBackgroundEnabled,
    children,
    computedColor: externalComputedColor, // Rename to avoid conflict
    setComputedColor,
}) => {
    const paletteRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    const [svgHueRotation, setSvgHueRotation] = useState(0);
    const [svgSaturation, setSvgSaturation] = useState(5);
    const [svgSepia, setSvgSepia] = useState(1);
    const [svgInvert, setSvgInvert] = useState(1);
    const [colorHue, setColorHue] = useState(55);
    const [colorSaturation, setColorSaturation] = useState(100);
    const [colorLightness, setColorLightness] = useState(50);
    const [profile, setProfile] = useState("");
    const svgFilter = `invert(${svgInvert}) sepia(${svgSepia}) saturate(${svgSaturation}) hue-rotate(${svgHueRotation}deg)`;
    const internalComputedColor = `hsl(${colorHue}, ${colorSaturation}%, ${colorLightness}%)`;

    // Use external computedColor if provided, otherwise use internal
    const computedColor = externalComputedColor || internalComputedColor;

    // Sync internal color state with external setter if provided
    useEffect(() => {
        if (setComputedColor && internalComputedColor !== externalComputedColor) {
            setComputedColor(internalComputedColor);
        }
    }, [internalComputedColor, setComputedColor, externalComputedColor]);

    const { handleDragHandleMouseDown } = usePaletteDrag(position, setPosition);

    useEffect(() => {
        if (!position) {
            setPosition({
                x: window.innerWidth * 0.18,
                y: window.innerHeight * 0.64 - 100,
            });
        }
    }, [position]);

    useEffect(() => {
        if (isFullscreen) {
            setPosition({
                x: window.innerWidth * 0.05,
                y: window.innerHeight * 0.55 - 100,
            });
        }
    }, [isFullscreen]);

    const handleSaveProfile = () => {
        const saved = [svgHueRotation, svgSaturation, svgSepia, svgInvert, colorHue, colorSaturation, colorLightness].join(",");
        setProfile(saved);
    };

    const handleLoadProfile = () => {
        const parts = profile.split(",").map((v) => parseFloat(v));
        if (parts.length !== 7 || parts.some((p) => isNaN(p))) {
            alert("Invalid profile string! Expecting 7 numeric values separated by commas.");
            return;
        }
        const [sh, ss, sp, si, ch, cs, cl] = parts;
        setSvgHueRotation(sh);
        setSvgSaturation(ss);
        setSvgSepia(sp);
        setSvgInvert(si);
        setColorHue(ch);
        setColorSaturation(cs);
        setColorLightness(cl);
    };

    const [showSliders, setShowSliders] = useState(false);

    return (
        <div
            ref={paletteRef}
            className="fixed z-[100] rounded-lg overflow-hidden flex flex-col SkryrPalette"
            style={{
                color: computedColor,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderRadius: "10px",
                left: position ? `${position.x}px` : `${window.innerWidth * 0.05}px`,
                top: position ? `${position.y}px` : "auto",
                bottom: position ? "auto" : "0%",
                width: "max-content",
                height: "fit-content",
                display: showPalette ? "flex" : "none",
            }}
        >
            <style>{`
                .SkryrPalette * {
                    color: inherit !important;
                    border-color: currentColor !important;
                    fill: currentColor !important;
                    stroke: currentColor !important;
                }
            `}</style>

            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    background: `url(https://eaccelerate.me/tetsuo/skryr.svg) no-repeat center / cover`,
                    filter: svgFilter,
                    mixBlendMode: "screen",
                    zIndex: 1,
                }}
            />

            <div
                className="relative flex items-center w-full"
                onMouseDown={handleDragHandleMouseDown}
                style={{
                    zIndex: 2,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    borderRadius: "10px 10px 0 0",
                    cursor: "grab",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                }}
            >
                <span className="text-sm font-bold" style={{ marginRight: "8px" }}>
                    ☰ SKRYR
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSliders((prev) => !prev);
                        }}
                        style={{ border: "none", borderRadius: 4, padding: "0 6px", cursor: "pointer" }}
                    >
                        {showSliders ? "–" : "+"}
                    </button>

                    {showSliders && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[svgHueRotation]}
                                onValueChange={(value: number[]) => setSvgHueRotation(value[0])}
                            />
                            <Slider
                                min={0}
                                max={10}
                                step={0.1}
                                value={[svgSaturation]}
                                onValueChange={(value: number[]) => setSvgSaturation(value[0])}
                            />
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={[svgSepia]}
                                onValueChange={(value: number[]) => setSvgSepia(value[0])}
                            />
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={[svgInvert]}
                                onValueChange={(value: number[]) => setSvgInvert(value[0])}
                            />
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[colorHue]}
                                onValueChange={(value: number[]) => setColorHue(value[0])}
                            />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[colorSaturation]}
                                onValueChange={(value: number[]) => setColorSaturation(value[0])}
                            />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[colorLightness]}
                                onValueChange={(value: number[]) => setColorLightness(value[0])}
                            />
                            <input
                                type="text"
                                value={profile}
                                onChange={(e) => setProfile(e.target.value)}
                                placeholder="Profile"
                                className="text-xs px-1 py-0.5 rounded border border-gray-300"
                                style={{ backgroundColor: "transparent", color: "inherit", borderColor: "currentColor" }}
                            />
                            <button
                                onClick={handleSaveProfile}
                                className="px-1 py-0.5 text-xs rounded"
                                style={{ backgroundColor: computedColor, color: "#fff" }}
                            >
                                💾
                            </button>
                            <button
                                onClick={handleLoadProfile}
                                className="px-1 py-0.5 text-xs rounded"
                                style={{ backgroundColor: computedColor, color: "#fff" }}
                            >
                                🔄
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 w-full" style={{ padding: "8px" }}>
                {children}
            </div>
        </div>
    );
};

export default SkryrPalette;