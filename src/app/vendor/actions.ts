"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_VENDOR_COOKIE, getAdminAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";

/**
 * Opens a given seller's dashboard. Allowed in demo mode (where the admin
 * check passes for everyone) and for real admins, who may view any seller's
 * dashboard for support. Everyone else only ever sees their own.
 */
export async function openVendorDashboard(formData: FormData) {
  if (!(await getAdminAccess()).allowed) return;

  const slug = String(formData.get("vendor") ?? "");
  const vendor = slug ? await (await getRepository()).getVendorBySlug(slug) : null;
  if (!vendor) return;

  const store = await cookies();
  store.set(DEMO_VENDOR_COOKIE, vendor.slug, { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/vendor");
}
