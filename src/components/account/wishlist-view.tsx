"use client";

import { useEffect, useState } from "react";

import { ProductGrid } from "@/components/product/product-card";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { EmptyState } from "@/components/ui/primitives";
import type { ProductWithRelations } from "@/lib/types";

/**
 * The wishlist.
 *
 * Ids live in the browser (and in the database once signed in); the details
 * are fetched fresh so a saved piece shows its current price and whether it
 * has sold since.
 */
export function WishlistView() {
  const { ids, hydrated } = useWishlist();
  const [products, setProducts] = useState<ProductWithRelations[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}`)
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data: { products: ProductWithRelations[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [ids, hydrated]);

  if (!hydrated || products === null) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8">
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <div className="aspect-[3/4] animate-pulse bg-shell" />
            <div className="mt-4 h-4 w-2/3 animate-pulse bg-shell" />
            <div className="mt-2 h-3 w-1/3 animate-pulse bg-shell" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        eyebrow="Wishlist"
        title="Nothing saved yet"
        body="Tap the heart on anything you want to think about. It will be here when you come back, on this device or any other once you sign in."
        action={{ label: "Browse sarees", href: "/shop" }}
        secondary={{ label: "The new season", href: "/collections/the-new-season" }}
      />
    );
  }

  return (
    <>
      <p className="mb-8 text-[0.75rem] text-taupe">
        {products.length} {products.length === 1 ? "piece" : "pieces"} saved
      </p>
      <ProductGrid
        products={products}
        sizes="(min-width: 1024px) 30vw, 45vw"
        className="md:grid-cols-3"
      />
    </>
  );
}
