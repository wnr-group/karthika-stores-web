"use client";

import Link from "next/link";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/providers/cart-provider";
import { Drawer } from "@/components/ui/drawer";
import { Media, ratio } from "@/components/ui/media";
import { commerce } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";

/**
 * The bag drawer. Opens whenever something is added, so the customer stays on
 * the page they were browsing.
 */
export function CartDrawer() {
  const { lines, subtotal, count, isOpen, closeBag, setQuantity, remove } = useCart();

  const remaining = Math.max(0, commerce.freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / commerce.freeShippingThreshold) * 100);

  return (
    <Drawer
      open={isOpen}
      onClose={closeBag}
      title={`Your bag${count ? ` (${count})` : ""}`}
      footer={
        lines.length > 0 ? (
          <div className="px-5 py-5 md:px-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-taupe">
                Subtotal
              </span>
              <span className="tnum text-base text-ink">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1.5 text-[0.6875rem] text-taupe">
              Shipping calculated at checkout. Duties, where they apply, are included.
            </p>

            <Link
              href="/checkout"
              onClick={closeBag}
              className="mt-5 flex h-12 w-full items-center justify-center bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-[240ms] hover:bg-terracotta-deep"
            >
              Proceed to checkout
            </Link>

            <Link
              href="/cart"
              onClick={closeBag}
              className="mt-3 flex h-11 w-full items-center justify-center border border-stone text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors duration-[240ms] hover:border-ink"
            >
              View bag
            </Link>
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <EmptyBag onClose={closeBag} />
      ) : (
        <>
          {/* Free shipping progress */}
          <div className="border-b border-stone px-5 py-4 md:px-6">
            {remaining > 0 ? (
              <p className="text-[0.75rem] text-taupe">
                <span className="tnum text-ink">{formatPrice(remaining)}</span> more for
                complimentary shipping
              </p>
            ) : (
              <p className="text-[0.75rem] text-success">Shipping is on us.</p>
            )}
            <div className="mt-2.5 h-px w-full bg-stone">
              <div
                className="h-px bg-ink transition-[width] duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-stone-soft">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-4 px-5 py-5 md:px-6">
                <Link
                  href={`/product/${line.slug}`}
                  onClick={closeBag}
                  className={cn("relative w-20 shrink-0 overflow-hidden", ratio.product)}
                >
                  <Media image={line.image} className="absolute inset-0" sizes="80px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/product/${line.slug}`}
                      onClick={closeBag}
                      className="font-display text-[1.0625rem] leading-snug text-ink"
                    >
                      {line.name}
                    </Link>
                    <span className="tnum shrink-0 text-[0.8125rem] text-ink">
                      {formatPrice(line.price * line.quantity)}
                    </span>
                  </div>

                  <p className="mt-1 text-[0.75rem] text-taupe">
                    {line.fabric} &middot; {line.color}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <QuantityStepper
                      value={line.quantity}
                      max={line.maxQuantity}
                      onChange={(next) => setQuantity(line.productId, next)}
                      label={line.name}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="px-5 py-6 md:px-6">
            <ul className="space-y-1.5 text-[0.6875rem] text-taupe">
              <li>Wrapped in a cotton bag with the weaver&rsquo;s note</li>
              <li>Free returns within 7 days, unworn</li>
              <li>Fall, pico and blouse stitching on request</li>
            </ul>
          </div>
        </>
      )}
    </Drawer>
  );
}

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <svg
        aria-hidden
        viewBox="0 0 120 60"
        className="mb-8 h-12 w-24 text-stone"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M2 44c14-26 28-26 42 0s28 26 42 0 20-22 32-8" />
      </svg>

      <p className="display-sm">Your bag is empty</p>
      <p className="mt-3 max-w-xs text-[0.8125rem] text-taupe">
        Nothing here yet. The new season is a reasonable place to start.
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <Link
          href="/shop"
          onClick={onClose}
          className="border border-ink px-8 py-3 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Browse sarees
        </Link>
        <Link
          href="/collections/the-new-season"
          onClick={onClose}
          className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]"
        >
          The new season
        </Link>
      </div>
    </div>
  );
}
