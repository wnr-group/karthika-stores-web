import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * A cheap first gate on /admin and /account.
 *
 * Middleware runs on the edge, where the Firebase Admin SDK cannot, so this
 * only checks that a session cookie is *present*. It exists to avoid rendering
 * a protected page for someone who is plainly not signed in. The real check,
 * which verifies the cookie's signature and the admin allowlist, happens in
 * the route's own server component. This is a convenience, never the
 * authorisation boundary.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  // Demo mode (no Firebase and no database): the dashboards open to everyone
  // so the marketplace can be explored. See lib/auth/access.ts.
  const demo = !process.env.FIREBASE_PRIVATE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { pathname: path } = request.nextUrl;
  if (demo && (path.startsWith("/admin") || path.startsWith("/vendor"))) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("redirect", `${pathname}${search}`);

  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/vendor/:path*"],
};
