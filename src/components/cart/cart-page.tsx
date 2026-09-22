"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/providers/cart-provider";
import { Media, ratio } from "@/components/ui/media";
import { EmptyState } from "@/components/ui/primitives";
import { ReturnIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { commerce } from "@/lib/site";
import type { PricedCart } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

/**
 * The bag page.
 *
 * Renders instantly from local state, then reconciles against the server so
 * prices and stock are correct before anyone reaches checkout. Anything the
 * server changed is said plainly at the top rather than silently applied.
 */
export function CartPage() {
  const { lines, setQuantity, remove, hydrated } = useCart();
  const { toggle } = useWishlist();
  const [priced, setPriced] = useState<PricedCart | null>(null);

  useEffect(() => {
    if (!hydrated || lines.length === 0) {
      setPriced(null);
      return;
    }

    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PricedCart | null) => {
        if (!cancelled) setPriced(data);
      })
      .catch(() => {
        // Offline. Local totals stand, and checkout will price again anyway.
      });

    return () => {
      cancelled = true;
    };
  }, [lines, hydrated]);

  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        eyebrow="Your bag"
        title="Nothing in your bag yet"
        body="When you find something, it will wait here. Your bag is kept on this device, so you can come back to it."
        action={{ label: "Browse sarees", href: "/shop" }}
        secondary={{ label: "The new season", href: "/collections/the-new-season" }}
      />
    );
  }

  // Prefer server numbers the moment they arrive.
  const subtotal = priced?.totals.subtotal ?? lines.reduce((t, l) => t + l.price * l.quantity, 0);
  const shipping = priced?.totals.shipping ?? (subtotal >= commerce.freeShippingThreshold ? 0 : commerce.standardShipping);
  const total = priced?.totals.total ?? subtotal + shipping;
  const remaining = Math.max(0, commerce.freeShippingThreshold - subtotal);

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7 xl:col-span-8">
        {priced && priced.removed.length > 0 ? (
          <div className="mb-8 border border-stone bg-shell/60 px-5 py-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-ink">
              A change to your bag
            </p>
            <ul className="mt-2 space-y-1 text-[0.8125rem] text-graphite">
              {priced.removed.map((entry) => (
                <li key={entry.productId}>
                  {entry.name} &mdash; {entry.reason}.
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className="border-t border-stone">
          {lines.map((line) => {
            const server = priced?.lines.find((entry) => entry.productId === line.productId);
            const unitPrice = server?.unitPrice ?? line.price;
            const maxQuantity = server?.available
              ? Math.min(commerce.maxLineQuantity, server.available)
              : line.maxQuantity;

            return (
              <li key={line.productId} className="flex gap-5 border-b border-stone py-7">
                <Link
                  href={`/product/${line.slug}`}
                  className={cn("relative w-24 shrink-0 overflow-hidden sm:w-32", ratio.product)}
                >
                  <Media image={line.image} className="absolute inset-0" sizes="128px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-[1.25rem] leading-snug text-ink">
                        <Link href={`/product/${line.slug}`} className="link-quiet">
                          {line.name}
                        </Link>
                      </h2>
                      <p className="mt-1.5 text-[0.75rem] text-taupe">
                        {line.fabric} &middot; {line.color}
                      </p>
                    </div>

                    <span className="tnum shrink-0 text-[0.9375rem] text-ink">
                      {formatPrice(unitPrice * line.quantity)}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">
                    <QuantityStepper
                      value={line.quantity}
                      max={maxQuantity}
                      onChange={(next) => setQuantity(line.productId, next)}
                      label={line.name}
                      size="sm"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        toggle({ id: line.productId });
                        remove(line.productId);
                      }}
                      className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      Move to wishlist
                    </button>

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
            );
          })}
        </ul>

        <Link
          href="/shop"
          className="link-quiet mt-8 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
        >
          Continue shopping
        </Link>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-5 xl:col-span-4">
        <div className="sticky top-28 border border-stone bg-paper p-6 md:p-8">
          <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">Order summary</h2>

          <dl className="mt-6 space-y-3 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-taupe">Subtotal</dt>
              <dd className="tnum text-ink">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-taupe">Shipping</dt>
              <dd className="tnum text-ink">
                {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
              </dd>
            </div>
          </dl>

          {remaining > 0 ? (
            <p className="mt-4 border-t border-stone pt-4 text-[0.75rem] text-taupe">
              Spend <span className="tnum text-ink">{formatPrice(remaining)}</span> more for
              complimentary shipping.
            </p>
          ) : null}

          <div className="mt-6 flex items-baseline justify-between border-t border-stone pt-5">
            <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink">
              Estimated total
            </span>
            <span className="tnum text-lg text-ink">{formatPrice(total)}</span>
          </div>

          <p className="mt-1.5 text-[0.6875rem] text-taupe">Inclusive of all taxes.</p>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors duration-[240ms] hover:bg-terracotta-deep"
          >
            Proceed to checkout
          </Link>

          <ul className="mt-7 space-y-3 border-t border-stone pt-6">
            <Reassurance icon={ShieldIcon} text="Secure checkout. UPI, cards, netbanking or cash on delivery." />
            <Reassurance icon={ReturnIcon} text="Seven-day returns, pickup arranged by us." />
            <Reassurance icon={TruckIcon} text="Delivered anywhere in India in three to five days." />
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Reassurance({
  icon: Icon,
  text,
}: {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  text: string;
}) {
  return (
    <li className="flex gap-3 text-[0.75rem] leading-relaxed text-taupe">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </li>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-6 lg:col-span-7 xl:col-span-8">
        {[0, 1].map((index) => (
          <div key={index} className="flex gap-5 border-b border-stone py-7">
            <div className="h-40 w-24 animate-pulse bg-shell sm:w-32" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 w-2/3 animate-pulse bg-shell" />
              <div className="h-3 w-1/3 animate-pulse bg-shell" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="h-72 animate-pulse border border-stone bg-shell/40" />
      </div>
    </div>
  );
}
