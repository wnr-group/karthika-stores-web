"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Drawer } from "@/components/ui/drawer";
import { ChevronDownIcon, CloseIcon, FilterIcon } from "@/components/ui/icons";
import { occasionLabel, SORT_OPTIONS, TONE_LABELS } from "@/lib/data/filters";
import { PRICE_BANDS, type ParsedShopParams } from "@/lib/shop/search-params";
import type { FacetCounts } from "@/lib/types";
import { cn, formatAmount } from "@/lib/utils";

/**
 * The filter and sort controls.
 *
 * All state lives in the URL. Every control writes a new query string and
 * lets the server re-render the grid, which keeps a filtered view shareable
 * and means there is no client-side copy of the catalogue to go stale.
 */

interface FiltersProps {
  facets: FacetCounts;
  selected: ParsedShopParams["selected"];
  /** Hidden on a category page, where the category is the page itself. */
  showCategories?: boolean;
  showCollections?: boolean;
  activeCount: number;
  total: number;
}

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Any filter change returns to the first page.
      params.delete("page");

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      commit((params) => {
        const current = params.getAll(key).flatMap((entry) => entry.split(","));
        const next = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];

        params.delete(key);
        if (next.length) params.set(key, next.join(","));
      });
    },
    [commit],
  );

  const setPrice = useCallback(
    (band: { min?: number; max?: number } | null) => {
      commit((params) => {
        params.delete("minPrice");
        params.delete("maxPrice");
        if (band?.min !== undefined) params.set("minPrice", String(band.min));
        if (band?.max !== undefined) params.set("maxPrice", String(band.max));
      });
    },
    [commit],
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      commit((params) => {
        if (value === null) params.delete(key);
        else params.set(key, value);
      });
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    commit((params) => {
      for (const key of [
        "category",
        "collection",
        "fabric",
        "colour",
        "occasion",
        "minPrice",
        "maxPrice",
        "availability",
      ]) {
        params.delete(key);
      }
    });
  }, [commit]);

  return { commit, toggle, setPrice, setSingle, clearAll, pending };
}

/* -------------------------------------------------------------------------
   Group
   ------------------------------------------------------------------------- */

function Group({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-stone-soft py-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink">{label}</span>
        <ChevronDownIcon
          className={cn(
            "h-3.5 w-3.5 text-taupe transition-transform duration-[240ms]",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2.5 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Check({
  label,
  count,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  swatch?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[0.8125rem] text-graphite transition-colors hover:text-ink">
      <span
        className={cn(
          "relative flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors duration-[160ms]",
          checked ? "border-ink bg-ink" : "border-stone",
        )}
      >
        {checked ? (
          <svg viewBox="0 0 10 8" className="h-2 w-2 text-paper" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m1 4 2.5 2.5L9 1" />
          </svg>
        ) : null}
      </span>

      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />

      {swatch ? (
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: swatch }}
        />
      ) : null}

      <span className="flex-1">{label}</span>
      {count !== undefined ? <span className="tnum text-[0.75rem] text-taupe-soft">{count}</span> : null}
    </label>
  );
}

const TONE_SWATCH: Record<string, string> = {
  ivory: "#e8dfcd",
  sand: "#d3c3a6",
  terracotta: "#b87450",
  maroon: "#7a3640",
  olive: "#7e856b",
  indigo: "#5a6478",
  saffron: "#c99a47",
  rose: "#c08d8c",
  charcoal: "#6a645e",
  teal: "#527974",
};

/* -------------------------------------------------------------------------
   The panel itself, shared by the desktop sidebar and the mobile sheet
   ------------------------------------------------------------------------- */

function FilterGroups({
  facets,
  selected,
  showCategories,
  showCollections,
}: Omit<FiltersProps, "activeCount" | "total">) {
  const { toggle, setPrice, setSingle } = useFilterNavigation();

  const activeBand = PRICE_BANDS.find(
    (band) => band.min === selected.minPrice && band.max === selected.maxPrice,
  );

  return (
    <div className="border-t border-stone-soft">
      {showCategories && facets.categories.length > 1 ? (
        <Group label="Category">
          {facets.categories.map((entry) => (
            <Check
              key={entry.slug}
              label={entry.name}
              count={entry.count}
              checked={selected.categories.includes(entry.slug)}
              onChange={() => toggle("category", entry.slug)}
            />
          ))}
        </Group>
      ) : null}

      {facets.fabrics.length > 1 ? (
        <Group label="Fabric">
          {facets.fabrics.map((entry) => (
            <Check
              key={entry.value}
              label={entry.value}
              count={entry.count}
              checked={selected.fabrics.includes(entry.value)}
              onChange={() => toggle("fabric", entry.value)}
            />
          ))}
        </Group>
      ) : null}

      {facets.tones.length > 1 ? (
        <Group label="Colour">
          {facets.tones.map((entry) => (
            <Check
              key={entry.value}
              label={TONE_LABELS[entry.value]}
              count={entry.count}
              swatch={TONE_SWATCH[entry.value]}
              checked={selected.tones.includes(entry.value)}
              onChange={() => toggle("colour", entry.value)}
            />
          ))}
        </Group>
      ) : null}

      {facets.occasions.length > 1 ? (
        <Group label="Occasion">
          {facets.occasions.map((entry) => (
            <Check
              key={entry.value}
              label={occasionLabel(entry.value)}
              count={entry.count}
              checked={selected.occasions.includes(entry.value)}
              onChange={() => toggle("occasion", entry.value)}
            />
          ))}
        </Group>
      ) : null}

      <Group label="Price">
        {PRICE_BANDS.map((band) => {
          const checked = activeBand === band;
          return (
            <Check
              key={band.label}
              label={band.label}
              checked={checked}
              onChange={() => setPrice(checked ? null : band)}
            />
          );
        })}
        {facets.priceRange.max > 0 ? (
          <p className="pt-1 text-[0.6875rem] text-taupe-soft">
            This selection runs from Rs {formatAmount(facets.priceRange.min)} to Rs{" "}
            {formatAmount(facets.priceRange.max)}
          </p>
        ) : null}
      </Group>

      {showCollections && facets.collections.length > 1 ? (
        <Group label="Collection" defaultOpen={false}>
          {facets.collections.map((entry) => (
            <Check
              key={entry.slug}
              label={entry.name}
              count={entry.count}
              checked={selected.collections.includes(entry.slug)}
              onChange={() => toggle("collection", entry.slug)}
            />
          ))}
        </Group>
      ) : null}

      <Group label="Availability" defaultOpen={false}>
        <Check
          label="In stock only"
          checked={selected.inStockOnly}
          onChange={() =>
            setSingle("availability", selected.inStockOnly ? null : "in-stock")
          }
        />
      </Group>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Desktop sidebar
   ------------------------------------------------------------------------- */

export function FilterSidebar(props: FiltersProps) {
  const { clearAll } = useFilterNavigation();

  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">Filter</h2>
          {props.activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {/* No inner scroll container: the sidebar is allowed to be taller
            than the viewport and scrolls with the page, which avoids a
            nested scrollbar sitting next to the product grid. */}
        <div className="mt-5">
          <FilterGroups {...props} />
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------
   Toolbar: result count, mobile filter button, sort
   ------------------------------------------------------------------------- */

export function ShopToolbar(props: FiltersProps) {
  const [open, setOpen] = useState(false);
  const { setSingle, clearAll, pending } = useFilterNavigation();

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-stone py-4">
        <p
          className={cn(
            "tnum text-[0.75rem] text-taupe transition-opacity",
            pending && "opacity-40",
          )}
        >
          {props.total} {props.total === 1 ? "piece" : "pieces"}
        </p>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-ink lg:hidden"
          >
            <FilterIcon className="h-4 w-4" />
            Filter
            {props.activeCount > 0 ? (
              <span className="tnum text-taupe">({props.activeCount})</span>
            ) : null}
          </button>

          <label className="flex items-center gap-2">
            <span className="sr-only">Sort by</span>
            <select
              value={props.selected.sort}
              onChange={(event) => setSingle("sort", event.target.value)}
              className="cursor-pointer appearance-none bg-transparent pr-5 text-[0.6875rem] uppercase tracking-[0.16em] text-ink outline-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23857a6d' stroke-width='1'><path d='m5 9 7 7 7-7'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right center",
                backgroundSize: "14px",
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Active filter chips */}
      {props.activeCount > 0 ? (
        <ActiveChips selected={props.selected} onClearAll={clearAll} />
      ) : null}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="bottom"
        title="Filter"
        footer={
          <div className="flex gap-3 px-5 py-4">
            <button
              type="button"
              onClick={clearAll}
              className="h-12 flex-1 border border-stone text-[0.6875rem] uppercase tracking-[0.16em] text-ink"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-12 flex-[2] bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper"
            >
              Show {props.total} {props.total === 1 ? "piece" : "pieces"}
            </button>
          </div>
        }
      >
        <div className="px-5 pb-6">
          <FilterGroups {...props} />
        </div>
      </Drawer>
    </>
  );
}

function ActiveChips({
  selected,
  onClearAll,
}: {
  selected: ParsedShopParams["selected"];
  onClearAll: () => void;
}) {
  const { toggle, setPrice, setSingle } = useFilterNavigation();

  const chips: Array<{ label: string; onRemove: () => void }> = [
    ...selected.categories.map((slug) => ({
      label: slug.replace(/-/g, " "),
      onRemove: () => toggle("category", slug),
    })),
    ...selected.fabrics.map((value) => ({
      label: value,
      onRemove: () => toggle("fabric", value),
    })),
    ...selected.tones.map((value) => ({
      label: TONE_LABELS[value],
      onRemove: () => toggle("colour", value),
    })),
    ...selected.occasions.map((value) => ({
      label: occasionLabel(value),
      onRemove: () => toggle("occasion", value),
    })),
    ...selected.collections.map((slug) => ({
      label: slug.replace(/-/g, " "),
      onRemove: () => toggle("collection", slug),
    })),
  ];

  if (selected.minPrice !== undefined || selected.maxPrice !== undefined) {
    const band = PRICE_BANDS.find(
      (entry) => entry.min === selected.minPrice && entry.max === selected.maxPrice,
    );
    chips.push({
      label: band?.label ?? "Price",
      onRemove: () => setPrice(null),
    });
  }

  if (selected.inStockOnly) {
    chips.push({ label: "In stock", onRemove: () => setSingle("availability", null) });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.onRemove}
          className="group flex items-center gap-2 border border-stone px-3 py-1.5 text-[0.6875rem] capitalize text-graphite transition-colors hover:border-ink hover:text-ink"
        >
          {chip.label}
          <CloseIcon className="h-2.5 w-2.5 text-taupe transition-colors group-hover:text-ink" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Clear
      </button>
    </div>
  );
}
