import type { Metadata } from "next";

import { Listing } from "@/components/shop/listing";
import type { RawSearchParams } from "@/lib/shop/search-params";

export const metadata: Metadata = {
  title: "Sarees",
  description:
    "Every saree in the Karthika collection: Kanchipuram silk, Banarasi brocade, organza, chanderi, linen and handloom cotton.",
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
      eyebrow={search ? "Search" : "The collection"}
      title={search ? `"${search}"` : "Sarees"}
      intro={
        search
          ? undefined
          : "Everything we currently hold, from a three-thousand-rupee cotton to a wedding Kanchipuram. Filter by weave, colour or occasion, or ask us and we will point you at the right three."
      }
      breadcrumb={[{ label: "Home", href: "/" }, { label: search ? "Search" : "Sarees" }]}
    />
  );
}
