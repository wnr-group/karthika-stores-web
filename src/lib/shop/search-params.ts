import type { Occasion, ProductQuery, SortKey, Tone } from "@/lib/types";
import { commerce } from "@/lib/site";

/**
 * The listing page keeps all of its state in the URL, so a filtered view can
 * be shared, bookmarked and rendered on the server. This module is the only
 * place that knows the parameter names.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

const TONES: Tone[] = [
  "ivory",
  "sand",
  "terracotta",
  "maroon",
  "olive",
  "indigo",
  "saffron",
  "rose",
  "charcoal",
  "teal",
];

const OCCASIONS: Occasion[] = ["everyday", "work", "festive", "ceremony", "wedding"];

/** Reads a repeatable parameter, accepting both `?f=a&f=b` and `?f=a,b`. */
function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function integer(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export interface ParsedShopParams {
  query: ProductQuery;
  /** Echoed back into the filter UI so checkboxes stay ticked. */
  selected: {
    categories: string[];
    collections: string[];
    fabrics: string[];
    tones: Tone[];
    occasions: Occasion[];
    minPrice?: number;
    maxPrice?: number;
    inStockOnly: boolean;
    sort: SortKey;
    page: number;
    search?: string;
  };
}

/**
 * Turns URL parameters into a repository query. Unknown values are dropped
 * rather than passed through, so a hand-edited URL cannot reach the database
 * with junk in it.
 */
export function parseShopParams(
  params: RawSearchParams,
  overrides: { categorySlug?: string; collectionSlug?: string } = {},
): ParsedShopParams {
  const categories = overrides.categorySlug
    ? [overrides.categorySlug]
    : list(params.category);

  const collections = overrides.collectionSlug
    ? [overrides.collectionSlug]
    : list(params.collection);

  const fabrics = list(params.fabric);
  const tones = list(params.colour).filter((value): value is Tone =>
    TONES.includes(value as Tone),
  );
  const occasions = list(params.occasion).filter((value): value is Occasion =>
    OCCASIONS.includes(value as Occasion),
  );

  const minPrice = integer(params.minPrice);
  const maxPrice = integer(params.maxPrice);
  const inStockOnly = first(params.availability) === "in-stock";

  const sortRaw = first(params.sort) as SortKey | undefined;
  const sort: SortKey = sortRaw && SORT_KEYS.includes(sortRaw) ? sortRaw : "featured";

  const page = Math.max(1, integer(params.page) ?? 1);
  const search = first(params.q)?.trim() || undefined;

  return {
    query: {
      categorySlugs: categories.length ? categories : undefined,
      collectionSlugs: collections.length ? collections : undefined,
      fabrics: fabrics.length ? fabrics : undefined,
      tones: tones.length ? tones : undefined,
      occasions: occasions.length ? occasions : undefined,
      minPrice,
      // Guard against ?minPrice=90000&maxPrice=1 returning nothing silently.
      maxPrice: maxPrice !== undefined && minPrice !== undefined && maxPrice < minPrice
        ? undefined
        : maxPrice,
      inStockOnly: inStockOnly || undefined,
      search,
      sort,
      page,
      perPage: commerce.productsPerPage,
    },
    selected: {
      categories,
      collections,
      fabrics,
      tones,
      occasions,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      page,
      search,
    },
  };
}

/** How many filters are on, for the "Filters (3)" label and the clear button. */
export function countActiveFilters(selected: ParsedShopParams["selected"]): number {
  return (
    selected.categories.length +
    selected.collections.length +
    selected.fabrics.length +
    selected.tones.length +
    selected.occasions.length +
    (selected.minPrice !== undefined || selected.maxPrice !== undefined ? 1 : 0) +
    (selected.inStockOnly ? 1 : 0)
  );
}

/** The price brackets offered in the sidebar, in rupees. */
export const PRICE_BANDS: Array<{ label: string; min?: number; max?: number }> = [
  { label: "Under 5,000", max: 4999 },
  { label: "5,000 to 10,000", min: 5000, max: 9999 },
  { label: "10,000 to 25,000", min: 10000, max: 24999 },
  { label: "25,000 to 50,000", min: 25000, max: 49999 },
  { label: "Above 50,000", min: 50000 },
];
