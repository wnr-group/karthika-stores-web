import Image from "next/image";

import type { ProductImage, Tone } from "@/lib/types";
import { cn, hashString } from "@/lib/utils";

/**
 * The single image component for the whole site.
 *
 * If `image.url` is set it renders next/image. If it is null (which is the
 * case for the entire seed catalogue, because the photography has not been
 * shot yet) it renders a woven placeholder in the garment's own tone: a soft
 * vertical wash, a fine warp-and-weft texture, and a border stripe down one
 * edge in the manner of a saree border.
 *
 * The point is that a page full of placeholders still reads as a designed
 * page rather than as a page with broken images, and that dropping a Storage
 * URL into `image.url` later changes nothing else.
 */

interface TonePalette {
  from: string;
  to: string;
  border: string;
}

const TONE_PALETTE: Record<Tone, TonePalette> = {
  ivory: { from: "#f1eadd", to: "#ded2bc", border: "#c9b896" },
  sand: { from: "#e7dbc5", to: "#cfbea0", border: "#b49e7c" },
  terracotta: { from: "#dfb49c", to: "#b87450", border: "#9b5a38" },
  maroon: { from: "#b98a8b", to: "#7a3640", border: "#5a222c" },
  olive: { from: "#c3c4ac", to: "#7e856b", border: "#5f6650" },
  indigo: { from: "#a9b0be", to: "#5a6478", border: "#404a5e" },
  saffron: { from: "#ebce9c", to: "#c99a47", border: "#a87c31" },
  rose: { from: "#e7c6c2", to: "#c08d8c", border: "#a16e6e" },
  charcoal: { from: "#b7b2ac", to: "#6a645e", border: "#4b4642" },
  teal: { from: "#a8c0bc", to: "#527974", border: "#3b5f5b" },
};

export function toneColor(tone: Tone): string {
  return TONE_PALETTE[tone].to;
}

interface MediaProps {
  image: ProductImage;
  /** Wrapper classes. The wrapper must establish its own size and position. */
  className?: string;
  /** Passed to next/image. Always set this on anything above the fold. */
  sizes?: string;
  priority?: boolean;
  /** Applied to the <img> only; placeholders are always cover. */
  imageClassName?: string;
}

export function Media({
  image,
  className,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
  imageClassName,
}: MediaProps) {
  if (image.url) {
    return (
      <div className={cn("relative overflow-hidden bg-shell", className)}>
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return <WovenPlaceholder image={image} className={className} />;
}

/* -------------------------------------------------------------------------
   Placeholder
   ------------------------------------------------------------------------- */

function WovenPlaceholder({ image, className }: { image: ProductImage; className?: string }) {
  const palette = TONE_PALETTE[image.tone];
  const seed = hashString(image.id);

  // Vary the composition per image so a grid does not read as one repeated
  // swatch: the border sits left or right, and its width shifts a little.
  const borderOnLeft = seed % 2 === 0;
  const borderWidth = 9 + (seed % 5) * 2;
  const washAngle = 150 + (seed % 5) * 12;

  // Detail and fabric crops are close-ups, so they read better as a flatter,
  // more saturated field than a full-length drape.
  const isCloseUp = image.kind === "detail" || image.kind === "fabric";

  return (
    <div
      role="img"
      aria-label={image.alt}
      className={cn("relative overflow-hidden bg-shell", className)}
      style={{
        backgroundImage: `linear-gradient(${washAngle}deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
    >
      {/* Warp and weft. Finer on close crops, as a real macro shot would be. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, rgba(31,28,25,0.042) 0 1px, transparent 1px ${
            isCloseUp ? "9px" : "6px"
          }), repeating-linear-gradient(0deg, rgba(255,255,255,0.038) 0 1px, transparent 1px ${
            isCloseUp ? "9px" : "6px"
          })`,
        }}
      />

      {/* The border stripe, with its zari hairline. Omitted on close crops. */}
      {!isCloseUp && (
        <div
          aria-hidden
          className="absolute inset-y-0"
          style={{
            width: `${borderWidth}%`,
            [borderOnLeft ? "left" : "right"]: 0,
            backgroundColor: palette.border,
            opacity: 0.85,
          }}
        >
          <div
            className="absolute inset-y-0 w-px opacity-50"
            style={{
              [borderOnLeft ? "right" : "left"]: "22%",
              backgroundColor: "#d8c08a",
            }}
          />
        </div>
      )}

      {/* A soft fall of light, so the field is not perfectly flat. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 12%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)",
        }}
      />

      <span
        aria-hidden
        className="absolute bottom-3 right-3 font-display text-[0.6875rem] leading-none tracking-[0.3em] text-white/45"
      >
        KA
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Aspect ratios
   Named rather than inline, so the whole site crops consistently.
   ------------------------------------------------------------------------- */

export const ratio = {
  /** The standard product crop. Tall, like a hanging saree. */
  product: "aspect-[3/4]",
  /** Editorial portrait, used in hero and story blocks. */
  portrait: "aspect-[4/5]",
  /** Wide editorial band. */
  landscape: "aspect-[16/10]",
  /** Full-bleed hero on desktop. */
  hero: "aspect-[4/5] md:aspect-[16/9]",
  square: "aspect-square",
} as const;
