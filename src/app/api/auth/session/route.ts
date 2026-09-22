import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminAuth, isAdminConfigured, SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/firebase/admin";
import { getRepository } from "@/lib/data/repository";

/**
 * Exchanges a Firebase ID token for the httpOnly session cookie every
 * protected page and route handler reads. See lib/auth/session.ts.
 */
export async function POST(request: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json({ message: "Sign-in is not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ message: "Missing ID token" }, { status: 400 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ message: "Sign-in is not configured" }, { status: 501 });
  }

  try {
    const decoded = await auth.verifyIdToken(body.idToken);
    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const repository = await getRepository();
    await repository.upsertProfile(decoded.uid, {
      email: decoded.email ?? "",
      displayName: (decoded.name as string | undefined) ?? null,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Could not verify that sign-in" }, { status: 401 });
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
