/**
 * The image loader for next/image.
 *
 * Pexels serves any width straight from its CDN, so we ask it for exactly the
 * width the browser needs. Anything else (Supabase Storage, Pixabay) is
 * served as-is; the width parameter is added only so next/image can tell the
 * srcset entries apart, and those hosts ignore it.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const url = new URL(src);

  if (url.hostname === "images.pexels.com") {
    url.searchParams.set("auto", "compress");
    url.searchParams.set("cs", "tinysrgb");
    url.searchParams.set("w", String(width));
    return url.toString();
  }

  url.searchParams.set("w", String(width));
  return url.toString();
}
