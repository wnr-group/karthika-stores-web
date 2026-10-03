/**
 * Pure catalogue querying: filter, sort, facet, paginate, search.
 *
 * Kept separate from any storage concern so the seed repository and the
 * Supabase repository produce identical results for the same query. Nothing
 * here knows about sarees, cakes or headphones: category-specific filtering
 * runs entirely off attribute definitions.
 */

import { commerce } from "@/lib/site";
import type {
  AttributeDefinition,
  AttributeFacet,
  FacetCounts,
  FulfillmentType,
  Occasion,
  Paginated,
  ProductQuery,
  ProductWithRelations,
  ServiceQuery,
  ServiceWithRelations,
  SortKey,
  Tone,
  Vendor,
  VendorQuery,
} from "@/lib/types";
import { FULFILLMENT_LABELS, isServiceAvailableIn } from "@/lib/marketplace/fulfillment";

const OCCASION_LABELS: Record<Occasion, string> = {
  everyday: "Everyday",
  work: "Work",
  festive: "Festive",
  ceremony: "Ceremony",
  wedding: "Wedding",
  gifting: "Gifting",
  party: "Party",
};

export const TONE_LABELS: Record<Tone, string> = {
  ivory: "Ivory & white",
  sand: "Beige & sand",
  terracotta: "Rust & tan",
  maroon: "Maroon & wine",
  olive: "Green",
  indigo: "Blue",
  saffron: "Yellow & gold",
  rose: "Pink",
  charcoal: "Black & grey",
  teal: "Teal",
};

export function occasionLabel(value: Occasion): string {
  return OCCASION_LABELS[value];
}

/* -------------------------------------------------------------------------
   Text matching
   ------------------------------------------------------------------------- */

function words(term: string): string[] {
  return term.toLowerCase().split(/\s+/).map((word) => word.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
}

/** Every word has to appear somewhere, so "silk wedding" narrows rather than widens. */
function matchesAll(haystack: string, term: string): boolean {
  const text = haystack.toLowerCase();
  return words(term).every((word) => text.includes(word) || (word.endsWith("s") && text.includes(word.slice(0, -1))));
}

/** A relevance score: name hits beat tag hits beat description hits. */
function score(fields: Array<[string, number]>, term: string): number {
  let total = 0;
  for (const word of words(term)) {
    for (const [field, weight] of fields) {
      if (field.toLowerCase().includes(word)) total += weight;
    }
  }
  return total;
}

function attributeText(attributes: Record<string, unknown>): string {
  return Object.values(attributes)
    .map((value) => (Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : ""))
    .join(" ");
}

export function productHaystack(product: ProductWithRelations): string {
  return [
    product.name,
    product.subtitle,
    product.color,
    product.vendor.name,
    product.categoryTrail.map((category) => category.name).join(" "),
    product.collections.map((collection) => collection.name).join(" "),
    product.shortDescription,
    product.tags.join(" "),
    product.occasions.join(" "),
    attributeText(product.attributes),
  ].join(" ");
}

export function productRelevance(product: ProductWithRelations, term: string): number {
  return score(
    [
      [product.name, 10],
      [product.tags.join(" "), 5],
      [product.categoryTrail.map((category) => category.name).join(" "), 5],
      [product.subtitle, 4],
      [product.vendor.name, 3],
      [product.occasions.join(" "), 3],
      [product.shortDescription, 2],
      [attributeText(product.attributes), 1],
    ],
    term,
  );
}

export function serviceHaystack(service: ServiceWithRelations): string {
  return [
    service.name,
    service.subtitle,
    service.vendor.name,
    service.category.name,
    service.shortDescription,
    service.tags.join(" "),
    service.includes.join(" "),
  ].join(" ");
}

export function serviceRelevance(service: ServiceWithRelations, term: string): number {
  return score(
    [
      [service.name, 10],
      [service.tags.join(" "), 5],
      [service.category.name, 5],
      [service.subtitle, 4],
      [service.vendor.name, 3],
      [service.shortDescription, 2],
    ],
    term,
  );
}

export function vendorHaystack(vendor: Vendor, categoryName = ""): string {
  return [vendor.name, vendor.tagline, vendor.description, vendor.locality, vendor.city, categoryName].join(" ");
}

/* -------------------------------------------------------------------------
   Products
   ------------------------------------------------------------------------- */

function attributeValues(product: ProductWithRelations, key: string): string[] {
  const value = product.attributes[key];
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "boolean") return [value ? "yes" : "no"];
  return [String(value)];
}

/** Applies every clause of a query except sorting and pagination. */
export function applyFilters(products: ProductWithRelations[], query: ProductQuery): ProductWithRelations[] {
  return products.filter((product) => {
    if (query.ids && !query.ids.includes(product.id)) return false;

    if (
      query.categorySlugs?.length &&
      !product.categoryTrail.some((category) => query.categorySlugs!.includes(category.slug))
    ) {
      return false;
    }
    if (
      query.collectionSlugs?.length &&
      !product.collections.some((collection) => query.collectionSlugs!.includes(collection.slug))
    ) {
      return false;
    }
    if (query.vendorSlugs?.length && !query.vendorSlugs.includes(product.vendor.slug)) return false;

    if (query.attributes) {
      for (const [key, wanted] of Object.entries(query.attributes)) {
        if (!wanted.length) continue;
        const have = attributeValues(product, key);
        if (!have.some((value) => wanted.includes(value))) return false;
      }
    }

    if (query.tones?.length && !query.tones.includes(product.tone)) return false;
    if (query.occasions?.length && !product.occasions.some((occasion) => query.occasions!.includes(occasion))) {
      return false;
    }
    if (query.fulfillment?.length && !product.fulfillmentTypes.some((type) => query.fulfillment!.includes(type))) {
      return false;
    }
    if (query.city && !product.shipsNationwide && !product.localCities.includes(query.city)) return false;
    if (query.minPrice !== undefined && product.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && product.price > query.maxPrice) return false;
    if (query.minRating !== undefined && product.rating < query.minRating) return false;
    if (query.inStockOnly && product.stockQuantity <= 0) return false;
    if (query.onSaleOnly && !(product.compareAtPrice && product.compareAtPrice > product.price)) return false;
    if (query.isNew !== undefined && product.isNew !== query.isNew) return false;
    if (query.isFeatured !== undefined && product.isFeatured !== query.isFeatured) return false;
    if (query.search && !matchesAll(productHaystack(product), query.search)) return false;

    return true;
  });
}

type Sorter<T> = (a: T, b: T) => number;

const PRODUCT_SORTERS: Record<SortKey, Sorter<ProductWithRelations>> = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) ||
    b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10),
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
  popular: (a, b) => b.salesCount - a.salesCount,
};

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Recommended" },
  { value: "popular", label: "Best selling" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function applySort(products: ProductWithRelations[], sort: SortKey = "featured", search?: string): ProductWithRelations[] {
  // Out-of-stock pieces always sink, whatever the sort. A search with the
  // default sort orders by relevance first.
  return [...products].sort(
    (a, b) =>
      Number(b.stockQuantity > 0) - Number(a.stockQuantity > 0) ||
      (search && sort === "featured" ? productRelevance(b, search) - productRelevance(a, search) : 0) ||
      (PRODUCT_SORTERS[sort] ?? PRODUCT_SORTERS.featured)(a, b),
  );
}

/* -------------------------------------------------------------------------
   Pagination
   ------------------------------------------------------------------------- */

export function paginate<T>(items: T[], page = 1, perPage: number = commerce.productsPerPage): Paginated<T> {
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
   removed, so ticking "Silk" does not zero out every other fabric. Attribute
   facets come from the filterable attribute definitions of whatever
   categories are in the result, so a jewellery listing offers Material and
   Stone type, a food listing offers Diet and Spice level, and nobody wrote a
   jewellery or food filter.
   ------------------------------------------------------------------------- */

function countBy<T extends string>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export function buildFacets(
  all: ProductWithRelations[],
  query: ProductQuery,
  /** Inherited attribute definitions per category id. */
  definitionsFor: (categoryId: string) => AttributeDefinition[],
): FacetCounts {
  const without = (patch: Partial<ProductQuery>) => applyFilters(all, { ...query, ...patch, page: undefined });

  const forCategories = without({ categorySlugs: undefined });
  const forVendors = without({ vendorSlugs: undefined });
  const forTones = without({ tones: undefined });
  const forOccasions = without({ occasions: undefined });
  const forFulfillment = without({ fulfillment: undefined });
  const forCollections = without({ collectionSlugs: undefined });
  const forPrice = without({ minPrice: undefined, maxPrice: undefined });
  const current = without({});

  /* Categories: count at the level just below what is selected, so a page
     scoped to "Fashion" lists Sarees, Dresses, Footwear... */
  const depth = query.categorySlugs?.length
    ? Math.min(
        ...forCategories
          .filter((product) => product.categoryTrail.some((category) => query.categorySlugs!.includes(category.slug)))
          .map((product) => product.categoryTrail.findIndex((category) => query.categorySlugs!.includes(category.slug)) + 1),
        9,
      )
    : 0;
  const scoped = query.categorySlugs?.length
    ? forCategories.filter((product) => product.categoryTrail.some((category) => query.categorySlugs!.includes(category.slug)))
    : forCategories;
  const categoryAt = (product: ProductWithRelations) => product.categoryTrail[Math.min(depth, product.categoryTrail.length - 1)]!;
  const categoryCounts = countBy(scoped.map((product) => categoryAt(product).slug));
  const categoryNames = new Map(scoped.map((product) => [categoryAt(product).slug, categoryAt(product).name]));

  const vendorCounts = countBy(forVendors.map((product) => product.vendor.slug));
  const vendorNames = new Map(forVendors.map((product) => [product.vendor.slug, product.vendor.name]));

  const collectionCounts = countBy(forCollections.flatMap((product) => product.collections.map((c) => c.slug)));
  const collectionNames = new Map(forCollections.flatMap((product) => product.collections.map((c) => [c.slug, c.name] as const)));

  /* Attribute facets, only once the listing is narrowed to some categories. */
  const attributes: AttributeFacet[] = [];
  if (query.categorySlugs?.length || query.search || query.vendorSlugs?.length) {
    const definitions = new Map<string, AttributeDefinition>();
    for (const categoryId of new Set(current.map((product) => product.categoryId))) {
      for (const definition of definitionsFor(categoryId)) {
        if (definition.isFilterable && !definitions.has(definition.key)) definitions.set(definition.key, definition);
      }
    }

    for (const definition of definitions.values()) {
      const pool = applyFilters(all, {
        ...query,
        page: undefined,
        attributes: { ...query.attributes, [definition.key]: [] },
      });
      const counts = countBy(pool.flatMap((product) => attributeValues(product, definition.key)));
      if (counts.size < 2 && !query.attributes?.[definition.key]?.length) continue;

      const label = (value: string) =>
        definition.inputType === "boolean"
          ? value === "yes" ? "Yes" : "No"
          : definition.options?.find((option) => option.value === value)?.label ?? value;

      attributes.push({
        key: definition.key,
        label: definition.label,
        values: [...counts.entries()]
          .map(([value, count]) => ({ value, label: label(value), count }))
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
          .slice(0, 12),
      });
    }
  }

  const prices = forPrice.map((product) => product.price);

  return {
    categories: [...categoryCounts.entries()]
      .map(([slug, count]) => ({ slug, name: categoryNames.get(slug) ?? slug, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    vendors: [...vendorCounts.entries()]
      .map(([slug, count]) => ({ slug, name: vendorNames.get(slug) ?? slug, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    attributes: attributes.slice(0, 6),
    tones: [...countBy(forTones.map((product) => product.tone)).entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => TONE_LABELS[a.value].localeCompare(TONE_LABELS[b.value])),
    occasions: [...countBy(forOccasions.flatMap((product) => product.occasions)).entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => OCCASION_LABELS[a.value].localeCompare(OCCASION_LABELS[b.value])),
    fulfillment: [...countBy(forFulfillment.flatMap((product) => product.fulfillmentTypes)).entries()]
      .map(([value, count]) => ({ value: value as FulfillmentType, count }))
      .sort((a, b) => FULFILLMENT_LABELS[a.value].localeCompare(FULFILLMENT_LABELS[b.value])),
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
  const ids = new Set(product.collections.map((collection) => collection.id));
  const trail = new Set(product.categoryTrail.map((category) => category.id));

  const relatedness = (candidate: ProductWithRelations) => {
    let value = 0;
    if (candidate.collections.some((collection) => ids.has(collection.id))) value += 2;
    if (candidate.categoryId === product.categoryId) value += 3;
    else if (candidate.categoryTrail.some((category) => trail.has(category.id))) value += 1;
    if (candidate.vendorId === product.vendorId) value += 1;
    if (Math.abs(candidate.price - product.price) < product.price * 0.4) value += 1;
    return value;
  };

  return all
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({ candidate, value: relatedness(candidate) }))
    .filter((entry) => entry.value > 1)
    .sort((a, b) => b.value - a.value || b.candidate.rating - a.candidate.rating)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/* -------------------------------------------------------------------------
   Services
   ------------------------------------------------------------------------- */

export function applyServiceFilters(services: ServiceWithRelations[], query: ServiceQuery): ServiceWithRelations[] {
  return services.filter((service) => {
    if (query.categorySlugs?.length && !service.categoryTrail.some((category) => query.categorySlugs!.includes(category.slug))) {
      return false;
    }
    if (query.vendorSlugs?.length && !query.vendorSlugs.includes(service.vendor.slug)) return false;
    if (query.city && !isServiceAvailableIn(service, query.city)) return false;
    if (query.modes?.length && !service.modes.some((mode) => query.modes!.includes(mode))) return false;
    if (query.minPrice !== undefined && service.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && service.price > query.maxPrice) return false;
    if (query.minRating !== undefined && service.rating < query.minRating) return false;
    if (query.isFeatured !== undefined && service.isFeatured !== query.isFeatured) return false;
    if (query.search && !matchesAll(serviceHaystack(service), query.search)) return false;
    return true;
  });
}

const SERVICE_SORTERS: Record<SortKey, Sorter<ServiceWithRelations>> = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) ||
    b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10),
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
  popular: (a, b) => b.bookingCount - a.bookingCount,
};

export function sortServices(services: ServiceWithRelations[], sort: SortKey = "featured", search?: string) {
  return [...services].sort(
    (a, b) =>
      (search && sort === "featured" ? serviceRelevance(b, search) - serviceRelevance(a, search) : 0) ||
      (SERVICE_SORTERS[sort] ?? SERVICE_SORTERS.featured)(a, b),
  );
}

/* -------------------------------------------------------------------------
   Vendors
   ------------------------------------------------------------------------- */

export interface VendorFacts {
  categoryName: string;
  /** Category ids (and their ancestors) the vendor has live listings in. */
  categoryIds: Set<string>;
  categorySlugs: Set<string>;
  productCount: number;
  serviceCount: number;
}

export function applyVendorQuery(
  vendors: Vendor[],
  query: VendorQuery,
  factsFor: (vendor: Vendor) => VendorFacts,
): Vendor[] {
  const filtered = vendors.filter((vendor) => {
    if (query.statuses?.length) {
      if (!query.statuses.includes(vendor.status)) return false;
    } else if (!query.includeAllStatuses && vendor.status !== "approved") {
      return false;
    }
    const facts = factsFor(vendor);
    if (query.categorySlugs?.length && !query.categorySlugs.some((slug) => facts.categorySlugs.has(slug))) return false;
    if (query.city && vendor.city !== query.city && !vendor.settings.deliveryZones.includes(query.city)) return false;
    if (query.offers === "products" && facts.productCount === 0) return false;
    if (query.offers === "services" && facts.serviceCount === 0) return false;
    if (query.minRating !== undefined && vendor.rating < query.minRating) return false;
    if (query.verifiedOnly && !vendor.isVerified) return false;
    if (query.isFeatured !== undefined && vendor.isFeatured !== query.isFeatured) return false;
    if (query.search && !matchesAll(vendorHaystack(vendor, facts.categoryName), query.search)) return false;
    return true;
  });

  const sorters: Record<NonNullable<VendorQuery["sort"]>, Sorter<Vendor>> = {
    featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.followerCount - a.followerCount,
    rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
    newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    name: (a, b) => a.name.localeCompare(b.name),
  };

  return filtered.sort(sorters[query.sort ?? "featured"]);
}
