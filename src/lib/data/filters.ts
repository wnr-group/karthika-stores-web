/**
 * Pure catalogue querying: filter, sort, facet, paginate.
 *
 * Kept separate from any storage concern so the mock repository and the
 * Supabase repository produce byte-identical results for the same query.
 */

import type {
  FacetCounts,
  Occasion,
  Paginated,
  ProductQuery,
  ProductWithRelations,
  SortKey,
  Tone,
} from "@/lib/types";
import { commerce } from "@/lib/site";

const OCCASION_LABELS: Record<Occasion, string> = {
  everyday: "Everyday",
  work: "Work",
  festive: "Festive",
  ceremony: "Ceremony",
  wedding: "Wedding",
};

export const TONE_LABELS: Record<Tone, string> = {
  ivory: "Ivory",
  sand: "Sand",
  terracotta: "Terracotta",
  maroon: "Maroon",
  olive: "Olive",
  indigo: "Indigo",
  saffron: "Saffron",
  rose: "Rose",
  charcoal: "Charcoal",
  teal: "Teal",
};

export function occasionLabel(value: Occasion): string {
  return OCCASION_LABELS[value];
}

/* -------------------------------------------------------------------------
   Filtering
   ------------------------------------------------------------------------- */

function matchesSearch(product: ProductWithRelations, term: string): boolean {
  const haystack = [
    product.name,
    product.fabric,
    product.color,
    product.weave,
    product.category.name,
    product.collection?.name ?? "",
    product.shortDescription,
    product.craftTags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  // Every word in the query has to appear somewhere, so "silk wedding"
  // narrows rather than widens.
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Applies every clause of a query except sorting and pagination. */
export function applyFilters(
  products: ProductWithRelations[],
  query: ProductQuery,
): ProductWithRelations[] {
  return products.filter((product) => {
    if (!product.isActive) return false;

    if (query.categorySlugs?.length && !query.categorySlugs.includes(product.category.slug)) {
      return false;
    }
    if (
      query.collectionSlugs?.length &&
      !(product.collection && query.collectionSlugs.includes(product.collection.slug))
    ) {
      return false;
    }
    if (query.fabrics?.length && !query.fabrics.includes(product.fabric)) return false;
    if (query.tones?.length && !query.tones.includes(product.tone)) return false;
    if (
      query.occasions?.length &&
      !product.occasions.some((occasion) => query.occasions!.includes(occasion))
    ) {
      return false;
    }
    if (query.minPrice !== undefined && product.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && product.price > query.maxPrice) return false;
    if (query.inStockOnly && product.stockQuantity <= 0) return false;
    if (query.isNew !== undefined && product.isNew !== query.isNew) return false;
    if (query.isFeatured !== undefined && product.isFeatured !== query.isFeatured) return false;
    if (query.search && !matchesSearch(product, query.search)) return false;

    return true;
  });
}

/* -------------------------------------------------------------------------
   Sorting
   ------------------------------------------------------------------------- */

const SORTERS: Record<SortKey, (a: ProductWithRelations, b: ProductWithRelations) => number> = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt),
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function applySort(
  products: ProductWithRelations[],
  sort: SortKey = "featured",
): ProductWithRelations[] {
  // Out-of-stock pieces always sink, whatever the sort. Nobody wants to
  // scroll past things they cannot buy.
  return [...products].sort(
    (a, b) =>
      Number(b.stockQuantity > 0) - Number(a.stockQuantity > 0) ||
      (SORTERS[sort] ?? SORTERS.featured)(a, b),
  );
}

/* -------------------------------------------------------------------------
   Pagination
   ------------------------------------------------------------------------- */

export function paginate<T>(
  items: T[],
  page = 1,
  perPage: number = commerce.productsPerPage,
): Paginated<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total: items.length,
    page: safePage,
    perPage,
    pageCount,
  };
}

/* -------------------------------------------------------------------------
   Facets

   Counts are computed against the result set with each facet's *own* clause
   removed, so ticking "Silk" does not zero out every other fabric.
   ------------------------------------------------------------------------- */

function countBy<T extends string>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export function buildFacets(
  all: ProductWithRelations[],
  query: ProductQuery,
): FacetCounts {
  const without = (key: keyof ProductQuery) =>
    applyFilters(all, { ...query, [key]: undefined, page: undefined });

  const forCategories = without("categorySlugs");
  const forFabrics = without("fabrics");
  const forTones = without("tones");
  const forOccasions = without("occasions");
  const forCollections = without("collectionSlugs");
  const forPrice = applyFilters(all, {
    ...query,
    minPrice: undefined,
    maxPrice: undefined,
  });

  const categoryCounts = countBy(forCategories.map((p) => p.category.slug));
  const categoryNames = new Map(forCategories.map((p) => [p.category.slug, p.category.name]));

  const collectionCounts = countBy(
    forCollections.flatMap((p) => (p.collection ? [p.collection.slug] : [])),
  );
  const collectionNames = new Map(
    forCollections.flatMap((p) => (p.collection ? [[p.collection.slug, p.collection.name]] : [])),
  );

  const prices = forPrice.map((p) => p.price);

  return {
    categories: [...categoryCounts.entries()]
      .map(([slug, count]) => ({ slug, name: categoryNames.get(slug) ?? slug, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),

    fabrics: [...countBy(forFabrics.map((p) => p.fabric)).entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),

    tones: [...countBy(forTones.map((p) => p.tone)).entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => TONE_LABELS[a.value].localeCompare(TONE_LABELS[b.value])),

    occasions: [...countBy(forOccasions.flatMap((p) => p.occasions)).entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => OCCASION_LABELS[a.value].localeCompare(OCCASION_LABELS[b.value])),

    collections: [...collectionCounts.entries()]
      .map(([slug, count]) => ({ slug, name: collectionNames.get(slug) ?? slug, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),

    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  };
}

/* -------------------------------------------------------------------------
   Related products
   ------------------------------------------------------------------------- */

/** Same collection first, then same category, then the same price bracket. */
export function findRelated(
  all: ProductWithRelations[],
  product: ProductWithRelations,
  limit = 4,
): ProductWithRelations[] {
  const score = (candidate: ProductWithRelations) => {
    let value = 0;
    if (candidate.collection && candidate.collection.id === product.collection?.id) value += 3;
    if (candidate.category.id === product.category.id) value += 2;
    if (candidate.fabric === product.fabric) value += 1;
    if (Math.abs(candidate.price - product.price) < product.price * 0.4) value += 1;
    return value;
  };

  return all
    .filter((candidate) => candidate.id !== product.id && candidate.isActive)
    .map((candidate) => ({ candidate, score: score(candidate) }))
    .sort((a, b) => b.score - a.score || b.candidate.price - a.candidate.price)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
