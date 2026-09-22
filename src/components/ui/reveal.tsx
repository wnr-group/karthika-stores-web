"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Fades a block up as it enters the viewport, once.
 *
 * Deliberately plain: an IntersectionObserver and a class swap, no animation
 * library on the critical path. If JavaScript never runs, the content is
 * visible from the first paint because the hidden class is only applied after
 * mount.
 */

interface RevealProps {
  children: ReactNode;
  /** Stagger within a group, in milliseconds. Keep under 200. */
  delay?: number;
  as?: ElementType;
  className?: string;
}

export function Reveal({ children, delay = 0, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setMounted(true);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const node = ref.current;

    if (prefersReducedMotion || !node) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(mounted && !shown && "reveal-hidden", shown && "reveal-shown", className)}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
