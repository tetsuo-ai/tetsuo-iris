import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
    value: number[];
    onValueChange: (value: number[]) => void;
    min: number;
    max: number;
    step: number;
    className?: string;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
    ({ value, onValueChange, min, max, step, className }, ref) => {
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange([parseFloat(event.target.value)]);
        };

        return (
            <div className="relative flex items-center">
                <input
                    type="range"
                    ref={ref}
                    value={value[0]}
                    min={min}
                    max={max}
                    step={step}
                    onChange={handleChange}
                    className={cn(
                        "w-full appearance-none bg-gray-400 h-1 rounded focus:outline-none",
                        className
                    )}
                />
                <span className="ml-2 text-white">{value[0].toFixed(1)}</span>
            </div>
        );
    }
);

Slider.displayName = "Slider";

export default Slider;
