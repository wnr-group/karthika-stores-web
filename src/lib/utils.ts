import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Rupees, without decimals. Sarees are priced in whole rupees and a trailing
 * ".00" makes a price list look like a spreadsheet.
 */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return inr.format(amount);
}

/** "18,500" without the symbol, for places where the symbol is set separately. */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Title-cases a slug for breadcrumbs and headings. */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** A stable integer from a string, used to vary placeholder composition. */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/** Percentage saved, rounded down, for the rare markdown. */
export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.floor(((compareAt - price) / compareAt) * 100);
}
