import type { Metadata } from "next";

import { Listing } from "@/components/shop/listing";
import type { RawSearchParams } from "@/lib/shop/search-params";

export const metadata: Metadata = {
  title: "All products",
  description:
    "Shop products from independent sellers across fashion, jewellery, food, home, electronics, gifts and pets.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : undefined;

  return (
    <Listing
      searchParams={params}
      basePath="/shop"
      eyebrow={search ? "Search" : "Shop"}
      title={search ? `"${search}"` : "All products"}
      intro={
        search
          ? undefined
          : "Everything in the shop right now: imitation jewellery, sarees, kurtis and more. Filter by category, delivery option or price."
      }
      breadcrumb={[{ label: "Home", href: "/" }, { label: search ? "Search" : "All products" }]}
    />
  );
}
