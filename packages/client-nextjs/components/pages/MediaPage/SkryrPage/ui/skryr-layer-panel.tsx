"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSkryrColor } from "./skryr-color-context";

type MixBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

// Updated Slider Component
interface SliderProps {
    value: number[];
    onValueChange: (value: number[]) => void;
    min: number;
    max: number;
    step: number;
    className?: string;
    disabled?: boolean;
    showTooltip?: boolean;
    style?: React.CSSProperties;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
    ({
        value,
        onValueChange,
        min,
        max,
        step,
        className,
        disabled = false,
        showTooltip = true,
        style,
    }, ref) => {
        const [currentValue, setCurrentValue] = useState(value[0]);
        const [isDragging, setIsDragging] = useState(false);
        const [tooltipPosition, setTooltipPosition] = useState(0);
        const sliderRef = React.useRef<HTMLInputElement | null>(null) as React.MutableRefObject<HTMLInputElement | null>;
        const { computedColor } = useSkryrColor();

        useEffect(() => {
            setCurrentValue(value[0]);
        }, [value]);

        const calculateValueFromPosition = (clientX: number) => {
            if (!sliderRef.current) return currentValue;
            const rect = sliderRef.current.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const newValue = min + percentage * (max - min);
            const steppedValue = Math.round(newValue / step) * step;
            return Math.max(min, Math.min(max, steppedValue));
        };

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseFloat(event.target.value);
            setCurrentValue(newValue);
            onValueChange([newValue]);
            updateTooltipPosition(newValue);
        };

        const handleMouseDown = (event: React.MouseEvent<HTMLInputElement>) => {
            if (disabled) return;
            setIsDragging(true);
            const newValue = calculateValueFromPosition(event.clientX);
            setCurrentValue(newValue);
            onValueChange([newValue]);
            updateTooltipPosition(newValue);
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!isDragging || disabled || !sliderRef.current) return;
            const newValue = calculateValueFromPosition(event.clientX);
            setCurrentValue(newValue);
            onValueChange([newValue]);
            updateTooltipPosition(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        const handleTouchStart = (event: React.TouchEvent<HTMLInputElement>) => {
            if (disabled) return;
            setIsDragging(true);
            const newValue = calculateValueFromPosition(event.touches[0].clientX);
            setCurrentValue(newValue);
            onValueChange([newValue]);
            updateTooltipPosition(newValue);
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (!isDragging || disabled || !sliderRef.current) return;
            const newValue = calculateValueFromPosition(event.touches[0].clientX);
            setCurrentValue(newValue);
            onValueChange([newValue]);
            updateTooltipPosition(newValue);
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
        };

        useEffect(() => {
            if (isDragging) {
                window.addEventListener("mousemove", handleMouseMove);
                window.addEventListener("mouseup", handleMouseUp);
                window.addEventListener("touchmove", handleTouchMove);
                window.addEventListener("touchend", handleTouchEnd);
            }
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
                window.removeEventListener("touchmove", handleTouchMove);
                window.removeEventListener("touchend", handleTouchEnd);
            };
        }, [isDragging]);

        const updateTooltipPosition = (val: number) => {
            if (sliderRef.current) {
                const percentage = ((val - min) / (max - min)) * 100;
                const sliderWidth = sliderRef.current.offsetWidth;
                const thumbWidth = 16;
                const position = (percentage / 100) * (sliderWidth - thumbWidth) + thumbWidth / 2;
                setTooltipPosition(position);
            }
        };

        useEffect(() => {
            updateTooltipPosition(currentValue);
        }, [currentValue, min, max]);

        return (
            <div className="relative flex items-center w-full">
                <input
                    type="range"
                    ref={(node) => {
                        sliderRef.current = node;
                        if (typeof ref === "function") {
                            ref(node);
                        } else if (ref) {
                            (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                        }
                    }}
                    value={currentValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    disabled={disabled}
                    className={cn(
                        "w-full appearance-none h-2 bg-gray-600 rounded-full focus:outline-none cursor-pointer transition-all duration-200",
                        disabled ? "opacity-50 cursor-not-allowed" : "",
                        className
                    )}
                    style={{
                        ...style,
                        background: `linear-gradient(to right, ${computedColor} ${((currentValue - min) / (max - min)) * 100}%, #4b5563 ${((currentValue - min) / (max - min)) * 100}%)`,
                        accentColor: computedColor,
                    }}
                />
                {showTooltip && isDragging && (
                    <div
                        className="absolute bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none"
                        style={{
                            left: `${tooltipPosition}px`,
                            transform: "translateX(-50%)",
                            top: "-2.5rem",
                            color: computedColor,
                            border: `1px solid ${computedColor}`,
                        }}
                    >
                        {currentValue.toFixed(2)}
                    </div>
                )}
                <style jsx>{`
                    input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: ${computedColor};
                        cursor: pointer;
                        border: 2px solid #fff;
                        box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
                        transition: transform 0.2s ease;
                    }
                    input[type="range"]:hover::-webkit-slider-thumb {
                        transform: scale(1.2);
                    }
                    input[type="range"]::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: ${computedColor};
                        cursor: pointer;
                        border: 2px solid #fff;
                        box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
                        transition: transform 0.2s ease;
                    }
                    input[type="range"]:hover::-moz-range-thumb {
                        transform: scale(1.2);
                    }
                    input[type="range"]:disabled::-webkit-slider-thumb {
                        background: #6b7280;
                        cursor: not-allowed;
                        transform: none;
                    }
                    input[type="range"]:disabled::-moz-range-thumb {
                        background: #6b7280;
                        cursor: not-allowed;
                        transform: none;
                    }
                `}</style>
            </div>
        );
    }
);

Slider.displayName = "Slider";

// Main Component
interface SkryrLayerPanelProps {
    showLayerPanel: boolean;
    setShowLayerPanel: React.Dispatch<React.SetStateAction<boolean>>;
    milkdropBlendMode: MixBlendMode;
    setMilkdropBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    matrixBlendMode: MixBlendMode;
    setMatrixBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    asciiBlendMode: MixBlendMode;
    setAsciiBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    allMediaBlendMode: MixBlendMode;
    setAllMediaBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    milkdropOpacity: number;
    setMilkdropOpacity: React.Dispatch<React.SetStateAction<number>>;
    matrixOpacity: number;
    setMatrixOpacity: React.Dispatch<React.SetStateAction<number>>;
    asciiOpacity: number;
    setAsciiOpacity: React.Dispatch<React.SetStateAction<number>>;
    allMediaOpacity: number;
    setAllMediaOpacity: React.Dispatch<React.SetStateAction<number>>;
    milkdropGamma: number;
    setMilkdropGamma: React.Dispatch<React.SetStateAction<number>>;
    matrixGamma: number;
    setMatrixGamma: React.Dispatch<React.SetStateAction<number>>;
    asciiGamma: number;
    setAsciiGamma: React.Dispatch<React.SetStateAction<number>>;
    allMediaGamma: number;
    setAllMediaGamma: React.Dispatch<React.SetStateAction<number>>;
    milkdropSaturation: number;
    setMilkdropSaturation: React.Dispatch<React.SetStateAction<number>>;
    matrixSaturation: number;
    setMatrixSaturation: React.Dispatch<React.SetStateAction<number>>;
    asciiSaturation: number;
    setAsciiSaturation: React.Dispatch<React.SetStateAction<number>>;
    allMediaSaturation: number;
    setAllMediaSaturation: React.Dispatch<React.SetStateAction<number>>;
    layerOrder: string[];
    setLayerOrder: React.Dispatch<React.SetStateAction<string[]>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    matrixEnabled: boolean;
    setMatrixEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    asciiEnabled: boolean;
    setAsciiEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SkryrLayerPanel: React.FC<SkryrLayerPanelProps> = ({
    showLayerPanel,
    setShowLayerPanel,
    milkdropBlendMode,
    setMilkdropBlendMode,
    matrixBlendMode,
    setMatrixBlendMode,
    asciiBlendMode,
    setAsciiBlendMode,
    allMediaBlendMode,
    setAllMediaBlendMode,
    milkdropOpacity,
    setMilkdropOpacity,
    matrixOpacity,
    setMatrixOpacity,
    asciiOpacity,
    setAsciiOpacity,
    allMediaOpacity,
    setAllMediaOpacity,
    milkdropGamma,
    setMilkdropGamma,
    matrixGamma,
    setMatrixGamma,
    asciiGamma,
    setAsciiGamma,
    allMediaGamma,
    setAllMediaGamma,
    milkdropSaturation,
    setMilkdropSaturation,
    matrixSaturation,
    setMatrixSaturation,
    asciiSaturation,
    setAsciiSaturation,
    allMediaSaturation,
    setAllMediaSaturation,
    layerOrder,
    setLayerOrder,
    backgroundEnabled,
    setBackgroundEnabled,
    matrixEnabled,
    setMatrixEnabled,
    asciiEnabled,
    setAsciiEnabled,
}) => {
    const { computedColor } = useSkryrColor();
    const blendModeOptions: MixBlendMode[] = [
        'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
        'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
        'exclusion', 'hue', 'saturation', 'color', 'luminosity'
    ];

    const moveLayerUp = (layer: string) => {
        setLayerOrder((prev) => {
            const index = prev.indexOf(layer);
            if (index > 0) {
                const newOrder = [...prev];
                [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                return newOrder;
            }
            return prev;
        });
    };

    const moveLayerDown = (layer: string) => {
        setLayerOrder((prev) => {
            const index = prev.indexOf(layer);
            if (index < prev.length - 1) {
                const newOrder = [...prev];
                [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                return newOrder;
            }
            return prev;
        });
    };

    const LayerControls = ({ layer, blendMode, setBlendMode, opacity, setOpacity, gamma, setGamma, saturation, setSaturation }: {
        layer: string;
        blendMode: MixBlendMode;
        setBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
        opacity: number;
        setOpacity: React.Dispatch<React.SetStateAction<number>>;
        gamma: number;
        setGamma: React.Dispatch<React.SetStateAction<number>>;
        saturation: number;
        setSaturation: React.Dispatch<React.SetStateAction<number>>;
    }) => (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span>{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                <div className="flex gap-1">
                    <Button
                        onClick={() => moveLayerUp(layer)}
                        disabled={layerOrder.indexOf(layer) === 0}
                        className="w-6 h-6 text-sm border-2 border-current text-gray-500 hover:bg-gray-700 disabled:opacity-50"
                        title="Move Up"
                    >
                        <i className="fa-solid fa-arrow-up" />
                    </Button>
                    <Button
                        onClick={() => moveLayerDown(layer)}
                        disabled={layerOrder.indexOf(layer) === layerOrder.length - 1}
                        className="w-6 h-6 text-sm border-2 border-current text-gray-500 hover:bg-gray-700 disabled:opacity-50"
                        title="Move Down"
                    >
                        <i className="fa-solid fa-arrow-down" />
                    </Button>
                </div>
            </div>
            <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as MixBlendMode)}
                className="w-full p-1 text-xs bg-gray-800 text-white border rounded"
                style={{ borderColor: computedColor }}
            >
                {blendModeOptions.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                ))}
            </select>
            <div className="flex items-center gap-1">
                <i className="fa-solid fa-eye-slash text-xs" style={{ color: computedColor }} />
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[opacity]}
                    onValueChange={(value) => setOpacity(value[0])}
                    className="w-full h-4"
                    style={{ accentColor: computedColor }}
                />
            </div>
            <div className="flex items-center gap-1">
                <i className="fa-solid fa-sun text-xs" style={{ color: computedColor }} />
                <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    value={[gamma]}
                    onValueChange={(value) => setGamma(value[0])}
                    className="w-full h-4"
                    style={{ accentColor: computedColor }}
                />
            </div>
            <div className="flex items-center gap-1">
                <i className="fa-solid fa-droplet text-xs" style={{ color: computedColor }} />
                <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    className="w-full h-4"
                    style={{ accentColor: computedColor }}
                />
            </div>
        </div>
    );

    return (
        <div
            className={`fixed top-0 right-0 w-64 h-full bg-gray-900 p-4 z-[100] transition-transform duration-300 ${showLayerPanel ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Layer & Effects</h2>
                <Button
                    onClick={() => setShowLayerPanel(false)}
                    className="w-8 h-8 text-xl text-gray-500 hover:bg-gray-700"
                    title="Close Layer Panel"
                >
                    <i className="fa-solid fa-times" />
                </Button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto h-[calc(100%-4rem)]">
                <LayerControls
                    layer="milkdrop"
                    blendMode={milkdropBlendMode}
                    setBlendMode={setMilkdropBlendMode}
                    opacity={milkdropOpacity}
                    setOpacity={setMilkdropOpacity}
                    gamma={milkdropGamma}
                    setGamma={setMilkdropGamma}
                    saturation={milkdropSaturation}
                    setSaturation={setMilkdropSaturation}
                />
                <LayerControls
                    layer="matrix"
                    blendMode={matrixBlendMode}
                    setBlendMode={setMatrixBlendMode}
                    opacity={matrixOpacity}
                    setOpacity={setMatrixOpacity}
                    gamma={matrixGamma}
                    setGamma={setMatrixGamma}
                    saturation={matrixSaturation}
                    setSaturation={setMatrixSaturation}
                />
                <LayerControls
                    layer="ascii"
                    blendMode={asciiBlendMode}
                    setBlendMode={setAsciiBlendMode}
                    opacity={asciiOpacity}
                    setOpacity={setAsciiOpacity}
                    gamma={asciiGamma}
                    setGamma={setAsciiGamma}
                    saturation={asciiSaturation}
                    setSaturation={setAsciiSaturation}
                />
                <LayerControls
                    layer="allMedia"
                    blendMode={allMediaBlendMode}
                    setBlendMode={setAllMediaBlendMode}
                    opacity={allMediaOpacity}
                    setOpacity={setAllMediaOpacity}
                    gamma={allMediaGamma}
                    setGamma={setAllMediaGamma}
                    saturation={allMediaSaturation}
                    setSaturation={setAllMediaSaturation}
                />
            </div>
        </div>
    );
};

export default SkryrLayerPanel;