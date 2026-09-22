import { Suspense } from "react";

import { ProductGrid } from "@/components/product/product-card";
import { FilterSidebar, ShopToolbar } from "@/components/shop/filters";
import { Pagination } from "@/components/shop/pagination";
import { Breadcrumb, EmptyState } from "@/components/ui/primitives";
import { getRepository } from "@/lib/data/repository";
import {
  countActiveFilters,
  parseShopParams,
  type RawSearchParams,
} from "@/lib/shop/search-params";

/**
 * The product listing, shared by /shop, /shop/[category] and
 * /collections/[slug].
 *
 * A server component: it reads the URL, queries the repository and renders
 * the grid. Only the filter controls are client code.
 */

export interface ListingProps {
  searchParams: RawSearchParams;
  basePath: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  /** Locks the listing to one category or collection. */
  categorySlug?: string;
  collectionSlug?: string;
}

export async function Listing({
  searchParams,
  basePath,
  eyebrow,
  title,
  intro,
  breadcrumb,
  categorySlug,
  collectionSlug,
}: ListingProps) {
  const { query, selected } = parseShopParams(searchParams, { categorySlug, collectionSlug });
  const repository = await getRepository();

  const [results, facets] = await Promise.all([
    repository.queryProducts(query),
    repository.getFacets(query),
  ]);

  const activeCount = countActiveFilters(selected);

  const filterProps = {
    facets,
    selected,
    showCategories: !categorySlug,
    showCollections: !collectionSlug,
    activeCount,
    total: results.total,
  };

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb trail={breadcrumb} />

      {/* Editorial header. The description sits in a narrow column offset to
          the right rather than centred under the title. */}
      <header className="mt-8 grid gap-6 border-b border-stone pb-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-6">
          {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
          <h1 className="display-lg">{title}</h1>
        </div>

        {intro ? (
          <p className="text-[0.9375rem] leading-relaxed text-graphite md:col-span-5 md:col-start-8">
            {intro}
          </p>
        ) : null}
      </header>

      <div className="mt-8 grid gap-x-12 lg:grid-cols-[15rem_1fr] xl:gap-x-16">
        <Suspense fallback={null}>
          <FilterSidebar {...filterProps} />
        </Suspense>

        <div className="min-w-0">
          <Suspense fallback={null}>
            <ShopToolbar {...filterProps} />
          </Suspense>

          {results.items.length === 0 ? (
            <EmptyState
              eyebrow="Nothing here"
              title={
                selected.search
                  ? `No pieces match "${selected.search}"`
                  : "No pieces match these filters"
              }
              body="Loosen a filter, or tell us what you are looking for. We often have something on the loom that has not reached the site yet."
              action={{ label: "Clear filters", href: basePath }}
              secondary={{ label: "Ask the atelier", href: "/contact" }}
            />
          ) : (
            <>
              <ProductGrid
                products={results.items}
                className="mt-10 md:grid-cols-2 xl:grid-cols-3"
                sizes="(min-width: 1280px) 26vw, (min-width: 768px) 40vw, 45vw"
                priorityCount={2}
              />

              <Pagination
                page={results.page}
                pageCount={results.pageCount}
                basePath={basePath}
                searchParams={searchParams}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
