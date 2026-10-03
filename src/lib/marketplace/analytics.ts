/**
 * Dashboard arithmetic. Pure functions over lists the repository returns, so
 * the admin and vendor dashboards compute GMV, revenue and trends the same
 * way whichever repository is behind them.
 */

import { istDate } from "@/lib/marketplace/booking";
import type { Booking, Order, VendorOrder } from "@/lib/types";

const DAY = 86_400_000;

export interface SeriesPoint {
  date: string;
  value: number;
}

/** One point per IST day for the last `days` days, oldest first, zero-filled. */
export function dailySeries<T>(
  items: T[],
  dateOf: (item: T) => string,
  valueOf: (item: T) => number,
  days: number,
  now = Date.now(),
): SeriesPoint[] {
  const buckets = new Map<string, number>();
  for (let offset = days - 1; offset >= 0; offset -= 1) buckets.set(istDate(now - offset * DAY), 0);
  for (const item of items) {
    const key = istDate(dateOf(item));
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + valueOf(item));
  }
  return [...buckets.entries()].map(([date, value]) => ({ date, value }));
}

/** Folds daily points into weeks, for longer ranges. */
export function weekly(points: SeriesPoint[]): SeriesPoint[] {
  const weeks: SeriesPoint[] = [];
  for (let index = 0; index < points.length; index += 7) {
    const chunk = points.slice(index, index + 7);
    weeks.push({ date: chunk[0]!.date, value: chunk.reduce((sum, point) => sum + point.value, 0) });
  }
  return weeks;
}

export interface WindowComparison {
  current: number;
  previous: number;
  /** Fractional change, e.g. 0.12 for +12%. Null when there is no baseline. */
  change: number | null;
}

/** The last `days` days against the `days` before them. */
export function compareWindows<T>(
  items: T[],
  dateOf: (item: T) => string,
  valueOf: (item: T) => number,
  days: number,
  now = Date.now(),
): WindowComparison {
  const start = now - days * DAY;
  const previousStart = start - days * DAY;
  let current = 0;
  let previous = 0;
  for (const item of items) {
    const at = Date.parse(dateOf(item));
    if (at >= start && at <= now) current += valueOf(item);
    else if (at >= previousStart && at < start) previous += valueOf(item);
  }
  return { current, previous, change: previous > 0 ? (current - previous) / previous : null };
}

export function topBy<T>(items: T[], keyOf: (item: T) => string, valueOf: (item: T) => number, limit = 5) {
  const totals = new Map<string, { key: string; value: number; count: number; sample: T }>();
  for (const item of items) {
    const key = keyOf(item);
    const entry = totals.get(key) ?? { key, value: 0, count: 0, sample: item };
    entry.value += valueOf(item);
    entry.count += 1;
    totals.set(key, entry);
  }
  return [...totals.values()].sort((a, b) => b.value - a.value).slice(0, limit);
}

/* -------------------------------------------------------------------------
   Marketplace definitions, in one place

   GMV       every rupee customers committed, orders and bookings, less cancellations
   Revenue   what the platform keeps: commission
   Earnings  what a vendor keeps: GMV less commission
   ------------------------------------------------------------------------- */

export const countsTowardGmv = (status: string) => status !== "cancelled";

export function orderGmv(order: Order): number {
  return countsTowardGmv(order.status) ? order.totalAmount : 0;
}

export function vendorOrderGmv(vendorOrder: VendorOrder): number {
  return countsTowardGmv(vendorOrder.status) && vendorOrder.status !== "returned" ? vendorOrder.total : 0;
}

export function vendorOrderCommission(vendorOrder: VendorOrder): number {
  return countsTowardGmv(vendorOrder.status) && vendorOrder.status !== "returned" ? vendorOrder.commissionAmount : 0;
}

export function bookingGmv(booking: Booking): number {
  return countsTowardGmv(booking.status) ? booking.total : 0;
}

export function bookingCommission(booking: Booking): number {
  return countsTowardGmv(booking.status) ? booking.commissionAmount : 0;
}

export function formatChange(change: number | null): string {
  if (change === null) return "New";
  const percent = Math.round(change * 100);
  return `${percent > 0 ? "+" : ""}${percent}%`;
}

/** Compact rupees for KPI tiles: Rs 4.2L, Rs 1.3Cr. */
export function formatCompactInr(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs >= 1e8 ? 1 : 2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs >= 1e6 ? 1 : 2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}
