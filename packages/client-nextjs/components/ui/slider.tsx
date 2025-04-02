"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
        // Use MutableRefObject to allow mutation of current
        const sliderRef = React.useRef<HTMLInputElement | null>(null) as React.MutableRefObject<HTMLInputElement | null>;

        useEffect(() => {
            setCurrentValue(value[0]);
        }, [value]);

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseFloat(event.target.value);
            setCurrentValue(newValue);
            onValueChange([newValue]);
            updateTooltipPosition(newValue);
        };

        const handleMouseDown = () => {
            setIsDragging(true);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

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
                        sliderRef.current = node; // Safe to mutate with MutableRefObject
                        if (typeof ref === "function") {
                            ref(node); // Handle function ref
                        } else if (ref) {
                            // For MutableRefObject, let React handle it
                            (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                        }
                    }}
                    value={currentValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    disabled={disabled}
                    className={cn(
                        "w-full appearance-none h-2 bg-gray-600 rounded-full focus:outline-none cursor-pointer transition-all duration-200",
                        disabled ? "opacity-50 cursor-not-allowed" : "",
                        className
                    )}
                    style={{
                        ...style,
                        background: `linear-gradient(to right, ${style?.accentColor || "#00ff00"} ${((currentValue - min) / (max - min)) * 100}%, #4b5563 ${((currentValue - min) / (max - min)) * 100}%)`,
                    }}
                />
                <input
                    type="number"
                    value={currentValue}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleChange}
                    disabled={disabled}
                    className={cn(
                        "w-14 text-center bg-gray-700 text-white p-1 rounded ml-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800",
                        disabled ? "opacity-50" : ""
                    )}
                    style={{ borderColor: style?.accentColor || "#00ff00" }}
                />
                {showTooltip && isDragging && (
                    <div
                        className="absolute bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none"
                        style={{
                            left: `${tooltipPosition}px`,
                            transform: "translateX(-50%)",
                            top: "-2.5rem",
                            color: style?.accentColor || "#00ff00",
                            border: `1px solid ${style?.accentColor || "#00ff00"}`,
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
                        background: ${style?.accentColor || "#00ff00"};
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
                        background: ${style?.accentColor || "#00ff00"};
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

export default Slider;