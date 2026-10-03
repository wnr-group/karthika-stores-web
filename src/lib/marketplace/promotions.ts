/**
 * Promotion evaluation. Pure: given a promotion and a priced cart, says how
 * much it takes off and from which vendor groups, or why it does not apply.
 *
 * A marketplace promotion (vendorId null) is funded by the platform and can
 * touch every group; a vendor's promotion only ever discounts that vendor's
 * own lines.
 */

import type { CartLine, CartVendorGroup, Promotion } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export interface PromotionResult {
  ok: boolean;
  error: string | null;
  discount: number;
  /** Discount attributed to each group key, so each vendor order carries its share. */
  byGroup: Map<string, number>;
}

function fail(error: string): PromotionResult {
  return { ok: false, error, discount: 0, byGroup: new Map() };
}

export function isPromotionLive(promotion: Promotion, at = new Date().toISOString()): boolean {
  return (
    promotion.isActive &&
    promotion.startsAt <= at &&
    promotion.endsAt > at &&
    (promotion.usageLimit === null || promotion.usageCount < promotion.usageLimit)
  );
}

export function evaluatePromotion(
  promotion: Promotion,
  lines: CartLine[],
  groups: CartVendorGroup[],
  /** Category ids (with ancestors) per product id. */
  categoriesOf: (productId: string) => string[],
): PromotionResult {
  if (!isPromotionLive(promotion)) return fail("This code has expired or is no longer available.");

  const eligible = lines.filter((line) => {
    if (promotion.vendorId && line.vendorId !== promotion.vendorId) return false;
    const scoped = promotion.categoryIds.length > 0 || promotion.productIds.length > 0;
    if (!scoped) return true;
    return (
      promotion.productIds.includes(line.productId) ||
      categoriesOf(line.productId).some((id) => promotion.categoryIds.includes(id))
    );
  });

  if (eligible.length === 0) return fail("Nothing in your bag qualifies for this code.");

  const eligibleSubtotal = eligible.reduce((sum, line) => sum + line.lineTotal, 0);
  if (eligibleSubtotal < promotion.minSubtotal) {
    return fail(`Add ${formatPrice(promotion.minSubtotal - eligibleSubtotal)} more of qualifying items to use this code.`);
  }

  const eligibleKeys = new Set(eligible.map((line) => line.key));
  const groupShare = groups
    .map((group) => ({
      group,
      subtotal: lines
        .filter((line) => group.lineKeys.includes(line.key) && eligibleKeys.has(line.key))
        .reduce((sum, line) => sum + line.lineTotal, 0),
    }))
    .filter((entry) => entry.subtotal > 0);

  const byGroup = new Map<string, number>();

  if (promotion.discountType === "free_shipping") {
    for (const { group } of groupShare) {
      if (group.shipping > 0) byGroup.set(group.key, group.shipping);
    }
    const discount = [...byGroup.values()].reduce((sum, value) => sum + value, 0);
    if (discount === 0) return fail("Delivery is already free on this order.");
    return { ok: true, error: null, discount, byGroup };
  }

  let discount =
    promotion.discountType === "percent"
      ? Math.round((eligibleSubtotal * promotion.value) / 100)
      : Math.min(promotion.value, eligibleSubtotal);
  if (promotion.maxDiscount !== null) discount = Math.min(discount, promotion.maxDiscount);

  // Spread the discount across groups by their share of the eligible subtotal,
  // giving any rounding remainder to the largest group.
  let assigned = 0;
  const sorted = [...groupShare].sort((a, b) => b.subtotal - a.subtotal);
  sorted.forEach(({ group, subtotal }, index) => {
    const share = index === sorted.length - 1 ? discount - assigned : Math.floor((discount * subtotal) / eligibleSubtotal);
    assigned += share;
    byGroup.set(group.key, share);
  });

  return { ok: true, error: null, discount, byGroup };
}
