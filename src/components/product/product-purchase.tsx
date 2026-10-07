"use client";

import { useState, type ReactNode } from "react";

import { AddToBag } from "@/components/product/add-to-bag";
import { Price, StockNote } from "@/components/ui/primitives";
import type { ProductVariant, ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Price, stock, option picker and Add to bag on the product page.
 *
 * One picker row per option (Size, Colour...). The price, the stock note and
 * what Add to bag adds all follow the chosen combination, since each
 * combination has its own price and stock. A product without options shows
 * no picker and behaves as before.
 */

function inStock(product: ProductWithRelations, variant: ProductVariant): boolean {
  return variant.isActive && (!product.trackInventory || variant.stockQuantity > 0);
}

function matches(variant: ProductVariant, choice: Record<string, string>): boolean {
  return Object.entries(choice).every(([name, value]) => variant.options[name] === value);
}

/** Opens on the first combination that can be bought, else the first one sold. */
function initialChoice(product: ProductWithRelations): Record<string, string> {
  const start =
    product.variants.find((variant) => inStock(product, variant)) ??
    product.variants.find((variant) => variant.isActive) ??
    product.variants[0];
  return { ...(start?.options ?? {}) };
}

export function ProductPurchase({
  product,
  children,
}: {
  product: ProductWithRelations;
  /** Sits beside Add to bag, e.g. the wishlist button. */
  children?: ReactNode;
}) {
  const [choice, setChoice] = useState<Record<string, string>>(() => initialChoice(product));

  const hasOptions = product.options.length > 0;
  const selected = hasOptions
    ? (product.variants.find((variant) => variant.isActive && matches(variant, choice)) ?? null)
    : undefined;

  const price = selected?.price ?? product.price;
  const compareAt = selected ? selected.compareAtPrice : product.compareAtPrice;
  const stock = selected && product.trackInventory ? selected.stockQuantity : product.stockQuantity;

  return (
    <>
      <Price amount={price} compareAt={compareAt} size="lg" className="mt-5" />

      {hasOptions ? (
        <div className="mt-7 space-y-5">
          {product.options.map((option) => (
            <fieldset key={option.name}>
              <legend className="text-[0.6875rem] uppercase tracking-[0.16em] text-taupe">
                {option.name}: <span className="text-ink">{choice[option.name] ?? "Choose"}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const next = { ...choice, [option.name]: value };
                  const available = product.variants.some(
                    (variant) => matches(variant, next) && inStock(product, variant),
                  );
                  const active = choice[option.name] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      aria-label={`${option.name} ${value}${available ? "" : ", sold out"}`}
                      onClick={() => setChoice(next)}
                      className={cn(
                        "min-w-12 border px-4 py-2.5 text-[0.8125rem] transition-colors duration-[240ms]",
                        active ? "border-ink bg-ink text-paper" : "border-stone text-ink hover:border-ink",
                        !available && !active && "text-taupe-soft line-through",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-graphite">
        {product.shortDescription}
      </p>

      {hasOptions && !selected ? (
        <p className="mt-5 text-[0.6875rem] uppercase tracking-[0.16em] text-taupe">
          This combination is not available
        </p>
      ) : (
        <StockNote quantity={stock} className="mt-5" />
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <AddToBag product={product} selected={selected} className="flex-1" />
        {children}
      </div>
    </>
  );
}
