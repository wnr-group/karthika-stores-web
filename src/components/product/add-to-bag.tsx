"use client";

import { useState } from "react";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { commerce } from "@/lib/site";
import type { ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Add to bag, in two shapes.
 *
 * `full` is the product page: a quantity stepper and a wide button.
 * `quick` is the hover control on a product card, which adds one and opens
 * the drawer without leaving the grid.
 */

export function AddToBag({
  product,
  variant = "full",
  className,
}: {
  product: ProductWithRelations;
  variant?: "full" | "quick";
  className?: string;
}) {
  const { add } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const soldOut = product.stockQuantity <= 0;
  const ceiling = Math.min(commerce.maxLineQuantity, Math.max(1, product.stockQuantity));

  function onAdd(event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (soldOut) return;

    add(product, variant === "quick" ? 1 : quantity);
    toast(`${product.name} added to your bag`, "success");
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
      {!soldOut ? (
        <QuantityStepper
          value={quantity}
          max={ceiling}
          onChange={setQuantity}
          label={product.name}
          className="h-12 shrink-0"
        />
      ) : null}

      <button
        type="button"
        onClick={() => onAdd()}
        disabled={soldOut}
        className="flex h-12 flex-1 items-center justify-center bg-ink px-8 text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-[240ms] hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:bg-sand disabled:text-taupe"
      >
        {soldOut ? "Sold out" : "Add to bag"}
      </button>
    </div>
  );
}
