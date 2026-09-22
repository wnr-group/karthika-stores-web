import Link from "next/link";
import type { ReactNode } from "react";

import { cn, discountPercent, formatPrice } from "@/lib/utils";

/* -------------------------------------------------------------------------
   Price
   ------------------------------------------------------------------------- */

export function Price({
  amount,
  compareAt = null,
  className,
  size = "base",
}: {
  amount: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "base" | "lg";
}) {
  const off = discountPercent(amount, compareAt);
  const sizes = {
    sm: "text-[0.8125rem]",
    base: "text-sm",
    lg: "text-lg",
  } as const;

  return (
    <span className={cn("tnum inline-flex items-baseline gap-2", sizes[size], className)}>
      <span className="text-ink">{formatPrice(amount)}</span>
      {compareAt ? (
        <>
          <span className="text-taupe-soft line-through">{formatPrice(compareAt)}</span>
          {off ? <span className="text-terracotta text-[0.6875rem]">{off}% off</span> : null}
        </>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Craft tag
   ------------------------------------------------------------------------- */

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block border border-stone px-2 py-1 text-[0.5625rem] uppercase tracking-[0.18em] text-taupe",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Section header
   An eyebrow, a serif title, and an optional link pinned to the right.
   ------------------------------------------------------------------------- */

export function SectionHeader({
  eyebrow,
  title,
  intro,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: { label: string; href: string };
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
        <h2 className="display-md">{title}</h2>
        {intro ? <p className="mt-4 max-w-xl text-taupe">{intro}</p> : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="link-quiet shrink-0 text-[0.6875rem] uppercase tracking-[0.18em]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Empty state
   Used for the empty cart, empty wishlist, no search results and no filter
   matches. Never a blank screen.
   ------------------------------------------------------------------------- */

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
  secondary,
  className,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  action?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-24 text-center", className)}>
      {/* A single drawn line, in place of the usual empty-state illustration. */}
      <svg
        aria-hidden
        viewBox="0 0 120 60"
        className="mb-10 h-14 w-28 text-stone"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M2 44c14-26 28-26 42 0s28 26 42 0 20-22 32-8" />
      </svg>

      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h2 className="display-sm">{title}</h2>
      <p className="measure mt-4 text-sm text-taupe">{body}</p>

      {action || secondary ? (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {action ? (
            <Link
              href={action.href}
              className="border border-ink px-8 py-3 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors duration-[240ms] hover:bg-ink hover:text-paper"
            >
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link
              href={secondary.href}
              className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Breadcrumb
   ------------------------------------------------------------------------- */

export function Breadcrumb({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe">
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden className="text-stone">/</span> : null}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-ink">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------
   Stock note
   ------------------------------------------------------------------------- */

export function StockNote({ quantity, className }: { quantity: number; className?: string }) {
  if (quantity <= 0) {
    return (
      <p className={cn("text-[0.6875rem] uppercase tracking-[0.16em] text-taupe", className)}>
        Sold out
      </p>
    );
  }

  // Only shout about scarcity when it is real. Two left means two left.
  if (quantity <= 2) {
    return (
      <p className={cn("text-[0.6875rem] uppercase tracking-[0.16em] text-terracotta", className)}>
        {quantity === 1 ? "Last piece" : "Two remaining"}
      </p>
    );
  }

  return (
    <p className={cn("text-[0.6875rem] uppercase tracking-[0.16em] text-success", className)}>
      In stock
    </p>
  );
}

/* -------------------------------------------------------------------------
   Field wrapper
   ------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[0.6875rem] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.6875rem] text-taupe">{hint}</p>
      ) : null}
    </div>
  );
}
