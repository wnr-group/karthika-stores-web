"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The product-page accordion. A hairline rule per row, a rotating plus, and a
 * grid-rows height transition so nothing jumps when the panel opens.
 */

export interface AccordionItem {
  label: string;
  content: ReactNode;
}

export function Accordion({
  items,
  defaultOpen = -1,
  className,
}: {
  items: AccordionItem[];
  /** Index of the row that starts open, or -1 for all closed. */
  defaultOpen?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={cn("border-t border-stone", className)}>
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${id}-panel-${index}`;
        const buttonId = `${id}-button-${index}`;

        return (
          <div key={item.label} className="border-b border-stone">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink">
                  {item.label}
                </span>
                <span
                  aria-hidden
                  className="relative h-3 w-3 shrink-0 text-taupe transition-colors group-hover:text-ink"
                >
                  <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
                  <span
                    className={cn(
                      "absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-[240ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                      isOpen && "scale-y-0",
                    )}
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows] duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "pb-6 text-sm leading-relaxed text-graphite transition-opacity duration-[240ms]",
                    isOpen ? "opacity-100" : "opacity-0",
                  )}
                >
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
