"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Slider from "@/components/ui/slider";

type MixBlendMode =
    | "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" |
    "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";

interface SkryrPaletteProps {
    isFullscreen: boolean;
    handleToggleFullscreen: (e?: React.MouseEvent<HTMLDivElement>) => void;
    showPalette: boolean;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    children?: React.ReactNode;
    computedColor?: string;
    setComputedColor?: React.Dispatch<React.SetStateAction<string>>;
    selectedElement?: { type: "media" | "customText"; index: number; fileName?: string } | null;
    selectedLayer?: "milkdrop" | "matrix" | "ascii" | "allMedia" | "background" | null;
    renderOptionsContent?: () => JSX.Element | null;
    onDeselectElement?: () => void;
    showLayerPanel: boolean;
    setShowLayerPanel: React.Dispatch<React.SetStateAction<boolean>>;
    milkdropOpacity: number;
    setMilkdropOpacity: React.Dispatch<React.SetStateAction<number>>;
    matrixMixBlendMode: MixBlendMode;
    setMatrixMixBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    asciiMixBlendMode: MixBlendMode;
    setAsciiMixBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    allMediaMixBlendMode: MixBlendMode;
    setAllMediaMixBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    backgroundMixBlendMode: MixBlendMode;
    setBackgroundMixBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    matrixOpacity: number;
    setMatrixOpacity: React.Dispatch<React.SetStateAction<number>>;
    asciiOpacity: number;
    setAsciiOpacity: React.Dispatch<React.SetStateAction<number>>;
    allMediaOpacity: number;
    setAllMediaOpacity: React.Dispatch<React.SetStateAction<number>>;
    backgroundOpacity: number;
    setBackgroundOpacity: React.Dispatch<React.SetStateAction<number>>;
    milkdropGamma: number;
    setMilkdropGamma: React.Dispatch<React.SetStateAction<number>>;
    matrixGamma: number;
    setMatrixGamma: React.Dispatch<React.SetStateAction<number>>;
    asciiGamma: number;
    setAsciiGamma: React.Dispatch<React.SetStateAction<number>>;
    allMediaGamma: number;
    setAllMediaGamma: React.Dispatch<React.SetStateAction<number>>;
    backgroundGamma: number;
    setBackgroundGamma: React.Dispatch<React.SetStateAction<number>>;
    milkdropSaturation: number;
    setMilkdropSaturation: React.Dispatch<React.SetStateAction<number>>;
    matrixSaturation: number;
    setMatrixSaturation: React.Dispatch<React.SetStateAction<number>>;
    asciiSaturation: number;
    setAsciiSaturation: React.Dispatch<React.SetStateAction<number>>;
    allMediaSaturation: number;
    setAllMediaSaturation: React.Dispatch<React.SetStateAction<number>>;
    backgroundSaturation: number;
    setBackgroundSaturation: React.Dispatch<React.SetStateAction<number>>;
    layerOrder: string[];
    setLayerOrder: React.Dispatch<React.SetStateAction<string[]>>;
    matrixEnabled: boolean;
    setMatrixEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    asciiEnabled: boolean;
    setAsciiEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundColor: string;
    setBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
    backgroundMedia: string | null;
    setBackgroundMedia: React.Dispatch<React.SetStateAction<string | null>>;
    backgroundScale: number;
    setBackgroundScale: React.Dispatch<React.SetStateAction<number>>;
    backgroundRotation: number;
    setBackgroundRotation: React.Dispatch<React.SetStateAction<number>>;
    backgroundX: number;
    setBackgroundX: React.Dispatch<React.SetStateAction<number>>;
    backgroundY: number;
    setBackgroundY: React.Dispatch<React.SetStateAction<number>>;
    backgroundLoop: boolean;
    setBackgroundLoop: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundAutoplay: boolean;
    setBackgroundAutoplay: React.Dispatch<React.SetStateAction<boolean>>;
    fps: number;
    audioData: Uint8Array;
}

const usePaletteDrag = (initialPosition: { x: number; y: number } | null, setPosition: (pos: { x: number; y: number }) => void) => {
    const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
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
    computedColor: externalComputedColor,
    setComputedColor,
    selectedElement,
    selectedLayer,
    renderOptionsContent,
    onDeselectElement,
    showLayerPanel,
    setShowLayerPanel,
    milkdropOpacity,
    setMilkdropOpacity,
    matrixMixBlendMode,
    setMatrixMixBlendMode,
    asciiMixBlendMode,
    setAsciiMixBlendMode,
    allMediaMixBlendMode,
    setAllMediaMixBlendMode,
    backgroundMixBlendMode,
    setBackgroundMixBlendMode,
    matrixOpacity,
    setMatrixOpacity,
    asciiOpacity,
    setAsciiOpacity,
    allMediaOpacity,
    setAllMediaOpacity,
    backgroundOpacity,
    setBackgroundOpacity,
    milkdropGamma,
    setMilkdropGamma,
    matrixGamma,
    setMatrixGamma,
    asciiGamma,
    setAsciiGamma,
    allMediaGamma,
    setAllMediaGamma,
    backgroundGamma,
    setBackgroundGamma,
    milkdropSaturation,
    setMilkdropSaturation,
    matrixSaturation,
    setMatrixSaturation,
    asciiSaturation,
    setAsciiSaturation,
    allMediaSaturation,
    setAllMediaSaturation,
    backgroundSaturation,
    setBackgroundSaturation,
    layerOrder,
    setLayerOrder,
    matrixEnabled,
    setMatrixEnabled,
    asciiEnabled,
    setAsciiEnabled,
    backgroundColor,
    setBackgroundColor,
    backgroundMedia,
    setBackgroundMedia,
    backgroundScale,
    setBackgroundScale,
    backgroundRotation,
    setBackgroundRotation,
    backgroundX,
    setBackgroundX,
    backgroundY,
    setBackgroundY,
    backgroundLoop,
    setBackgroundLoop,
    backgroundAutoplay,
    setBackgroundAutoplay,
    fps,
    audioData,
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
    const [showSliders, setShowSliders] = useState(false);
    const [expandedLayers, setExpandedLayers] = useState<{ [key: string]: boolean }>({
        background: false,
        milkdrop: false,
        matrix: false,
        ascii: false,
        allMedia: false,
    });

    const svgFilter = `invert(${svgInvert}) sepia(${svgSepia}) saturate(${svgSaturation}) hue-rotate(${svgHueRotation}deg)`;
    const internalComputedColor = `hsl(${colorHue}, ${colorSaturation}%, ${colorLightness}%)`;
    const computedColor = externalComputedColor || internalComputedColor;

    useEffect(() => {
        if (setComputedColor && internalComputedColor !== externalComputedColor) {
            setComputedColor(internalComputedColor);
        }
    }, [internalComputedColor, setComputedColor, externalComputedColor]);

    const { handleDragHandleMouseDown } = usePaletteDrag(position, setPosition);

    useEffect(() => {
        if (!position) {
            setPosition({
                x: window.innerWidth * 0.05,
                y: window.innerHeight * 0.55 - 100,
            });
        }
    }, [isFullscreen]);

    const handleSaveProfile = useCallback(() => {
        const saved = [svgHueRotation, svgSaturation, svgSepia, svgInvert, colorHue, colorSaturation, colorLightness].join(",");
        setProfile(saved);
    }, [svgHueRotation, svgSaturation, svgSepia, svgInvert, colorHue, colorSaturation, colorLightness]);

    const handleLoadProfile = useCallback(() => {
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
    }, [profile]);

    const toggleLayer = useCallback((layer: string) => {
        setExpandedLayers((prev) => ({
            ...prev,
            [layer]: !prev[layer],
        }));
    }, []);

    const blendModeOptions = useMemo(() => [
        "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn",
        "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity",
    ], []);

    const moveLayerUp = useCallback((layer: string) => {
        setLayerOrder((prev) => {
            const index = prev.indexOf(layer);
            if (index > 0) {
                const newOrder = [...prev];
                [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                return newOrder;
            }
            return prev;
        });
    }, [setLayerOrder]);

    const moveLayerDown = useCallback((layer: string) => {
        setLayerOrder((prev) => {
            const index = prev.indexOf(layer);
            if (index < prev.length - 1) {
                const newOrder = [...prev];
                [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                return newOrder;
            }
            return prev;
        });
    }, [setLayerOrder]);

    const LayerControls = React.memo(({
        layer,
        blendMode,
        setBlendMode,
        opacity,
        setOpacity,
        gamma,
        setGamma,
        saturation,
        setSaturation,
    }: {
        layer: string;
        blendMode?: MixBlendMode;
        setBlendMode?: React.Dispatch<React.SetStateAction<MixBlendMode>>;
        opacity: number;
        setOpacity: React.Dispatch<React.SetStateAction<number>>;
        gamma: number;
        setGamma: React.Dispatch<React.SetStateAction<number>>;
        saturation: number;
        setSaturation: React.Dispatch<React.SetStateAction<number>>;
    }) => (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleLayer(layer)}>
                <span className="text-sm">{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                <div className="flex gap-1">
                    <Button
                        onClick={(e) => { e.stopPropagation(); moveLayerUp(layer); }}
                        disabled={layerOrder.indexOf(layer) === 0}
                        className="w-5 h-5 text-xs border border-current text-gray-500 hover:bg-gray-700 disabled:opacity-50"
                        title="Move Up"
                    >
                        <i className="fa-solid fa-arrow-up" />
                    </Button>
                    <Button
                        onClick={(e) => { e.stopPropagation(); moveLayerDown(layer); }}
                        disabled={layerOrder.indexOf(layer) === layerOrder.length - 1}
                        className="w-5 h-5 text-xs border border-current text-gray-500 hover:bg-gray-700 disabled:opacity-50"
                        title="Move Down"
                    >
                        <i className="fa-solid fa-arrow-down" />
                    </Button>
                </div>
            </div>
            {expandedLayers[layer] && (
                <div className="flex flex-col gap-1">
                    {blendMode && setBlendMode && (
                        <select
                            value={blendMode}
                            onChange={(e) => setBlendMode(e.target.value as MixBlendMode)}
                            className="w-full p-1 text-xs bg-gray-800 text-white border border-gray-600 rounded"
                        >
                            {blendModeOptions.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-eye-slash text-xs" />
                        <Slider min={0} max={1} step={0.01} value={[opacity]} onValueChange={(v) => setOpacity(v[0])} className="w-full h-3" />
                    </div>
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-sun text-xs" />
                        <Slider min={0} max={2} step={0.01} value={[gamma]} onValueChange={(v) => setGamma(v[0])} className="w-full h-3" />
                    </div>
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-droplet text-xs" />
                        <Slider min={0} max={2} step={0.01} value={[saturation]} onValueChange={(v) => setSaturation(v[0])} className="w-full h-3" />
                    </div>
                    {layer === "background" && (
                        <>
                            <div className="flex items-center gap-2">
                                <label className="text-xs">Color:</label>
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="w-12 h-6"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs">Media URL:</label>
                                <input
                                    type="text"
                                    value={backgroundMedia || ""}
                                    onChange={(e) => setBackgroundMedia(e.target.value || null)}
                                    placeholder="Enter video URL"
                                    className="w-full p-1 text-xs border"
                                />
                            </div>
                            {backgroundMedia && (
                                <>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-arrows-left-right text-xs" />
                                        <Slider min={-500} max={500} step={1} value={[backgroundX]} onValueChange={(v) => setBackgroundX(v[0])} className="w-full h-3" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-arrows-up-down text-xs" />
                                        <Slider min={-500} max={500} step={1} value={[backgroundY]} onValueChange={(v) => setBackgroundY(v[0])} className="w-full h-3" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-expand text-xs" />
                                        <Slider min={0.1} max={10} step={0.1} value={[backgroundScale]} onValueChange={(v) => setBackgroundScale(v[0])} className="w-full h-3" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-rotate text-xs" />
                                        <Slider min={0} max={360} step={1} value={[backgroundRotation]} onValueChange={(v) => setBackgroundRotation(v[0])} className="w-full h-3" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs">Loop:</label>
                                        <input
                                            type="checkbox"
                                            checked={backgroundLoop}
                                            onChange={(e) => setBackgroundLoop(e.target.checked)}
                                        />
                                        <label className="text-xs">Autoplay:</label>
                                        <input
                                            type="checkbox"
                                            checked={backgroundAutoplay}
                                            onChange={(e) => setBackgroundAutoplay(e.target.checked)}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    ), (prevProps, nextProps) =>
        prevProps.layer === nextProps.layer &&
        prevProps.blendMode === nextProps.blendMode &&
        prevProps.opacity === nextProps.opacity &&
        prevProps.gamma === nextProps.gamma &&
        prevProps.saturation === nextProps.saturation);

    const renderLayerContent = useCallback(() => (
        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "6px", minWidth: "280px" }}>
            <h2 className="text-md font-bold text-white mb-1">Layer & Effects</h2>
            <div className="flex flex-col gap-1">
                <Button onClick={() => setBackgroundEnabled((prev) => !prev)} className={`w-full h-7 text-xs ${backgroundEnabled ? "border border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`} title="Toggle Visualizer (F9)">
                    <i className="fa-solid fa-music mr-1" /> Visualizer
                </Button>
                <Button onClick={() => setMatrixEnabled((prev) => !prev)} className={`w-full h-7 text-xs ${matrixEnabled ? "border border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`} title="Toggle Matrix Mode (F8)">
                    <i className="fa-solid fa-globe mr-1" /> Matrix
                </Button>
                <Button onClick={() => setAsciiEnabled((prev) => !prev)} className={`w-full h-7 text-xs ${asciiEnabled ? "border border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`} title="Toggle ASCII Mode (F7)">
                    <i className="fa-solid fa-theater-masks mr-1" /> ASCII
                </Button>
                {layerOrder.map((layer) => (
                    <LayerControls
                        key={layer}
                        layer={layer}
                        blendMode={
                            layer === "background" ? backgroundMixBlendMode :
                                layer === "matrix" ? matrixMixBlendMode :
                                    layer === "ascii" ? asciiMixBlendMode :
                                        layer === "allMedia" ? allMediaMixBlendMode :
                                            undefined
                        }
                        setBlendMode={
                            layer === "background" ? setBackgroundMixBlendMode :
                                layer === "matrix" ? setMatrixMixBlendMode :
                                    layer === "ascii" ? setAsciiMixBlendMode :
                                        layer === "allMedia" ? setAllMediaMixBlendMode :
                                            undefined
                        }
                        opacity={
                            layer === "background" ? backgroundOpacity :
                                layer === "milkdrop" ? milkdropOpacity :
                                    layer === "matrix" ? matrixOpacity :
                                        layer === "ascii" ? asciiOpacity :
                                            allMediaOpacity
                        }
                        setOpacity={
                            layer === "background" ? setBackgroundOpacity :
                                layer === "milkdrop" ? setMilkdropOpacity :
                                    layer === "matrix" ? setMatrixOpacity :
                                        layer === "ascii" ? setAsciiOpacity :
                                            setAllMediaOpacity
                        }
                        gamma={
                            layer === "background" ? backgroundGamma :
                                layer === "milkdrop" ? milkdropGamma :
                                    layer === "matrix" ? matrixGamma :
                                        layer === "ascii" ? asciiGamma :
                                            allMediaGamma
                        }
                        setGamma={
                            layer === "background" ? setBackgroundGamma :
                                layer === "milkdrop" ? setMilkdropGamma :
                                    layer === "matrix" ? setMatrixGamma :
                                        layer === "ascii" ? setAsciiGamma :
                                            setAllMediaGamma
                        }
                        saturation={
                            layer === "background" ? backgroundSaturation :
                                layer === "milkdrop" ? milkdropSaturation :
                                    layer === "matrix" ? matrixSaturation :
                                        layer === "ascii" ? asciiSaturation :
                                            allMediaSaturation
                        }
                        setSaturation={
                            layer === "background" ? setBackgroundSaturation :
                                layer === "milkdrop" ? setMilkdropSaturation :
                                    layer === "matrix" ? setMatrixSaturation :
                                        layer === "ascii" ? setAsciiSaturation :
                                            setAllMediaSaturation
                        }
                    />
                ))}
            </div>
        </div>
    ), [
        backgroundEnabled, setBackgroundEnabled, matrixEnabled, setMatrixEnabled, asciiEnabled, setAsciiEnabled,
        matrixMixBlendMode, setMatrixMixBlendMode, asciiMixBlendMode, setAsciiMixBlendMode,
        allMediaMixBlendMode, setAllMediaMixBlendMode, backgroundMixBlendMode, setBackgroundMixBlendMode,
        milkdropOpacity, setMilkdropOpacity, matrixOpacity, setMatrixOpacity,
        asciiOpacity, setAsciiOpacity, allMediaOpacity, setAllMediaOpacity, backgroundOpacity, setBackgroundOpacity,
        milkdropGamma, setMilkdropGamma, matrixGamma, setMatrixGamma, asciiGamma, setAsciiGamma,
        allMediaGamma, setAllMediaGamma, backgroundGamma, setBackgroundGamma,
        milkdropSaturation, setMilkdropSaturation, matrixSaturation, setMatrixSaturation,
        asciiSaturation, setAsciiSaturation, allMediaSaturation, setAllMediaSaturation,
        backgroundSaturation, setBackgroundSaturation, layerOrder, setLayerOrder, expandedLayers,
        backgroundColor, setBackgroundColor, backgroundMedia, setBackgroundMedia,
        backgroundScale, setBackgroundScale, backgroundRotation, setBackgroundRotation,
        backgroundX, setBackgroundX, backgroundY, setBackgroundY,
        backgroundLoop, setBackgroundLoop, backgroundAutoplay, setBackgroundAutoplay,
    ]);

    return (
        <div
            ref={paletteRef}
            className="fixed z-[10010] rounded-lg overflow-hidden flex flex-col SkryrPalette"
            style={{
                color: computedColor,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderRadius: "8px",
                left: position ? `${position.x}px` : `${window.innerWidth * 0.05}px`,
                top: position ? `${position.y}px` : "auto",
                bottom: position ? "auto" : "0%",
                width: "max-content",
                height: "fit-content",
                display: showPalette ? "flex" : "none",
                pointerEvents: "auto",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            }}
        >
            <style>{`
                .SkryrPalette * {
                    color: inherit !important;
                    border-color: currentColor !important;
                    fill: currentColor !important;
                    stroke: currentColor !important;
                }
                .panel {
                    transition: max-height 0.3s ease, opacity 0.3s ease;
                    overflow: hidden;
                }
                .panel-closed {
                    max-height: 0;
                    opacity: 0;
                }
                .panel-open {
                    max-height: 600px;
                    opacity: 1;
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
                    borderRadius: "8px 8px 0px 0px",
                    cursor: "grab",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                }}
            >
                <span className="text-sm font-bold" style={{ marginRight: "8px" }}>
                    ☰ SKRYR
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", pointerEvents: "auto" }}>
                    FPS: {fps}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", pointerEvents: "auto" }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSliders((prev) => !prev); }}
                        style={{ border: "none", borderRadius: "4px", padding: "0px 6px", cursor: "pointer", fontSize: "14px" }}
                    >
                        {showSliders ? "–" : "+"}
                    </button>
                </div>
            </div>

            <div
                className={`relative z-10 w-full flex flex-row panel ${showSliders || renderOptionsContent || showLayerPanel ? "panel-open" : "panel-closed"}`}
                style={{ padding: "6px", pointerEvents: "auto" }}
            >
                <div>{children}</div>
                <div className="flex flex-row gap-2">
                    {showSliders && (
                        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "6px", minWidth: "200px" }}>
                            <div className="flex flex-col gap-1">
                                <Slider min={0} max={360} step={1} value={[svgHueRotation]} onValueChange={(v) => setSvgHueRotation(v[0])} className="w-full h-4" />
                                <Slider min={0} max={10} step={0.1} value={[svgSaturation]} onValueChange={(v) => setSvgSaturation(v[0])} className="w-full h-4" />
                                <Slider min={0} max={1} step={0.05} value={[svgSepia]} onValueChange={(v) => setSvgSepia(v[0])} className="w-full h-4" />
                                <Slider min={0} max={1} step={0.05} value={[svgInvert]} onValueChange={(v) => setSvgInvert(v[0])} className="w-full h-4" />
                                <Slider min={0} max={360} step={1} value={[colorHue]} onValueChange={(v) => setColorHue(v[0])} className="w-full h-4" />
                                <Slider min={0} max={100} step={1} value={[colorSaturation]} onValueChange={(v) => setColorSaturation(v[0])} className="w-full h-4" />
                                <Slider min={0} max={100} step={1} value={[colorLightness]} onValueChange={(v) => setColorLightness(v[0])} className="w-full h-4" />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="text"
                                        value={profile}
                                        onChange={(e) => setProfile(e.target.value)}
                                        placeholder="Profile"
                                        className="text-xs px-1 py-0.5 rounded border border-gray-300 flex-1"
                                        style={{ backgroundColor: "transparent", color: "inherit", borderColor: "currentColor" }}
                                    />
                                    <button onClick={handleSaveProfile} className="px-1 py-0.5 text-xs rounded" style={{ backgroundColor: computedColor, color: "#fff" }}>💾</button>
                                    <button onClick={handleLoadProfile} className="px-1 py-0.5 text-xs rounded" style={{ backgroundColor: computedColor, color: "#fff" }}>🔄</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {renderOptionsContent && (
                        <div style={{ minWidth: "200px", backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "6px" }}>
                            {renderOptionsContent()}
                        </div>
                    )}
                    {showLayerPanel && renderLayerContent()}
                </div>
            </div>
        </div>
    );
};

export default SkryrPalette;