import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The brand mark: a "KS" monogram in a green disc with a fine sandal ring.
 * `tone="light"` inverts it for the green footer.
 * The same mark, drawn standalone, is the favicon in app/icon.svg.
 */

export function Monogram({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const disc = tone === "dark" ? "var(--color-forest)" : "var(--color-sandal)";
  const ink = tone === "dark" ? "var(--color-sandal)" : "var(--color-forest)";

  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("shrink-0", className)}>
      <circle cx="24" cy="24" r="24" fill={disc} />
      <circle cx="24" cy="24" r="20.25" fill="none" stroke={ink} strokeOpacity="0.55" strokeWidth="0.75" />
      <text
        x="24"
        y="30.6"
        textAnchor="middle"
        fill={ink}
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="19.5"
        fontWeight="600"
        letterSpacing="-0.4"
      >
        KS
      </text>
    </svg>
  );
}

export function Logo({
  tone = "dark",
  compact = false,
  className,
}: {
  tone?: "dark" | "light";
  /** Smaller mark, for the scrolled header and mobile. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Monogram
        tone={tone}
        className={cn("transition-[width,height] duration-[300ms]", compact ? "h-10 w-10" : "h-12 w-12")}
      />
      <span className="sr-only">{site.name}</span>
    </span>
  );
}
