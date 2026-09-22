import { NextResponse } from "next/server";

import { priceCart } from "@/lib/cart/price";
import type { CartLineInput } from "@/lib/types";

/**
 * Re-prices the bag from the catalogue. The browser sends ids and quantities
 * only; every price and stock check comes from the database, never the
 * request body. See lib/cart/price.ts.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lines?: CartLineInput[] } | null;
  const lines = Array.isArray(body?.lines) ? body.lines : [];

  const priced = await priceCart(lines);
  return NextResponse.json(priced);
}
