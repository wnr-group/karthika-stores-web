import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";

/**
 * Search suggestions for the header overlay.
 *
 * Returns a handful of products plus any category whose name matches, which
 * is usually what someone typing "silk" actually wants.
 */
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (term.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const repository = await getRepository();

  const [results, categories] = await Promise.all([
    repository.queryProducts({ search: term, perPage: 5, sort: "featured" }),
    repository.listCategories(),
  ]);

  const lowered = term.toLowerCase();
  const matchingCategories = categories
    .filter((category) => category.name.toLowerCase().includes(lowered))
    .slice(0, 4)
    .map((category) => ({ name: category.name, slug: category.slug }));

  return NextResponse.json(
    { products: results.items, categories: matchingCategories },
    // Suggestions are the same for everyone; a short shared cache is fine.
    { headers: { "cache-control": "public, max-age=30, s-maxage=60" } },
  );
}
