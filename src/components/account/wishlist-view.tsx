"use client";

import { useEffect, useState } from "react";

import { ProductGrid } from "@/components/product/product-card";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { Media, ratio } from "@/components/ui/media";
import { EmptyState } from "@/components/ui/primitives";
import type { ProductImage, ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UnavailableProduct {
  id: string;
  name: string;
  image: ProductImage | null;
}

/**
 * The wishlist.
 *
 * Ids live in the browser (and in the database once signed in); the details
 * are fetched fresh so a saved piece shows its current price and whether it
 * has sold since. Pieces taken out of the shop since they were saved are
 * listed apart, without Add to bag, so they can be cleared.
 */
export function WishlistView() {
  const { ids, hydrated, remove } = useWishlist();
  const [products, setProducts] = useState<ProductWithRelations[] | null>(null);
  const [unavailable, setUnavailable] = useState<UnavailableProduct[]>([]);

  useEffect(() => {
    if (!hydrated) return;

    if (ids.length === 0) {
      setProducts([]);
      setUnavailable([]);
      return;
    }

    let cancelled = false;

    fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}`)
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data: { products: ProductWithRelations[]; unavailable?: UnavailableProduct[] }) => {
        if (cancelled) return;
        setProducts(data.products);
        setUnavailable(data.unavailable ?? []);
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

  if (products.length === 0 && unavailable.length === 0) {
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
      {products.length > 0 ? (
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
      ) : null}

      {unavailable.length > 0 ? (
        <section className={cn(products.length > 0 && "mt-16 border-t border-stone pt-10")}>
          <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">No longer available</h2>
          <p className="mt-2 text-[0.8125rem] text-taupe">
            These pieces have been taken out of the shop since you saved them.
          </p>
          <ul className="mt-6 divide-y divide-stone border-y border-stone">
            {unavailable.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                {item.image ? (
                  <div className={cn("relative w-14 shrink-0 overflow-hidden opacity-60", ratio.product)}>
                    <Media image={item.image} className="absolute inset-0" sizes="56px" />
                  </div>
                ) : null}
                <p className="min-w-0 flex-1 font-display text-[1rem] leading-snug text-taupe">{item.name}</p>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
