"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";

/**
 * Seller approval. A new seller starts "pending" and nothing they list shows
 * in the shop until an admin approves them. Rejecting keeps the record (and
 * lets an admin approve it later) rather than deleting the application.
 */

async function setStatus(formData: FormData, status: "approved" | "rejected", note: string | null) {
  await assertAdmin();
  const repository = await getRepository();
  const vendor = await repository.getVendorById(String(formData.get("vendorId") ?? ""));
  if (!vendor || vendor.status === status) return;
  await repository.updateVendor(vendor.id, { status, statusNote: note });
  // The seller's products appear in (or leave) every shop page.
  revalidatePath("/", "layout");
}

export async function approveVendor(formData: FormData) {
  await setStatus(formData, "approved", null);
}

export async function rejectVendor(formData: FormData) {
  await setStatus(formData, "rejected", "Application rejected by the marketplace admin");
}
