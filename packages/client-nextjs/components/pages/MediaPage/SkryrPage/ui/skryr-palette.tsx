"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Slider from "@/components/ui/slider";
import { useSkryrColor } from "./skryr-color-context";

type MixBlendMode =
    | "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" |
    "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";

interface SkryrPaletteProps {
    lastInteractionWasDoubleClick?: boolean;
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
    showAudioPanel?: boolean;
    setShowAudioPanel?: (value: boolean) => void;
    renderAudioControls?: () => JSX.Element;
}

const usePaletteDrag = (
    initialPosition: { x: number; y: number } | null,
    setPosition: (pos: { x: number; y: number }) => void,
    paletteRef: React.RefObject<HTMLDivElement>
) => {
    const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        console.log("Drag started");
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initPos = initialPosition ? { ...initialPosition } : { x: 0, y: 0 };
        const palette = paletteRef.current;
        if (!palette) return;

        const paletteWidth = palette.offsetWidth;
        const paletteHeight = palette.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const onMouseMove = (ev: MouseEvent) => {
            const deltaX = ev.clientX - startX;
            const deltaY = ev.clientY - startY;
            const newX = Math.max(-(paletteWidth / 2), Math.min(initPos.x + deltaX, viewportWidth - (paletteWidth / 2)));
            const newY = Math.max(0, Math.min(initPos.y + deltaY, viewportHeight - paletteHeight));
            console.log(`Dragging to: x=${newX}, y=${newY}`);
            setPosition({ x: newX, y: newY });
        };

        const onMouseUp = () => {
            console.log("Drag ended");
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    return { handleDragHandleMouseDown };
};

const SkryrPalette: React.FC<SkryrPaletteProps> = ({
    lastInteractionWasDoubleClick,
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

    const { computedColor: contextColor } = useSkryrColor();
    const internalComputedColor = `hsl(${colorHue}, ${colorSaturation}%, ${colorLightness}%)`;
    const computedColor = externalComputedColor || contextColor || internalComputedColor;

    useEffect(() => {
        if (setComputedColor && internalComputedColor !== externalComputedColor) {
            setComputedColor(internalComputedColor);
        }
    }, [internalComputedColor, setComputedColor, externalComputedColor]);

    const { handleDragHandleMouseDown } = usePaletteDrag(position, setPosition, paletteRef);

    useEffect(() => {
        if (!position) {
            setPosition({
                x: 0, // Centered offset
                y: window.innerHeight - 444,
            });
        }
    }, [position]);

    useEffect(() => {
        if (isFullscreen) {
            setPosition({
                x: 0,
                y: window.innerHeight - 444,
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
                        className="w-5 h-5 text-xs bg-transparent hover:bg-gray-900 disabled:opacity-50"
                        title="Move Up"
                    >
                        <i className="fa-solid fa.arrow-up" />
                    </Button>
                    <Button
                        onClick={(e) => { e.stopPropagation(); moveLayerDown(layer); }}
                        disabled={layerOrder.indexOf(layer) === layerOrder.length - 1}
                        className="w-5 h-5 text-xs bg-transparent hover:bg-gray-900 disabled:opacity-50"
                        title="Move Down"
                    >
                        <i className="fa-solid fa-arrow-down" />
                    </Button>
                </div>
            </div>
            {expandedLayers[layer] && (
                <div className="flex flex-col gap-0.5">
                    {blendMode && setBlendMode && (
                        <select
                            value={blendMode}
                            onChange={(e) => setBlendMode(e.target.value as MixBlendMode)}
                            className="w-full p-1 text-xs bg-transparent rounded"
                        >
                            {blendModeOptions.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-eye-slash text-xs" />
                        <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={[opacity]}
                            onValueChange={(v) => setOpacity(v[0])}
                            className="w-full h-2"
                            style={{ accentColor: computedColor }}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-sun text-xs" />
                        <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            value={[gamma]}
                            onValueChange={(v) => setGamma(v[0])}
                            className="w-full h-2"
                            style={{ accentColor: computedColor }}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-droplet text-xs" />
                        <Slider
                            min={0}
                            max={2}
                            step={0.01}
                            value={[saturation]}
                            onValueChange={(v) => setSaturation(v[0])}
                            className="w-full h-2"
                            style={{ accentColor: computedColor }}
                        />
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
                                    className="w-full p-1 text-xs bg-transparent rounded"
                                />
                            </div>
                            {backgroundMedia && (
                                <>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-arrows-left-right text-xs" />
                                        <Slider
                                            min={-500}
                                            max={500}
                                            step={1}
                                            value={[backgroundX]}
                                            onValueChange={(v) => setBackgroundX(v[0])}
                                            className="w-full h-2"
                                            style={{ accentColor: computedColor }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-arrows-up-down text-xs" />
                                        <Slider
                                            min={-500}
                                            max={500}
                                            step={1}
                                            value={[backgroundY]}
                                            onValueChange={(v) => setBackgroundY(v[0])}
                                            className="w-full h-2"
                                            style={{ accentColor: computedColor }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-expand text-xs" />
                                        <Slider
                                            min={0.1}
                                            max={10}
                                            step={0.1}
                                            value={[backgroundScale]}
                                            onValueChange={(v) => setBackgroundScale(v[0])}
                                            className="w-full h-2"
                                            style={{ accentColor: computedColor }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <i className="fa-solid fa-rotate text-xs" />
                                        <Slider
                                            min={0}
                                            max={360}
                                            step={1}
                                            value={[backgroundRotation]}
                                            onValueChange={(v) => setBackgroundRotation(v[0])}
                                            className="w-full h-2"
                                            style={{ accentColor: computedColor }}
                                        />
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
        <div style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "4px" }}>
            <h2 className="text-md font-bold mb-1">Layer & Effects</h2>
            <div className="flex flex-col gap-1">
                {/* <Button
                    onClick={() => setBackgroundEnabled((prev) => !prev)}
                    className={`w-full h-7 text-xs bg-transparent hover:bg-gray-900 ${backgroundEnabled ? "text-current" : "text-gray-500"}`}
                    title="Toggle Visualizer (F9)"
                >
                    <i className="fa-solid fa-music mr-1" /> Visualizer
                </Button>
                <Button
                    onClick={() => setMatrixEnabled((prev) => !prev)}
                    className={`w-full h-7 text-xs bg-transparent hover:bg-gray-900 ${matrixEnabled ? "text-current" : "text-gray-500"}`}
                    title="Toggle Matrix Mode (F8)"
                >
                    <i className="fa-solid fa-globe mr-1" /> Matrix
                </Button>
                <Button
                    onClick={() => setAsciiEnabled((prev) => !prev)}
                    className={`w-full h-7 text-xs bg-transparent hover:bg-gray-900 ${asciiEnabled ? "text-current" : "text-gray-500"}`}
                    title="Toggle ASCII Mode (F7)"
                >
                    <i className="fa-solid fa-theater-masks mr-1" /> ASCII
                </Button> */}
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

    const showMediaOptions = !!selectedElement;

    return (
        <div
            ref={paletteRef}
            className="fixed z-[10010] rounded-lg overflow-hidden flex flex-row gap-2 SkryrPalette"
            style={{
                color: computedColor,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderRadius: "8px",
                left: "50%",
                transform: `translateX(${position ? position.x : 0}px) translateX(-50%)`,
                top: position ? `${position.y}px` : `${window.innerHeight - 444}px`,
                width: showPalette ? "fit-content" : "0px",
                height: "400px",
                minHeight: "400px",
                display: "flex",
                pointerEvents: "auto",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                transition: "width 0.3s ease-in-out",
            }}
        >
            <style>{`
                .SkryrPalette * {
                    color: inherit !important;
                    border-color: currentColor !important;
                    fill: currentColor !important;
                    stroke: currentColor !important;
                }
                .animate-panel {
                    animation: rollOut 0.3s ease-in-out forwards;
                }
                .panel-closed {
                    animation: retract 0.3s ease-in-out forwards;
                }
                @keyframes rollOut {
                    from { width: 0; opacity: 0; }
                    to { width: auto; opacity: 1; }
                }
                @keyframes retract {
                    from { width: auto; opacity: 1; }
                    to { width: 0; opacity: 0; }
                }
            `}</style>

            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    background: `url(https://eaccelerate.me/tetsuo/skryr.svg) no-repeat center / cover`,
                    filter: `invert(${svgInvert}) sepia(${svgSepia}) saturate(${svgSaturation}) hue-rotate(${svgHueRotation}deg)`,
                    mixBlendMode: "screen",
                    zIndex: 1,
                }}
            />

            {/* Drag Handle */}
            <div
                className="absolute w-full flex justify-center items-center"
                onMouseDown={handleDragHandleMouseDown}
                style={{
                    zIndex: 3,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    borderRadius: "8px 8px 0 0",
                    cursor: "grab",
                    padding: "2px 4px",
                    height: "32px",
                    top: 0,
                    pointerEvents: "auto",
                }}
            >
                <span className="text-sm font-bold">
                    ☰ SKRYR
                </span>
                <div style={{ position: "absolute", right: "4px", display: "flex", alignItems: "center", gap: "4px", pointerEvents: "auto" }}>
                    FPS: {fps}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSliders((prev) => !prev); }}
                        className="bg-transparent hover:bg-gray-900 rounded px-1 py-0.5 text-sm"
                    >
                        {showSliders ? "–" : "+"}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative flex flex-row w-full" style={{ zIndex: 2, paddingTop: "32px", flexGrow: 1 }}>
                {/* Children (Middle Section, e.g., SkryrToolbar) */}
                {children && (
                    <div className="flex flex-col items-stretch justify-between h-full">
                        {children}
                    </div>
                )}

                {/* Effects & Layers Panel */}
                <div
                    className={`transition-all duration-300 ease-in-out p-2 bg-black/80 rounded-lg shadow-lg animate-panel ${showLayerPanel ? "panel-open" : "panel-closed"
                        }`}
                    style={{
                        width: showLayerPanel ? "244px" : "0px",
                        height: "auto",
                        opacity: showLayerPanel ? 1 : 0,
                        visibility: showLayerPanel ? "visible" : "hidden",
                        overflowY: "hidden",
                    }}
                >
                    {showLayerPanel && renderLayerContent()}
                </div>

                {/* Media Options Panel */}
                <div
                    className={`transition-all duration-300 ease-in-out p-2 bg-black/80 rounded-lg shadow-lg animate-panel ${showMediaOptions ? "panel-open" : "panel-closed"
                        }`}
                    style={{
                        width: showMediaOptions ? "300px" : "0px",
                        height: "auto",
                        opacity: showMediaOptions ? 1 : 0,
                        visibility: showMediaOptions ? "visible" : "hidden",
                        overflowY: "hidden",
                    }}
                >
                    {showMediaOptions && renderOptionsContent && renderOptionsContent()}
                </div>

                {/* Sliders Panel */}
                <div
                    className={`transition-all duration-300 ease-in-out p-2 bg-black/80 rounded-lg shadow-lg animate-panel ${showSliders ? "panel-open" : "panel-closed"
                        }`}
                    style={{
                        width: showSliders ? "220px" : "0px",
                        height: "auto",
                        opacity: showSliders ? 1 : 0,
                        visibility: showSliders ? "visible" : "hidden",
                        overflowY: "hidden",
                    }}
                >
                    {showSliders && (
                        <div className="flex flex-col gap-0.5">
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[svgHueRotation]}
                                onValueChange={(v) => setSvgHueRotation(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <Slider
                                min={0}
                                max={10}
                                step={0.1}
                                value={[svgSaturation]}
                                onValueChange={(v) => setSvgSaturation(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={[svgSepia]}
                                onValueChange={(v) => setSvgSepia(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={[svgInvert]}
                                onValueChange={(v) => setSvgInvert(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[colorHue]}
                                onValueChange={(v) => setColorHue(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[colorSaturation]}
                                onValueChange={(v) => setColorSaturation(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[colorLightness]}
                                onValueChange={(v) => setColorLightness(v[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={profile}
                                    onChange={(e) => setProfile(e.target.value)}
                                    placeholder="Profile"
                                    className="text-xs px-1 py-0.5 rounded bg-transparent flex-1"
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkryrPalette;