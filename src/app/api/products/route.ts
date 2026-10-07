import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";

/**
 * Looks products up by id, for the wishlist view.
 *
 * Only products on sale come back in full. Saved products that have since
 * been archived, hidden or whose seller is no longer approved come back in
 * `unavailable` with just enough to name them, so the wishlist can say so
 * instead of offering them for sale.
 */
export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids");
  if (!ids) return NextResponse.json({ products: [], unavailable: [] });

  const repository = await getRepository();
  const found = await repository.getProductsByIds(
    ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  const vendorStatus = new Map<string, string | undefined>();
  for (const vendorId of new Set(found.map((product) => product.vendorId))) {
    vendorStatus.set(vendorId, (await repository.getVendorById(vendorId))?.status);
  }

  const live = (product: (typeof found)[number]) =>
    product.status === "approved" && product.isActive && vendorStatus.get(product.vendorId) === "approved";

  return NextResponse.json({
    products: found.filter(live),
    unavailable: found
      .filter((product) => !live(product))
      .map((product) => ({ id: product.id, name: product.name, image: product.images[0] ?? null })),
  });
}
