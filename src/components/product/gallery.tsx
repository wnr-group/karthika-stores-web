"use client";

import { useEffect, useRef, useState } from "react";

import { CloseIcon } from "@/components/ui/icons";
import { Media } from "@/components/ui/media";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The product gallery.
 *
 * Desktop: a column of thumbnails on the left, one large image on the right,
 * click to open full screen.
 * Mobile: a snap-scrolling rail with a counter, because a thumbnail column
 * wastes the width where it matters most.
 */

const KIND_LABEL: Record<ProductImage["kind"], string> = {
  primary: "Front",
  draped: "Draped",
  detail: "Weave",
  border: "Border",
  fabric: "Fabric",
  lifestyle: "Worn",
};

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const current = images[active] ?? images[0];

  useEffect(() => {
    if (!zoomed) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowRight") setActive((index) => (index + 1) % images.length);
      if (event.key === "ArrowLeft") {
        setActive((index) => (index - 1 + images.length) % images.length);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [zoomed, images.length]);

  // Track which image the mobile rail has settled on.
  function onRailScroll() {
    const rail = railRef.current;
    if (!rail) return;
    setMobileIndex(Math.round(rail.scrollLeft / rail.clientWidth));
  }

  if (!current) return null;

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <div
          ref={railRef}
          onScroll={onRailScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((image, index) => (
            <div key={image.id} className="relative aspect-[3/4] w-full shrink-0 snap-center">
              <Media
                image={image}
                priority={index === 0}
                sizes="100vw"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 py-4">
          {images.map((image, index) => (
            <span
              key={image.id}
              aria-hidden
              className={cn(
                "h-px w-6 transition-colors duration-[240ms]",
                index === mobileIndex ? "bg-ink" : "bg-stone",
              )}
            />
          ))}
          <span className="sr-only">
            Image {mobileIndex + 1} of {images.length}
          </span>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden gap-5 lg:flex">
        <div className="flex w-20 shrink-0 flex-col gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View ${KIND_LABEL[image.kind].toLowerCase()} image`}
              aria-current={index === active}
              className={cn(
                "group relative aspect-[3/4] w-full overflow-hidden transition-opacity duration-[240ms]",
                index === active ? "opacity-100" : "opacity-55 hover:opacity-90",
              )}
            >
              <Media image={image} sizes="80px" className="absolute inset-0 h-full w-full" />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-px transition-colors",
                  index === active ? "bg-ink" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Open ${name} images full screen`}
          className="relative flex-1 cursor-zoom-in"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            {images.map((image, index) => (
              <Media
                key={image.id}
                image={image}
                priority={index === 0}
                sizes="(min-width: 1280px) 44vw, 50vw"
                className={cn(
                  "absolute inset-0 h-full w-full transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                  index === active ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>

          <span className="absolute bottom-4 right-4 bg-paper/90 px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.18em] text-taupe">
            {KIND_LABEL[current.kind]}
          </span>
        </button>
      </div>

      {/* Full screen */}
      {zoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
          className="fixed inset-0 z-[80] flex flex-col bg-ivory"
        >
          <div className="flex items-center justify-between border-b border-stone px-6 py-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-taupe">
              {name} &middot; {KIND_LABEL[current.kind]}
            </p>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close"
              className="p-2 text-taupe transition-colors hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="relative h-full w-full max-w-3xl">
              <Media
                image={current}
                sizes="90vw"
                className="absolute inset-0 h-full w-full"
                imageClassName="object-contain"
              />
            </div>
          </div>

          <div className="flex justify-center gap-3 border-t border-stone px-6 py-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1}`}
                className={cn(
                  "relative h-16 w-12 overflow-hidden transition-opacity",
                  index === active ? "opacity-100" : "opacity-50 hover:opacity-80",
                )}
              >
                <Media image={image} sizes="48px" className="absolute inset-0 h-full w-full" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
