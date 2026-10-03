"use client";

import Link from "next/link";
import { useRef } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ArrowRightIcon, BagIcon } from "@/components/ui/icons";
import { Media } from "@/components/ui/media";
import type { ProductWithRelations } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * The new-arrivals rail on the dark green band: white square tiles, light
 * type beneath, a bag button that adds one to the bag, and a pair of arrows
 * that page the row sideways.
 */
export function ArrivalRail({ products }: { products: ProductWithRelations[] }) {
  const track = useRef<HTMLDivElement>(null);
  const { add, openBag } = useCart();
  const { toast } = useToast();

  function page(direction: 1 | -1) {
    const node = track.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  }

  function addToBag(product: ProductWithRelations) {
    add(product, 1);
    toast(`${product.name} added to your bag`, "success");
    openBag();
  }

  return (
    <>
      <div className="mt-6 flex justify-end gap-3 text-paper/70">
        <button
          type="button"
          onClick={() => page(-1)}
          aria-label="Previous products"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/25 transition-colors hover:border-paper hover:text-paper"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          aria-label="Next products"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-paper/25 transition-colors hover:border-paper hover:text-paper"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={track}
        className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 md:gap-6"
      >
        {products.map((product) => {
          const image = product.images[0];
          const soldOut = product.stockQuantity <= 0;

          return (
            <article
              key={product.id}
              className="w-[70%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[calc((100%-4.5rem)/4)]"
            >
              <Link href={`/product/${product.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper">
                  {image ? (
                    <Media
                      image={image}
                      sizes="(min-width: 1024px) 23vw, (min-width: 768px) 30vw, 70vw"
                      className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
              </Link>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.625rem] uppercase tracking-[0.18em] text-sandal/80">
                    {product.category.name}
                  </p>
                  <h3 className="mt-1.5 truncate font-sans text-[0.9375rem] font-medium text-paper">
                    <Link href={`/product/${product.slug}`} className="hover:text-sandal">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="tnum mt-1 text-[0.8125rem] text-paper/70">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToBag(product)}
                  disabled={soldOut}
                  aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
                  className="mt-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-paper/25 text-paper/80 transition-colors hover:border-sandal hover:bg-sandal hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <BagIcon className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
