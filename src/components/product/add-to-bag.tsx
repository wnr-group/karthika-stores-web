"use client";

import { useState } from "react";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { commerce } from "@/lib/site";
import type { ProductVariant, ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Add to bag, in two shapes.
 *
 * `full` is the product page: a quantity stepper and a wide button, adding
 * the option chosen in the picker (`selected`).
 * `quick` is the hover control on a product card, which adds one and opens
 * the drawer without leaving the grid. A product with options has nothing to
 * add from there, so it sends the shopper to the product page to choose.
 */

export function AddToBag({
  product,
  variant = "full",
  selected,
  className,
}: {
  product: ProductWithRelations;
  variant?: "full" | "quick";
  /** The chosen option. `null` when the chosen combination is not sold. */
  selected?: ProductVariant | null;
  className?: string;
}) {
  const { add } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const hasOptions = product.options.length > 0;
  const unavailable = hasOptions && variant === "full" && !selected;
  const stock = selected && product.trackInventory ? selected.stockQuantity : product.stockQuantity;
  const soldOut = !unavailable && stock <= 0;
  const ceiling = Math.min(commerce.maxLineQuantity, Math.max(1, stock));
  const shown = Math.min(quantity, ceiling);

  function onAdd(event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (soldOut || unavailable) return;

    add(product, variant === "quick" ? 1 : shown, selected ?? undefined);
    toast(
      `${product.name}${hasOptions && selected ? ` (${selected.title})` : ""} added to your bag`,
      "success",
    );
  }

  if (variant === "quick" && hasOptions) {
    // Not a button: the click falls through to the card's link.
    return (
      <span
        className={cn(
          "block w-full bg-paper/95 py-3 text-center text-[0.625rem] uppercase tracking-[0.18em] text-ink backdrop-blur-[2px] transition-colors duration-[240ms] hover:bg-ink hover:text-paper",
          className,
        )}
      >
        Choose options
      </span>
    );
  }

  if (variant === "quick") {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={soldOut}
        className={cn(
          "w-full bg-paper/95 py-3 text-[0.625rem] uppercase tracking-[0.18em] text-ink backdrop-blur-[2px] transition-colors duration-[240ms] hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:text-taupe-soft disabled:hover:bg-paper/95 disabled:hover:text-taupe-soft",
          className,
        )}
      >
        {soldOut ? "Sold out" : "Add to bag"}
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
      {!soldOut && !unavailable ? (
        <QuantityStepper
          value={shown}
          max={ceiling}
          onChange={setQuantity}
          label={product.name}
          className="h-12 shrink-0"
        />
      ) : null}

      <button
        type="button"
        onClick={() => onAdd()}
        disabled={soldOut || unavailable}
        // flex-1 only once the row is horizontal: in the stacked phone layout
        // its zero basis collapsed the button's height to a thin strip.
        className="flex h-12 shrink-0 items-center justify-center bg-ink px-8 sm:flex-1 text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-[240ms] hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:bg-sand disabled:text-taupe"
      >
        {unavailable ? "Unavailable" : soldOut ? "Sold out" : "Add to bag"}
      </button>
    </div>
  );
}
