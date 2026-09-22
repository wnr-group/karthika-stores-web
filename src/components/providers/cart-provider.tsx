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

import { commerce } from "@/lib/site";
import type { ProductImage, ProductWithRelations } from "@/lib/types";

/**
 * The bag.
 *
 * Stored in localStorage so it survives a refresh and works for guests. What
 * is stored is a *display snapshot*: enough to draw the drawer instantly
 * without a round trip. The prices in it are never trusted. Checkout sends
 * only product ids and quantities, and the server re-reads every price from
 * the catalogue before it charges anyone. See `lib/cart/price.ts`.
 */

const STORAGE_KEY = "karthika.bag.v1";

export interface BagLine {
  productId: string;
  slug: string;
  name: string;
  fabric: string;
  color: string;
  image: ProductImage;
  /** Display only. The server re-prices at checkout. */
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface CartContextValue {
  lines: BagLine[];
  count: number;
  /** Display subtotal. Indicative until the server prices the order. */
  subtotal: number;
  isOpen: boolean;
  hydrated: boolean;
  add: (product: ProductWithRelations, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  openBag: () => void;
  closeBag: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): BagLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is BagLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as BagLine).productId === "string" &&
        typeof (line as BagLine).quantity === "number",
    );
  } catch {
    // Corrupt or blocked storage should never take the site down.
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount so the server and client render the same first pass.
  useEffect(() => {
    setLines(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private browsing with storage disabled. The bag just will not persist.
    }
  }, [lines, hydrated]);

  // A bag opened in one tab should be the bag you see in the other.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setLines(readStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((product: ProductWithRelations, quantity = 1) => {
    setLines((current) => {
      const ceiling = Math.min(commerce.maxLineQuantity, Math.max(1, product.stockQuantity));
      const existing = current.find((line) => line.productId === product.id);

      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(ceiling, line.quantity + quantity) }
            : line,
        );
      }

      const image = product.images[0]!;
      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          fabric: product.fabric,
          color: product.color,
          image,
          price: product.price,
          quantity: Math.min(ceiling, quantity),
          maxQuantity: ceiling,
        },
      ];
    });

    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.min(line.maxQuantity, quantity) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce((total, line) => total + line.price * line.quantity, 0);

    return {
      lines,
      count,
      subtotal,
      isOpen,
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
      openBag: () => setIsOpen(true),
      closeBag: () => setIsOpen(false),
    };
  }, [lines, isOpen, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
