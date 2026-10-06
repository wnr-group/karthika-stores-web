import "server-only";

import { randomUUID } from "node:crypto";

import { getServiceClient } from "@/lib/supabase/server";

/**
 * Product photographs in Supabase Storage.
 *
 * Files go to the public `product-images` bucket under the seller's id, so
 * one seller's uploads never collide with another's. The bucket must exist
 * and be public; the URL stored on the product is its public URL.
 */

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(EXTENSIONS);

export const isStorageConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

/** Checks a file before anything is uploaded, so a bad one fails the whole save cleanly. */
export function validateImage(file: File): string | null {
  if (!EXTENSIONS[file.type]) return `${file.name}: use a JPG, PNG, WebP or AVIF image.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: images must be 5 MB or smaller.`;
  return null;
}

/** Uploads one product image and returns its public URL. */
export async function uploadProductImage(file: File, vendorId: string): Promise<string> {
  if (!isStorageConfigured) {
    throw new ImageUploadError("Image uploads need Supabase to be configured.");
  }

  const problem = validateImage(file);
  if (problem) throw new ImageUploadError(problem);

  const path = `${vendorId}/${randomUUID()}.${EXTENSIONS[file.type]}`;
  const storage = getServiceClient().storage.from(PRODUCT_IMAGE_BUCKET);

  const { error } = await storage.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new ImageUploadError(`Could not upload ${file.name}: ${error.message}`);

  return storage.getPublicUrl(path).data.publicUrl;
}
