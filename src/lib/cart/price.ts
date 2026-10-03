import "server-only";

import { getRepository } from "@/lib/data/repository";
import {
  availableFulfillment,
  freeShippingRemaining,
  fulfillmentEstimate,
  fulfillmentFee,
} from "@/lib/marketplace/fulfillment";
import { evaluatePromotion, isPromotionLive } from "@/lib/marketplace/promotions";
import { commerce } from "@/lib/site";
import type {
  AppliedCoupon,
  CartLine,
  CartLineInput,
  CartVendorGroup,
  FulfillmentType,
  PricedCart,
  Vendor,
} from "@/lib/types";

/**
 * Prices a cart from the catalogue.
 *
 * The browser sends product ids, variant ids, quantities and an optional
 * coupon code, and nothing else. Every price, stock check, delivery fee and
 * discount is computed here, from the database. A tampered price in a
 * request body has nowhere to land.
 *
 * The cart is split into one group per vendor (digital goods get their own
 * group), because each becomes its own vendor order with its own delivery.
 */

export interface PriceCartOptions {
  couponCode?: string | null;
  /** The customer's chosen fulfilment per group key. Invalid choices fall back. */
  fulfillment?: Record<string, FulfillmentType>;
  /** City slug, which decides whether local delivery and pickup are offered. */
  city?: string | null;
}

export function lineKey(input: { productId: string; variantId?: string; customization?: string | null }): string {
  return [input.productId, input.variantId ?? "", input.customization?.trim() ?? ""].join("|");
}

export async function priceCart(inputs: CartLineInput[], options: PriceCartOptions = {}): Promise<PricedCart> {
  const cleaned = normalise(inputs);

  if (cleaned.length === 0) {
    return { lines: [], groups: [], totals: emptyTotals(), coupon: null, couponError: null, removed: [] };
  }

  const repository = await getRepository();
  const products = await repository.getProductsByIds(cleaned.map((line) => line.productId));
  const byId = new Map(products.map((product) => [product.id, product]));
  const vendors = new Map<string, Vendor>();
  for (const vendorId of new Set(products.map((product) => product.vendorId))) {
    const vendor = await repository.getVendorById(vendorId);
    if (vendor) vendors.set(vendorId, vendor);
  }

  const lines: CartLine[] = [];
  const removed: PricedCart["removed"] = [];

  for (const input of cleaned) {
    const product = byId.get(input.productId);
    const vendor = product ? vendors.get(product.vendorId) : undefined;

    if (!product || !vendor || !product.isActive || product.status !== "approved" || vendor.status !== "approved") {
      removed.push({ productId: input.productId, name: product?.name ?? "An item", reason: "no longer available" });
      continue;
    }

    const variant =
      product.variants.find((entry) => entry.id === input.variantId && entry.isActive) ??
      (input.variantId
        ? undefined
        : product.variants.find((entry) => entry.isActive && (!product.trackInventory || entry.stockQuantity > 0)) ??
          product.variants[0]);
    if (!variant) {
      removed.push({ productId: product.id, name: product.name, reason: "that option is no longer available" });
      continue;
    }

    if (product.trackInventory && variant.stockQuantity <= 0) {
      removed.push({ productId: product.id, name: `${product.name}${variant.title !== "Default" ? ` (${variant.title})` : ""}`, reason: "sold out" });
      continue;
    }

    if (product.customization?.required && !input.customization?.trim()) {
      removed.push({ productId: product.id, name: product.name, reason: `needs "${product.customization.label}" filled in` });
      continue;
    }

    const reachable = availableFulfillment(product, vendor, options.city ?? null);
    if (reachable.length === 0) {
      removed.push({ productId: product.id, name: product.name, reason: "not available in your city" });
      continue;
    }

    // Quietly clamp rather than reject: someone who asked for three when two
    // remain should get two and be told, not an error page.
    const available = product.trackInventory ? variant.stockQuantity : commerce.maxLineQuantity;
    const quantity = Math.min(input.quantity, available, commerce.maxLineQuantity);
    if (quantity < input.quantity) {
      removed.push({ productId: product.id, name: product.name, reason: `only ${available} left, quantity reduced` });
    }

    const customization = product.customization ? input.customization?.trim().slice(0, product.customization.maxLength) || null : null;

    lines.push({
      key: lineKey({ productId: product.id, variantId: variant.id, customization }),
      productId: product.id,
      variantId: variant.id,
      variantTitle: variant.title,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      color: product.color,
      image: product.images[0]!,
      unitPrice: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity,
      lineTotal: variant.price * quantity,
      available,
      inStock: true,
      fulfillmentTypes: reachable,
      customization,
    });
  }

  /* --- Group by vendor --- */
  const groups: CartVendorGroup[] = [];
  for (const line of lines) {
    const digital = line.fulfillmentTypes.length === 1 && line.fulfillmentTypes[0] === "digital";
    const key = `${line.vendorId}:${digital ? "digital" : "physical"}`;
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      const vendor = vendors.get(line.vendorId)!;
      group = {
        key,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorSlug: vendor.slug,
        vendorCity: vendor.city,
        lineKeys: [],
        options: [...line.fulfillmentTypes],
        fulfillmentType: line.fulfillmentTypes[0]!,
        subtotal: 0,
        shipping: 0,
        discount: 0,
        freeShippingRemaining: 0,
        estimate: "",
      };
      groups.push(group);
    }
    group.lineKeys.push(line.key);
    group.subtotal += line.lineTotal;
    const narrowed = group.options.filter((type) => line.fulfillmentTypes.includes(type));
    // Lines with nothing in common still ship together: fall back to the
    // most universal option the group already had.
    group.options = narrowed.length ? narrowed : group.options;
  }

  for (const group of groups) {
    const vendor = vendors.get(group.vendorId)!;
    const chosen = options.fulfillment?.[group.key];
    group.fulfillmentType = chosen && group.options.includes(chosen) ? chosen : preferred(group.options);
    group.shipping = fulfillmentFee(group.fulfillmentType, vendor, group.subtotal);
    group.freeShippingRemaining = freeShippingRemaining(group.fulfillmentType, vendor, group.subtotal);
    group.estimate = fulfillmentEstimate(group.fulfillmentType, vendor);
  }

  /* --- Promotions: a typed coupon, otherwise the best automatic offer --- */
  let coupon: AppliedCoupon | null = null;
  let couponError: string | null = null;
  const categoriesOf = (productId: string) => byId.get(productId)?.categoryTrail.map((category) => category.id) ?? [];

  const code = options.couponCode?.trim();
  if (code) {
    const promotion = await repository.getPromotionByCode(code);
    if (!promotion || promotion.type !== "coupon") {
      couponError = "That code is not valid.";
    } else {
      const result = evaluatePromotion(promotion, lines, groups, categoriesOf);
      if (result.ok) {
        applyDiscount(groups, result.byGroup);
        coupon = { code: promotion.code!, title: promotion.title, vendorId: promotion.vendorId, discount: result.discount };
      } else {
        couponError = result.error;
      }
    }
  }

  if (!coupon) {
    const automatic = (await repository.listPromotions({ activeOnly: true })).filter(
      (promotion) => promotion.type === "automatic" && isPromotionLive(promotion),
    );
    let best: { title: string; vendorId: string | null; result: ReturnType<typeof evaluatePromotion> } | null = null;
    for (const promotion of automatic) {
      const result = evaluatePromotion(promotion, lines, groups, categoriesOf);
      if (result.ok && (!best || result.discount > best.result.discount)) {
        best = { title: promotion.title, vendorId: promotion.vendorId, result };
      }
    }
    if (best) {
      applyDiscount(groups, best.result.byGroup);
      coupon = { code: "", title: best.title, vendorId: best.vendorId, discount: best.result.discount };
    }
  }

  return { lines, groups, totals: computeTotals(groups), coupon, couponError, removed };
}

/** Courier where possible, then local delivery, then pickup. */
function preferred(types: FulfillmentType[]): FulfillmentType {
  const order: FulfillmentType[] = ["shipping", "local_delivery", "digital", "pickup", "service_booking"];
  return [...types].sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] ?? "shipping";
}

function applyDiscount(groups: CartVendorGroup[], byGroup: Map<string, number>) {
  for (const group of groups) {
    group.discount = Math.min(group.subtotal + group.shipping, byGroup.get(group.key) ?? 0);
  }
}

/** Drops duplicates, non-positive quantities and anything malformed. */
function normalise(inputs: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, CartLineInput>();

  for (const input of inputs) {
    if (typeof input?.productId !== "string" || !input.productId) continue;
    const quantity = Math.floor(Number(input.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const variantId = typeof input.variantId === "string" ? input.variantId : undefined;
    const customization = typeof input.customization === "string" ? input.customization.slice(0, 300) : undefined;

    const key = lineKey({ productId: input.productId, variantId, customization });
    const existing = merged.get(key);
    merged.set(key, {
      productId: input.productId,
      variantId,
      customization,
      quantity: Math.min(commerce.maxLineQuantity, (existing?.quantity ?? 0) + quantity),
    });
  }

  return [...merged.values()];
}

export function computeTotals(groups: CartVendorGroup[]) {
  const subtotal = groups.reduce((total, group) => total + group.subtotal, 0);
  const shipping = groups.reduce((total, group) => total + group.shipping, 0);
  const discount = groups.reduce((total, group) => total + group.discount, 0);
  const outstanding = groups.map((group) => group.freeShippingRemaining).filter((value) => value > 0);

  return {
    subtotal,
    shipping,
    discount,
    freeShippingRemaining: outstanding.length ? Math.min(...outstanding) : 0,
    total: subtotal + shipping - discount,
  };
}

function emptyTotals() {
  return { subtotal: 0, shipping: 0, discount: 0, freeShippingRemaining: 0, total: 0 };
}
