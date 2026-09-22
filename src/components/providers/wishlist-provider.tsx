"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/providers/auth-provider";
import type { ProductWithRelations } from "@/lib/types";

/**
 * The wishlist.
 *
 * Guests keep it in localStorage. Signed-in customers keep it in the
 * database, and anything saved while signed out is merged up on sign-in, so
 * nobody loses the piece they saved before making an account.
 */

const STORAGE_KEY = "karthika.wishlist.v1";

interface WishlistContextValue {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (product: Pick<ProductWithRelations, "id">) => void;
  remove: (productId: string) => void;
  count: number;
  hydrated: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
  }, [ids, hydrated]);

  // On sign-in, push anything saved as a guest and adopt the merged list.
  useEffect(() => {
    if (authLoading || !user || !hydrated) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "merge", productIds: readStorage() }),
        });
        if (!response.ok) return;

        const data = (await response.json()) as { productIds?: string[] };
        if (!cancelled && Array.isArray(data.productIds)) setIds(data.productIds);
      } catch {
        // Offline, or the account API is unavailable. The local list stands.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, hydrated]);

  const persist = useCallback(
    (action: "add" | "remove", productId: string) => {
      if (!user) return;
      void fetch("/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, productId }),
      }).catch(() => {
        // The optimistic local change stays; it will merge on next sign-in.
      });
    },
    [user],
  );

  const toggle = useCallback(
    (product: Pick<ProductWithRelations, "id">) => {
      setIds((current) => {
        const saved = current.includes(product.id);
        persist(saved ? "remove" : "add", product.id);
        return saved
          ? current.filter((id) => id !== product.id)
          : [product.id, ...current];
      });
    },
    [persist],
  );

  const remove = useCallback(
    (productId: string) => {
      setIds((current) => current.filter((id) => id !== productId));
      persist("remove", productId);
    },
    [persist],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      has: (productId: string) => ids.includes(productId),
      toggle,
      remove,
      hydrated,
    }),
    [ids, toggle, remove, hydrated],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
