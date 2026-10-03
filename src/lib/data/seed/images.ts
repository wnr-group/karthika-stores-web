/**
 * Seed photography.
 *
 * Licensed stock photography from Pexels, hand-checked per listing, keyed by
 * listing slug (or `cover-*` / `vendor-*` / `hero-*` for editorial slots).
 * Drop a Supabase Storage URL into any image's `url` and it renders in place;
 * an image with no URL falls back to the tonal placeholder in
 * `components/ui/media.tsx`.
 */

import type { ImageKind, ProductImage, Tone } from "@/lib/types";

import { PHOTO_LIBRARY } from "./photo-library";

export const PX = (id: number, width = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

export interface StockPhoto {
  id: number;
  alt: string;
}

const KIND_SEQUENCE: ImageKind[] = ["primary", "detail", "lifestyle", "gallery", "gallery"];

/** Every photo filed under `key`, as a listing's gallery. */
export function photos(key: string, tone: Tone, fallbackAlt: string): ProductImage[] {
  const entries = PHOTO_LIBRARY[key] ?? [];

  if (entries.length === 0) {
    return [
      {
        id: `${key}-primary`,
        url: null,
        alt: fallbackAlt,
        kind: "primary",
        tone,
        displayOrder: 0,
      },
    ];
  }

  return entries.map((entry, index) => ({
    id: `${key}-${index}`,
    url: PX(entry.id),
    alt: entry.alt,
    kind: KIND_SEQUENCE[index] ?? "gallery",
    tone,
    displayOrder: index,
  }));
}

/** The first photo filed under `key`, as a single editorial image. */
export function photo(
  key: string,
  tone: Tone,
  fallbackAlt: string,
  kind: ImageKind = "lifestyle",
): ProductImage {
  const entry = PHOTO_LIBRARY[key]?.[0];
  return {
    id: `${key}-img`,
    url: entry ? PX(entry.id) : null,
    alt: entry?.alt ?? fallbackAlt,
    kind,
    tone,
    displayOrder: 0,
  };
}

/** A specific Pexels photo, for slots curated by hand. */
export function pexels(
  id: string,
  pexelsId: number,
  alt: string,
  tone: Tone,
  kind: ImageKind = "lifestyle",
): ProductImage {
  return { id, url: PX(pexelsId), alt, kind, tone, displayOrder: 0 };
}
