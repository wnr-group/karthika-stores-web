"use client";

import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * The wishlist heart.
 *
 * Two treatments: `overlay` sits on a product image, `inline` sits beside the
 * add-to-bag button on the product page. The heart fills and gives one small
 * pulse; it does not bounce.
 */
export function WishlistButton({
  productId,
  productName,
  variant = "overlay",
  className,
}: {
  productId: string;
  productName: string;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const { has, toggle, hydrated } = useWishlist();
  const { toast } = useToast();
  const [pulsing, setPulsing] = useState(false);

  // Before hydration the saved state is unknown, so render the outline. This
  // keeps the server and client markup identical.
  const saved = hydrated && has(productId);

  function onClick(event: React.MouseEvent) {
    // Cards wrap the whole tile in a link.
    event.preventDefault();
    event.stopPropagation();

    toggle({ id: productId });
    if (!saved) {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 320);
    }
    toast(saved ? `Removed ${productName} from your wishlist` : `Saved ${productName}`, "success");
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "flex h-12 items-center justify-center gap-2.5 border border-stone px-6 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors duration-[240ms] hover:border-ink",
          className,
        )}
      >
        <HeartIcon
          filled={saved}
          className={cn(
            "h-4 w-4 transition-transform duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
            saved && "text-terracotta",
            pulsing && "scale-125",
          )}
        />
        {saved ? "Saved" : "Add to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName}`}
      aria-pressed={saved}
      className={cn(
        "absolute right-3 top-3 z-10 p-1.5 text-ink/70 transition-colors duration-[240ms] hover:text-ink",
        className,
      )}
    >
      <HeartIcon
        filled={saved}
        className={cn(
          "h-[1.15rem] w-[1.15rem] drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)] transition-transform duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          saved && "text-terracotta",
          pulsing && "scale-125",
        )}
      />
    </button>
  );
}
