"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Extend props if you need to pass computedColor from outside.
 * Otherwise, you can define computedColor here if it's local to this component.
 */
interface SelectProps {
  label?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  className?: string;
  /** The dynamic color you want for the border, e.g. `hsl(...)` or `#abc123` */
  computedColor: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  className,
  computedColor,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium">{label}</label>}

      <select
        value={value}
        onChange={onChange}
        // Inline style overrides any default border color
        style={{ borderColor: computedColor }}
        className={cn(
          // Make sure there's no conflicting color class like `border-gray-300`.
          // Instead, we just say `border` or `border-2` so the thickness is still set.
          "block w-full rounded-md border bg-transparent px-3 py-2 shadow-sm",

          // Remove any ring color utility; or if you want a focus ring, use a custom approach.
          // e.g., "focus-visible:outline-none focus-visible:ring-1"
          // but that might set the ring color to a default unless you override it.

          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1",
          "focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
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
