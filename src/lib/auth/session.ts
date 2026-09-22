import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { getAdminAuth, isAdminConfigured, SESSION_COOKIE } from "@/lib/firebase/admin";

/**
 * Server-side session reading.
 *
 * Every protected page and route handler goes through `requireUser()`. There
 * is no other way to learn who the caller is: a UID in a request body or a
 * query string is never trusted.
 */

export interface SessionUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

/**
 * The signed-in user, or null. Memoised per request so a page that checks
 * auth in three places still verifies the cookie once.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isAdminConfigured) return null;

  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  const auth = getAdminAuth();
  if (!auth) return null;

  try {
    // checkRevoked: a customer who signs out everywhere is out immediately,
    // not in two weeks when the cookie expires.
    const claims = await auth.verifySessionCookie(session, true);
    return {
      uid: claims.uid,
      email: claims.email ?? "",
      emailVerified: Boolean(claims.email_verified),
      name: (claims.name as string | undefined) ?? null,
    };
  } catch {
    // Expired, revoked or forged. All three mean "not signed in".
    return null;
  }
});

export class UnauthorizedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "UnauthorizedError";
  }
}

/** Throws rather than returning null, for route handlers. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * Admin check. Driven by a comma-separated allowlist of email addresses so
 * the shop owner can be added without a database round trip on every
 * request; `profiles.is_admin` is the long-term home for this.
 */
export async function isAdmin(user: SessionUser | null): Promise<boolean> {
  if (!user?.email) return false;

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(user.email.toLowerCase());
}
