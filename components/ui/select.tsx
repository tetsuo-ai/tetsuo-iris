import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps {
    label?: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    className?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    value,
    onChange,
    options,
    className,
}) => {
    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <select
                value={value}
                onChange={onChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export { Select };
