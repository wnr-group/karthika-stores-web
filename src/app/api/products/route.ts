import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";

/** Looks products up by id, for the wishlist view. */
export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids");
  if (!ids) return NextResponse.json({ products: [] });

  const repository = await getRepository();
  const products = await repository.getProductsByIds(
    ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  return NextResponse.json({ products });
}
