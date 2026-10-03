import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { getCurrentUser, isAdmin, type SessionUser } from "@/lib/auth/session";
import { getRepository, isUsingSeedData } from "@/lib/data/repository";
import { isAdminConfigured } from "@/lib/firebase/admin";
import type { Vendor } from "@/lib/types";

/**
 * Who may open the admin and vendor dashboards.
 *
 * Normally: an admin is a verified session whose email is on ADMIN_EMAILS,
 * and a vendor is a verified session whose email is one of that vendor's
 * owner emails.
 *
 * Demo mode: when there is no Firebase *and* no database (a fresh clone, or a
 * preview deploy with no secrets), nobody could sign in at all, so both
 * dashboards open to everyone, writes go only to the in-memory seed store,
 * and every dashboard page says so in a banner. The moment either Firebase or
 * Supabase is configured, demo mode is off and the real checks apply.
 */
export function isDemoMode(): boolean {
  return !isAdminConfigured && isUsingSeedData();
}

/** The cookie the demo vendor switcher writes. */
export const DEMO_VENDOR_COOKIE = "haat.demo-vendor";
const DEFAULT_DEMO_VENDOR = "ananya-sarees";

export interface AdminAccess {
  allowed: boolean;
  user: SessionUser | null;
  demo: boolean;
}

export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  if (isDemoMode()) return { allowed: true, user: null, demo: true };
  const user = await getCurrentUser();
  return { allowed: await isAdmin(user), user, demo: false };
});

export interface VendorAccess {
  vendor: Vendor | null;
  user: SessionUser | null;
  demo: boolean;
  /** Admins may open any vendor's dashboard, for support. */
  viaAdmin: boolean;
}

export const getVendorAccess = cache(async (): Promise<VendorAccess> => {
  const repository = await getRepository();
  const store = await cookies();
  const requested = store.get(DEMO_VENDOR_COOKIE)?.value;

  if (isDemoMode()) {
    const vendor =
      (requested ? await repository.getVendorBySlug(requested) : null) ??
      (await repository.getVendorBySlug(DEFAULT_DEMO_VENDOR));
    return { vendor, user: null, demo: true, viaAdmin: false };
  }

  const user = await getCurrentUser();
  if (!user?.email) return { vendor: null, user, demo: false, viaAdmin: false };

  if (await isAdmin(user)) {
    const vendor = requested ? await repository.getVendorBySlug(requested) : null;
    if (vendor) return { vendor, user, demo: false, viaAdmin: true };
  }

  return { vendor: await repository.getVendorForEmail(user.email), user, demo: false, viaAdmin: false };
});

export class ForbiddenError extends Error {
  constructor(message = "Not allowed") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * For server actions. A server action is a public endpoint whatever page
 * rendered it, so every write re-checks access itself.
 */
export async function assertAdmin(): Promise<AdminAccess> {
  const access = await getAdminAccess();
  if (!access.allowed) throw new ForbiddenError();
  return access;
}

/** Returns the caller's own vendor. A vendor id from a form is never trusted. */
export async function assertVendor(): Promise<Vendor> {
  const access = await getVendorAccess();
  if (!access.vendor) throw new ForbiddenError();
  return access.vendor;
}
