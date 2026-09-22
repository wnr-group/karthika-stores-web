"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * The one drawer used for the bag, the mobile menu and the mobile filter
 * sheet. Slides from an edge over a warm scrim, locks the body scroll, traps
 * Tab inside itself and returns focus where it came from.
 */

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "bottom";
  title: string;
  /** Hides the visible heading but keeps it for screen readers. */
  hideTitle?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  hideTitle = false,
  footer,
  children,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;

    const { overflow, paddingRight } = document.body.style;
    // Compensate for the scrollbar so the page behind does not shift.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    // Move focus in, but to the panel rather than the close button, so a
    // screen reader announces the drawer's name first.
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const slide = {
    right: open ? "translate-x-0" : "translate-x-full",
    left: open ? "translate-x-0" : "-translate-x-full",
    bottom: open ? "translate-y-0" : "translate-y-full",
  }[side];

  const position = {
    right: "inset-y-0 right-0 h-full w-full max-w-[26rem]",
    left: "inset-y-0 left-0 h-full w-full max-w-[22rem]",
    bottom: "inset-x-0 bottom-0 max-h-[88vh] w-full",
  }[side];

  return (
    <div
      className={cn("fixed inset-0 z-[60]", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/25 transition-opacity duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col bg-paper shadow-[0_0_60px_rgba(31,28,25,0.08)] outline-none transition-transform duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          position,
          slide,
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone px-5 py-4 md:px-6">
          <h2
            className={cn(
              "text-[0.6875rem] uppercase tracking-[0.2em] text-ink",
              hideTitle && "sr-only",
            )}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="-mr-2 p-2 text-taupe transition-colors hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? <div className="shrink-0 border-t border-stone">{footer}</div> : null}
      </div>
    </div>
  );
}
