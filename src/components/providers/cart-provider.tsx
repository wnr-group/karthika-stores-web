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
import type { ProductImage, ProductVariant, ProductWithRelations } from "@/lib/types";

/**
 * The bag.
 *
 * Stored in localStorage so it survives a refresh and works for guests. What
 * is stored is a *display snapshot*: enough to draw the drawer instantly
 * without a round trip. The prices in it are never trusted. Checkout sends
 * only product ids, variant ids and quantities, and the server re-reads every
 * price from the catalogue before it charges anyone. See `lib/cart/price.ts`.
 *
 * A line is one product in one option (size, colour...): the same saree in
 * two sizes is two lines. Lines are addressed by `bagLineKey`.
 */

const STORAGE_KEY = "karthika.bag.v1";

export interface BagLine {
  productId: string;
  /** Absent on lines saved before options were chosen; the server then picks one. */
  variantId?: string;
  /** "M / Indigo". Absent for a product without options. */
  variantTitle?: string;
  vendorId: string;
  slug: string;
  name: string;
  subtitle: string;
  color: string;
  image: ProductImage;
  /** Display only. The server re-prices at checkout. */
  price: number;
  quantity: number;
  maxQuantity: number;
  /** Sarees get the stitching and weaver's-note copy in the bag; nothing else does. */
  isSaree?: boolean;
}

interface CartContextValue {
  lines: BagLine[];
  count: number;
  /** Display subtotal. Indicative until the server prices the order. */
  subtotal: number;
  isOpen: boolean;
  hydrated: boolean;
  /** `variant` is the chosen option; ignored for a product without options. */
  add: (product: ProductWithRelations, quantity?: number, variant?: ProductVariant) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openBag: () => void;
  closeBag: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function bagLineKey(line: { productId: string; variantId?: string }): string {
  return `${line.productId}|${line.variantId ?? ""}`;
}

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

  const add = useCallback((product: ProductWithRelations, quantity = 1, variant?: ProductVariant) => {
    setLines((current) => {
      // Only products with options record one; a plain product has a single
      // variant the server finds itself, so its lines match bags saved earlier.
      const chosen = product.options.length ? variant : undefined;
      const stock = chosen && product.trackInventory ? chosen.stockQuantity : product.stockQuantity;
      const ceiling = Math.min(commerce.maxLineQuantity, Math.max(1, stock));
      const key = bagLineKey({ productId: product.id, variantId: chosen?.id });
      const existing = current.find((line) => bagLineKey(line) === key);

      if (existing) {
        return current.map((line) =>
          bagLineKey(line) === key
            ? { ...line, quantity: Math.min(ceiling, line.quantity + quantity) }
            : line,
        );
      }

      const image = product.images[0]!;
      return [
        ...current,
        {
          productId: product.id,
          variantId: chosen?.id,
          variantTitle: chosen?.title,
          vendorId: product.vendorId,
          slug: product.slug,
          name: product.name,
          subtitle: product.subtitle,
          color: product.color,
          image,
          price: chosen?.price ?? product.price,
          quantity: Math.min(ceiling, quantity),
          maxQuantity: ceiling,
          isSaree: product.categoryTrail.some((category) => category.slug === "sarees"),
        },
      ];
    });

    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => bagLineKey(line) !== key)
        : current.map((line) =>
            bagLineKey(line) === key
              ? { ...line, quantity: Math.min(line.maxQuantity, quantity) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((current) => current.filter((line) => bagLineKey(line) !== key));
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
