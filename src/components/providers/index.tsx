"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";

/**
 * One client boundary for the whole app, mounted in the root layout.
 * Everything above it stays a server component.
 *
 * Order matters: the wishlist merges on sign-in, so it has to sit inside
 * AuthProvider.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
