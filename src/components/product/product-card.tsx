import Link from "next/link";

import { AddToBag } from "@/components/product/add-to-bag";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Media, ratio } from "@/components/ui/media";
import { Price } from "@/components/ui/primitives";
import type { ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The product card.
 *
 * A server component: only the heart and the quick-add are client code. On
 * hover the second image crossfades in and the frame zooms very slightly, and
 * the quick-add slides up from the bottom edge. Nothing else moves.
 */

interface ProductCardProps {
  product: ProductWithRelations;
  /** Fed to next/image. Set it to match the grid the card sits in. */
  sizes?: string;
  priority?: boolean;
  /** Larger type and image, for the first tile of an asymmetric block. */
  featured?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw",
  priority = false,
  featured = false,
  className,
}: ProductCardProps) {
  const [primary, secondary] = product.images;
  const soldOut = product.stockQuantity <= 0;

  return (
    <article className={cn("group relative", className)}>
      <WishlistButton productId={product.id} productName={product.name} />

      <Link href={`/product/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-shell",
            featured ? ratio.portrait : ratio.product,
          )}
        >
          <Media
            image={primary!}
            priority={priority}
            sizes={sizes}
            className={cn(
              "absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              secondary ? "group-hover:scale-[1.03]" : "group-hover:scale-[1.04]",
            )}
          />

          {secondary ? (
            <Media
              image={secondary}
              sizes={sizes}
              className="absolute inset-0 opacity-0 transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:opacity-100"
            />
          ) : null}

          {/* Status. One label at most, top left. */}
          {soldOut ? (
            <span className="absolute left-0 top-3 bg-paper/95 px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.18em] text-taupe">
              Sold out
            </span>
          ) : product.isNew ? (
            <span className="absolute left-0 top-3 bg-paper/95 px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.18em] text-ink">
              New
            </span>
          ) : product.compareAtPrice ? (
            <span className="absolute left-0 top-3 bg-paper/95 px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.18em] text-terracotta">
              Reduced
            </span>
          ) : null}

          {/* Quick add, hidden until hover and never shown on touch. */}
          {!soldOut ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full opacity-0 transition-all duration-[240ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 lg:block">
              <AddToBag product={product} variant="quick" />
            </div>
          ) : null}
        </div>
      </Link>

      <div className="pt-4">
        <h3
          className={cn(
            "font-display leading-snug text-ink",
            featured ? "text-[1.375rem]" : "text-[1.125rem]",
          )}
        >
          <Link href={`/product/${product.slug}`} className="link-quiet">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-[0.75rem] text-taupe">{product.fabric}</p>

        <Price
          amount={product.price}
          compareAt={product.compareAtPrice}
          className="mt-2"
          size={featured ? "base" : "sm"}
        />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------
   Grid
   ------------------------------------------------------------------------- */

export function ProductGrid({
  products,
  className,
  sizes,
  priorityCount = 0,
}: {
  products: ProductWithRelations[];
  className?: string;
  sizes?: string;
  /** How many tiles load eagerly. Two is right for an above-the-fold grid. */
  priorityCount?: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:gap-x-8 lg:gap-y-16",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          sizes={sizes}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
