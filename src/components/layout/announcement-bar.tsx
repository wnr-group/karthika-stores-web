"use client";

import { useEffect, useState } from "react";

import { announcements } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The strip above the header. One line, crossfading every seven seconds, no
 * countdown timers and no exclamation marks. It carries service information,
 * not urgency.
 */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (announcements.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      setVisible(false);
      // Swap at the midpoint of the fade so the words never cross over.
      setTimeout(() => {
        setIndex((current) => (current + 1) % announcements.length);
        setVisible(true);
      }, 280);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-stone-soft bg-shell">
      <div className="shell flex min-h-9 items-center justify-center py-2">
        <p
          className={cn(
            "text-center text-[0.625rem] uppercase tracking-[0.18em] text-taupe transition-opacity duration-[280ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          {announcements[index]}
        </p>
      </div>
    </div>
  );
}
