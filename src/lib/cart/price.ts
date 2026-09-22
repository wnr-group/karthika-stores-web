import "server-only";

import { getRepository } from "@/lib/data/repository";
import { commerce } from "@/lib/site";
import type { CartLine, CartLineInput, PricedCart } from "@/lib/types";

/**
 * Prices a cart from the catalogue.
 *
 * The browser sends product ids and quantities and nothing else. Every price,
 * every stock check and every total is computed here, from the database. A
 * tampered price in a request body has nowhere to land.
 */
export async function priceCart(inputs: CartLineInput[]): Promise<PricedCart> {
  const cleaned = normalise(inputs);

  if (cleaned.length === 0) {
    return { lines: [], totals: emptyTotals(), removed: [] };
  }

  const repository = await getRepository();
  const products = await repository.getProductsByIds(cleaned.map((line) => line.productId));
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines: CartLine[] = [];
  const removed: PricedCart["removed"] = [];

  for (const input of cleaned) {
    const product = byId.get(input.productId);

    if (!product || !product.isActive) {
      removed.push({
        productId: input.productId,
        name: product?.name ?? "A piece",
        reason: "no longer available",
      });
      continue;
    }

    if (product.stockQuantity <= 0) {
      removed.push({ productId: product.id, name: product.name, reason: "sold out" });
      continue;
    }

    // Quietly clamp rather than reject: someone who asked for three when two
    // remain should get two and be told, not an error page.
    const quantity = Math.min(input.quantity, product.stockQuantity, commerce.maxLineQuantity);

    if (quantity < input.quantity) {
      removed.push({
        productId: product.id,
        name: product.name,
        reason: `only ${product.stockQuantity} left, quantity reduced`,
      });
    }

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      fabric: product.fabric,
      color: product.color,
      image: product.images[0]!,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
      available: product.stockQuantity,
      inStock: true,
    });
  }

  return { lines, totals: computeTotals(lines), removed };
}

/** Drops duplicates, non-positive quantities and anything malformed. */
function normalise(inputs: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, number>();

  for (const input of inputs) {
    if (typeof input?.productId !== "string" || !input.productId) continue;
    const quantity = Math.floor(Number(input.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    merged.set(
      input.productId,
      Math.min(commerce.maxLineQuantity, (merged.get(input.productId) ?? 0) + quantity),
    );
  }

  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function computeTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const qualifies = subtotal >= commerce.freeShippingThreshold;
  const shipping = subtotal === 0 || qualifies ? 0 : commerce.standardShipping;

  return {
    subtotal,
    shipping,
    freeShippingRemaining: qualifies ? 0 : commerce.freeShippingThreshold - subtotal,
    total: subtotal + shipping,
  };
}

function emptyTotals() {
  return {
    subtotal: 0,
    shipping: 0,
    freeShippingRemaining: commerce.freeShippingThreshold,
    total: 0,
  };
}
