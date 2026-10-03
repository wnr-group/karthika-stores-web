import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared pieces for the admin and vendor dashboards: the page frame with its
 * side navigation, stat tiles, and a plain table header.
 */

export function DashboardFrame({
  title,
  subtitle,
  nav,
  banner,
  aside,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  nav: Array<{ label: string; href: string }>;
  banner?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      {banner}
      <div className="flex flex-col gap-4 border-b border-stone pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[2.25rem] font-medium leading-tight text-ink md:text-[2.75rem]">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-[0.875rem] text-taupe">{subtitle}</p> : null}
        </div>
        {aside}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <nav aria-label={`${title} sections`} className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:pb-0">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block whitespace-nowrap rounded-full px-4 py-2 text-[0.875rem] text-graphite transition-colors hover:bg-shell hover:text-ink lg:rounded-xl"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <p className="mb-8 rounded-xl bg-shell px-4 py-3 text-[0.8125rem] leading-relaxed text-graphite">
      <span className="font-medium text-ink">Demo mode.</span> {children}
    </p>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</dl>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone bg-paper p-5">
      <dt className="text-[0.75rem] text-taupe">{label}</dt>
      <dd className="tnum mt-2 font-display text-[1.875rem] font-medium leading-none text-ink">{value}</dd>
      {hint ? <dd className="mt-2 text-[0.75rem] text-taupe">{hint}</dd> : null}
    </div>
  );
}

export function SectionTitle({ title, meta, className }: { title: string; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-4 border-b border-stone pb-3", className)}>
      <h2 className="font-display text-[1.5rem] font-medium text-ink">{title}</h2>
      {meta ? <p className="text-[0.75rem] text-taupe">{meta}</p> : null}
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("py-3 pr-4 text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-taupe", className)}>
      {children}
    </th>
  );
}

const PILL_TONE: Record<string, string> = {
  approved: "bg-shell text-forest-soft",
  delivered: "bg-shell text-forest-soft",
  completed: "bg-shell text-forest-soft",
  shipped: "bg-shell text-forest-soft",
  new: "bg-sandal/50 text-brand-deep",
  pending: "bg-sandal/50 text-brand-deep",
  processing: "bg-sandal/50 text-brand-deep",
  draft: "bg-stone-soft text-taupe",
  archived: "bg-stone-soft text-taupe",
  cancelled: "bg-[#f5e1dc] text-danger",
  rejected: "bg-[#f5e1dc] text-danger",
  suspended: "bg-[#f5e1dc] text-danger",
};

/** A small status pill. Unknown statuses fall back to grey. */
export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-[0.6875rem] capitalize",
        PILL_TONE[status] ?? "bg-stone-soft text-taupe",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
