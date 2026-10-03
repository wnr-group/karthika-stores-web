"use client";

import Image, { type ImageProps } from "next/image";

import imageLoader from "@/lib/image-loader";

/**
 * next/image with our CDN-aware loader attached. A client component because a
 * loader is a function, and functions cannot be passed from server components.
 */
export function RemoteImage({ alt, ...props }: Omit<ImageProps, "loader">) {
  return <Image alt={alt} {...props} loader={imageLoader} />;
}
