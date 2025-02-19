import React, { useEffect, useRef, useState } from "react";
interface SkryrPaletteProps {
    isFullscreen: boolean;
    handleToggleFullscreen: (e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    showPalette: boolean;
    setShowPalette: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    embeddedMode: boolean;
    setEmbeddedMode: React.Dispatch<React.SetStateAction<boolean>>;
    children?: React.ReactNode;
}


const SkryrPalette: React.FC<SkryrPaletteProps> = ({
    isFullscreen,
    handleToggleFullscreen,
    showPalette,
    setShowPalette,
    backgroundEnabled,
    setBackgroundEnabled,
    embeddedMode,
    setEmbeddedMode,
    children,
}) => {
    const paletteRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    /*
     |--------------------------------------------------------------------------
     | 1) SVG FILTER STATE
     |--------------------------------------------------------------------------
     | Controls how the background SVG is filtered.
     */
    const [svgHueRotation, setSvgHueRotation] = useState(0); // range 0..360
    const [svgSaturation, setSvgSaturation] = useState(5);   // range 0..10
    const [svgSepia, setSvgSepia] = useState(1);             // range 0..1
    const [svgInvert, setSvgInvert] = useState(1);           // range 0..1

    /*
     |--------------------------------------------------------------------------
     | 2) COMPUTED COLOR STATE (HSL)
     |--------------------------------------------------------------------------
     | Used for text, borders, etc. of the palette.
     */
    const [colorHue, setColorHue] = useState(55);                // 0..360
    const [colorSaturation, setColorSaturation] = useState(100); // 0..100
    const [colorLightness, setColorLightness] = useState(50);    // 0..100

    /*
     |--------------------------------------------------------------------------
     | 3) PROFILE STRING
     |--------------------------------------------------------------------------
     | Store all 7 slider values in a single string:
     |   [svgHue, svgSat, svgSepia, svgInvert, colorHue, colorSat, colorLight]
     */
    const [profile, setProfile] = useState("");

    /*
     |--------------------------------------------------------------------------
     | 4) DERIVED STYLES
     |--------------------------------------------------------------------------
     */
    // Filter for the background SVG
    const svgFilter = `invert(${svgInvert}) sepia(${svgSepia}) saturate(${svgSaturation}) hue-rotate(${svgHueRotation}deg)`;

    // The main color for text, border, etc.
    const computedColor = `hsl(${colorHue}, ${colorSaturation}%, ${colorLightness}%)`;

    /*
     |--------------------------------------------------------------------------
     | 5) DRAGGABLE / POSITION LOGIC
     |--------------------------------------------------------------------------
     */
    useEffect(() => {
        if (!position) {
            setPosition({
                x: window.innerWidth * 0.05,
                y: window.innerHeight * 0.44 - 100,
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

    const handleDragHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't drag if the user clicked an input / button
        if ((e.target as HTMLElement).closest("input, button, select")) {
            return;
        }
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initPos = position ? { ...position } : { x: 0, y: 0 };

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

    /*
     |--------------------------------------------------------------------------
     | 6) SAVE / LOAD PROFILE
     |--------------------------------------------------------------------------
     */
    const handleSaveProfile = () => {
        const saved = [
            svgHueRotation,
            svgSaturation,
            svgSepia,
            svgInvert,
            colorHue,
            colorSaturation,
            colorLightness,
        ].join(",");
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

    /*
     |--------------------------------------------------------------------------
     | 7) SHOW/HIDE SLIDERS
     |--------------------------------------------------------------------------
     */
    const [showSliders, setShowSliders] = useState(false);

    /*
     |--------------------------------------------------------------------------
     | RENDER
     |--------------------------------------------------------------------------
     */
    return (
        <div
            ref={paletteRef}
            // Give the top-level container a class so we can override child styles easily:
            className="fixed z-[100] rounded-lg overflow-hidden flex flex-col SkryrPalette"
            style={{
                // Use the computedColor as the "color" for the entire palette
                color: computedColor,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderRadius: "10px",
                left: position ? `${position.x}px` : `${window.innerWidth * 0.05}px`,
                top: position ? `${position.y}px` : "auto",
                bottom: position ? "auto" : "0%",
                width: "max-content",
                height: "fit-content",
                display: showPalette ? "flex" : "none",
                cursor: "default",
            }}
        >
            {/*
       * 1) A small <style> to ensure borders, fills, strokes, etc.
       *    inherit the same color (currentColor) from the parent.
       */}
            <style>
                {`
          /* Everything inside .SkryrPalette uses 'currentColor' for borders, fill, stroke, etc. */
          .SkryrPalette * {
            /* Use '!important' to override typical 'border-color: #fff' or similar. */
            color: inherit !important;
            border-color: currentColor !important;
            fill: currentColor !important;
            stroke: currentColor !important;
          }
        `}
            </style>

            {/* 2) Background SVG with filter */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    background: `url(https://eaccelerate.me/tetsuo/skryr.svg) no-repeat center / cover`,
                    filter: svgFilter,
                    mixBlendMode: "screen",
                    zIndex: 1,
                }}
            />

            {/*
        3) The top bar (drag handle):
           - "SKRYR" on the left
           - Toggle + Sliders + Profile on the right
      */}
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
                {/* Left: Label */}
                <span className="text-sm font-bold" style={{ marginRight: "8px" }}>
                    ☰ SKRYR
                </span>

                {/* Right: Sliders / Profile / Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {/* Toggle Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // prevent drag
                            setShowSliders((prev) => !prev);
                        }}
                        style={{
                            borderColor: computedColor,
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "0 6px",
                            cursor: "pointer",
                        }}
                        title={showSliders ? "Hide sliders" : "Show sliders"}
                    >
                        {showSliders ? "–" : "+"}
                    </button>

                    {/* Conditionally show sliders & profile if toggled on */}
                    {showSliders && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {/* SVG Filter Sliders */}
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={svgHueRotation}
                                onChange={(e) => setSvgHueRotation(parseInt(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`SVG Hue: ${svgHueRotation}°`}
                            />
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.1"
                                value={svgSaturation}
                                onChange={(e) => setSvgSaturation(parseFloat(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`SVG Sat: ${svgSaturation}x`}
                            />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={svgSepia}
                                onChange={(e) => setSvgSepia(parseFloat(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`SVG Sepia: ${svgSepia}`}
                            />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={svgInvert}
                                onChange={(e) => setSvgInvert(parseFloat(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`SVG Invert: ${svgInvert}`}
                            />

                            {/* Computed Color Sliders */}
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={colorHue}
                                onChange={(e) => setColorHue(parseInt(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`Color Hue: ${colorHue}°`}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={colorSaturation}
                                onChange={(e) => setColorSaturation(parseInt(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`Color Saturation: ${colorSaturation}%`}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={colorLightness}
                                onChange={(e) => setColorLightness(parseInt(e.target.value))}
                                style={{ backgroundColor: computedColor }}
                                title={`Color Lightness: ${colorLightness}%`}
                            />

                            {/* Profile Input + Save/Load Buttons */}
                            <input
                                type="text"
                                value={profile}
                                onChange={(e) => setProfile(e.target.value)}
                                placeholder="Profile"
                                className="text-xs px-1 py-0.5 rounded border border-gray-300"
                                style={{
                                    // Inherit the palette color, but set background transparent
                                    backgroundColor: "transparent",
                                    color: "inherit",
                                    borderColor: "currentColor",
                                }}
                            />
                            <button
                                onClick={handleSaveProfile}
                                className="px-1 py-0.5 text-xs rounded"
                                style={{
                                    backgroundColor: computedColor,
                                    color: "#fff",
                                }}
                                title="Save Profile"
                            >
                                💾
                            </button>
                            <button
                                onClick={handleLoadProfile}
                                className="px-1 py-0.5 text-xs rounded"
                                style={{
                                    backgroundColor: computedColor,
                                    color: "#fff",
                                }}
                                title="Load Profile"
                            >
                                🔄
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 4) The main content area */}
            <div className="relative z-10 w-full" style={{ padding: "8px" }}>
                {children}
            </div>
        </div>
    );
};

export default SkryrPalette;
