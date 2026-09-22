"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * A hairline stepper. Two buttons and a number, no select, no spinner arrows.
 */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  size = "md",
  className,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  /** Announced to screen readers, e.g. the product name. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const dimensions = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className={cn("inline-flex items-center border border-stone", className)}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className={cn(
          "flex items-center justify-center text-taupe transition-colors hover:text-ink disabled:opacity-30",
          dimensions,
        )}
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>

      <span
        aria-live="polite"
        className={cn(
          "tnum min-w-[2ch] text-center text-ink",
          size === "sm" ? "text-[0.8125rem]" : "text-sm",
        )}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase quantity of ${label}`}
        className={cn(
          "flex items-center justify-center text-taupe transition-colors hover:text-ink disabled:opacity-30",
          dimensions,
        )}
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
