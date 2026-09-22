import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { RawSearchParams } from "@/lib/shop/search-params";
import { cn } from "@/lib/utils";

/**
 * Numbered pagination rendered as plain links, so it works without
 * JavaScript and so each page is crawlable.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: RawSearchParams;
}) {
  if (pageCount <= 1) return null;

  function href(target: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      for (const entry of Array.isArray(value) ? value : [value]) params.append(key, entry);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  // Show the ends and a window of three around the current page.
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const visible = [...pages].filter((entry) => entry >= 1 && entry <= pageCount).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center text-taupe transition-colors hover:text-ink"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span className="h-9 w-9" />
      )}

      {visible.map((entry, index) => {
        const previous = visible[index - 1];
        const gap = previous !== undefined && entry - previous > 1;

        return (
          <span key={entry} className="flex items-center gap-1.5">
            {gap ? <span className="px-1 text-[0.75rem] text-stone">&middot;&middot;&middot;</span> : null}
            <Link
              href={href(entry)}
              aria-current={entry === page ? "page" : undefined}
              className={cn(
                "tnum flex h-9 min-w-9 items-center justify-center px-2 text-[0.8125rem] transition-colors",
                entry === page
                  ? "border-b border-ink text-ink"
                  : "text-taupe hover:text-ink",
              )}
            >
              {entry}
            </Link>
          </span>
        );
      })}

      {page < pageCount ? (
        <Link
          href={href(page + 1)}
          rel="next"
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center text-taupe transition-colors hover:text-ink"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : (
        <span className="h-9 w-9" />
      )}
    </nav>
  );
}
