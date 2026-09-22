"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides site chrome on routes that should be undistracted.
 *
 * Checkout carries its own minimal header — a wordmark and a way back to the
 * bag — and the admin has its own shell entirely. Neither should also have
 * the shop navigation sitting above it.
 */
const BARE_ROUTES = ["/checkout", "/admin"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  return <>{children}</>;
}
