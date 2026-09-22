"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Media, ratio } from "@/components/ui/media";
import { popularSearches } from "@/lib/data/catalog";
import type { ProductWithRelations } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

/**
 * The search overlay.
 *
 * Drops from the top over a scrim. Before you type it shows what you searched
 * for last and what other people search for; as you type it shows matching
 * pieces with their fabric and price, debounced at 180ms.
 */

const RECENT_KEY = "karthika.recent-searches.v1";
const MAX_RECENT = 5;

interface SearchResults {
  products: ProductWithRelations[];
  categories: Array<{ name: string; slug: string }>;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setRecent(parsed.filter((entry): entry is string => typeof entry === "string"));
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    // A beat, so focus lands after the panel has started moving.
    const timer = setTimeout(() => inputRef.current?.focus(), 60);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  // Debounced lookup.
  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: SearchResults | null) => {
          setResults(data);
          setLoading(false);
        })
        .catch(() => {
          // Aborted by the next keystroke, or offline.
        });
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const remember = useCallback((term: string) => {
    setRecent((current) => {
      const next = [term, ...current.filter((entry) => entry !== term)].slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  function submit(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    remember(trimmed);
    onClose();
    setQuery("");
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  const hasQuery = query.trim().length >= 2;
  const empty = hasQuery && !loading && results && results.products.length === 0;

  return (
    <div className={cn("fixed inset-0 z-[65]", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/25 transition-opacity duration-[300ms]",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={cn(
          "absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto bg-paper transition-transform duration-[300ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          open ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="shell py-6 md:py-10">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(query);
            }}
            className="flex items-center gap-4 border-b border-stone pb-4"
          >
            <SearchIcon className="h-5 w-5 shrink-0 text-taupe" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by weave, colour or occasion"
              aria-label="Search products"
              className="w-full bg-transparent font-display text-[1.5rem] text-ink outline-none placeholder:text-taupe-soft md:text-[2rem]"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="shrink-0 p-2 text-taupe transition-colors hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </form>

          {!hasQuery ? (
            <div className="grid gap-10 py-10 md:grid-cols-2 md:gap-16">
              {recent.length > 0 ? (
                <div>
                  <p className="eyebrow mb-5">Recently searched</p>
                  <ul className="space-y-2.5">
                    {recent.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => submit(term)}
                          className="link-quiet text-left text-[0.9375rem] text-graphite"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <p className="eyebrow mb-5">Often searched</p>
                <ul className="space-y-2.5">
                  {popularSearches.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onClick={() => submit(term)}
                        className="link-quiet text-left text-[0.9375rem] text-graphite"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {loading && hasQuery ? (
            <p className="py-10 text-[0.8125rem] text-taupe">Looking...</p>
          ) : null}

          {empty ? (
            <div className="py-12">
              <p className="display-sm">Nothing for &ldquo;{query.trim()}&rdquo;</p>
              <p className="measure mt-3 text-sm text-taupe">
                Try a weave, a colour or an occasion. Or tell us what you are looking for and we
                will find it on the looms.
              </p>
              <Link href="/contact" onClick={onClose} className="link-rule mt-6 inline-block text-sm">
                Ask the atelier
              </Link>
            </div>
          ) : null}

          {results && results.products.length > 0 ? (
            <div className="py-8">
              {results.categories.length > 0 ? (
                <div className="mb-8">
                  <p className="eyebrow mb-4">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/shop/${category.slug}`}
                        onClick={onClose}
                        className="border border-stone px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-graphite transition-colors hover:border-ink hover:text-ink"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="eyebrow mb-5">Pieces</p>
              <ul className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4 lg:grid-cols-5">
                {results.products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => {
                        remember(query.trim());
                        onClose();
                      }}
                      className="group block"
                    >
                      <div className={cn("relative overflow-hidden", ratio.product)}>
                        <Media
                          image={product.images[0]!}
                          className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]"
                          sizes="(min-width: 768px) 20vw, 45vw"
                        />
                      </div>
                      <p className="mt-3 font-display text-[1.0625rem] leading-snug text-ink">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[0.75rem] text-taupe">{product.fabric}</p>
                      <p className="tnum mt-1 text-[0.8125rem] text-ink">
                        {formatPrice(product.price)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => submit(query)}
                className="link-rule mt-8 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
              >
                See all results
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
