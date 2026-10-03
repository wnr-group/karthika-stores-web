/**
 * Marketplace-level configuration: the commission override chain,
 * promotions and homepage banners.
 */

import type { Banner, CommissionRule, Promotion } from "@/lib/types";

import { daysAgo, daysAhead } from "./clock";
import { photo } from "./images";

/* -------------------------------------------------------------------------
   Commission rules. Vendor- and product-level overrides also live on the
   vendor and product rows themselves (`commissionRate`).
   ------------------------------------------------------------------------- */

function rule(id: string, scope: CommissionRule["scope"], scopeId: string | null, rate: number, note: string | null = null): CommissionRule {
  return { id, scope, scopeId, rate, note, createdAt: daysAgo(400), updatedAt: daysAgo(30) };
}

export const commissionRules: CommissionRule[] = [
  rule("com-global", "global", null, 10, "Platform default"),
  rule("com-fashion", "category", "cat-fashion", 12, "Fashion carries higher returns handling"),
  rule("com-jewellery", "category", "cat-jewellery", 11),
  rule("com-food", "category", "cat-food", 8, "Low-margin category"),
  rule("com-groceries", "category", "cat-groceries", 6, "Staples: thin margins"),
  rule("com-electronics", "category", "cat-electronics", 6, "Electronics: thin margins"),
  rule("com-svc-photo", "category", "cat-svc-photography", 12),
  rule("com-svc-beauty", "category", "cat-svc-beauty", 15),
  rule("com-svc-catering", "category", "cat-svc-catering", 8),
  rule("com-product-cane", "product", "prd-crh-005", 9, "Promotional rate for launch"),
];

/* -------------------------------------------------------------------------
   Promotions
   ------------------------------------------------------------------------- */

export const promotions: Promotion[] = [
  {
    id: "promo-welcome",
    vendorId: null,
    type: "coupon",
    title: "Rs 150 off your first order",
    description: "For new customers, on any order above Rs 999. Funded by Haat, so every seller gets paid in full.",
    code: "WELCOME150",
    discountType: "fixed",
    value: 150,
    minSubtotal: 999,
    maxDiscount: null,
    categoryIds: [],
    productIds: [],
    startsAt: daysAgo(120),
    endsAt: daysAhead(120),
    usageLimit: null,
    usageCount: 1842,
    isActive: true,
    image: null,
    createdAt: daysAgo(120),
  },
  {
    id: "promo-festive",
    vendorId: null,
    type: "coupon",
    title: "Festive Week: 10% off gifting",
    description: "10% off sweets, hampers, brass and jewellery, up to Rs 500.",
    code: "FESTIVE10",
    discountType: "percent",
    value: 10,
    minSubtotal: 1499,
    maxDiscount: 500,
    categoryIds: ["cat-sweets-snacks", "cat-gift-hampers", "cat-handicrafts", "cat-jewellery"],
    productIds: [],
    startsAt: daysAgo(5),
    endsAt: daysAhead(9),
    usageLimit: 5000,
    usageCount: 612,
    isActive: true,
    image: photo("promo-sale", "saffron", "Festive gift boxes"),
    createdAt: daysAgo(8),
  },
  {
    id: "promo-local",
    vendorId: null,
    type: "automatic",
    title: "Free local delivery this weekend",
    description: "Food and flowers from Chennai kitchens and florists, delivered free on orders over Rs 499.",
    code: null,
    discountType: "free_shipping",
    value: 0,
    minSubtotal: 499,
    maxDiscount: null,
    categoryIds: ["cat-food", "cat-flowers"],
    productIds: [],
    startsAt: daysAgo(1),
    endsAt: daysAhead(2),
    usageLimit: null,
    usageCount: 230,
    isActive: true,
    image: photo("promo-local", "olive", "Delivery rider on a motorbike"),
    createdAt: daysAgo(3),
  },
  {
    id: "promo-tech-flash",
    vendorId: "vendor-techhub",
    type: "flash_sale",
    title: "Audio flash sale",
    description: "Up to 30% off headphones and earbuds, for 72 hours.",
    code: null,
    discountType: "percent",
    value: 30,
    minSubtotal: 0,
    maxDiscount: null,
    categoryIds: ["cat-audio"],
    productIds: ["prd-thb-001", "prd-thb-002"],
    startsAt: daysAgo(1),
    endsAt: daysAhead(2),
    usageLimit: null,
    usageCount: 184,
    isActive: true,
    image: photo("anc-wireless-headphones", "charcoal", "Wireless headphones"),
    createdAt: daysAgo(2),
  },
  {
    id: "promo-ziva",
    vendorId: "vendor-ziva",
    type: "coupon",
    title: "Ziva: 15% off bridal sets",
    description: "15% off bridal and temple jewellery from Ziva.",
    code: "ZIVABRIDE15",
    discountType: "percent",
    value: 15,
    minSubtotal: 3000,
    maxDiscount: 2000,
    categoryIds: [],
    productIds: ["prd-jwl-001", "prd-jwl-006"],
    startsAt: daysAgo(20),
    endsAt: daysAhead(40),
    usageLimit: 300,
    usageCount: 41,
    isActive: true,
    image: photo("bridal-choker-set", "saffron", "Bridal kundan choker set"),
    createdAt: daysAgo(20),
  },
  {
    id: "promo-crumb",
    vendorId: "vendor-crumb",
    type: "coupon",
    title: "Crumb & Co.: Rs 100 off cakes",
    description: "Rs 100 off any cake over Rs 900.",
    code: "CAKEDAY",
    discountType: "fixed",
    value: 100,
    minSubtotal: 900,
    maxDiscount: null,
    categoryIds: [],
    productIds: ["prd-crb-001", "prd-crb-005"],
    startsAt: daysAgo(10),
    endsAt: daysAhead(20),
    usageLimit: null,
    usageCount: 77,
    isActive: true,
    image: null,
    createdAt: daysAgo(10),
  },
  {
    id: "promo-saanjh",
    vendorId: "vendor-saanjh",
    type: "automatic",
    title: "Saanjh: free shipping on everything",
    description: "No minimum, this month only.",
    code: null,
    discountType: "free_shipping",
    value: 0,
    minSubtotal: 0,
    maxDiscount: null,
    categoryIds: [],
    productIds: [],
    startsAt: daysAgo(40),
    endsAt: daysAgo(10),
    usageLimit: null,
    usageCount: 260,
    isActive: false,
    image: null,
    createdAt: daysAgo(40),
  },
];

/* -------------------------------------------------------------------------
   Homepage banners (admin-managed)
   ------------------------------------------------------------------------- */

export const banners: Banner[] = [
  {
    id: "banner-marketplace",
    eyebrow: "Independent businesses, one marketplace",
    headline: "Discover products, local brands & services",
    body: "Shop from independent businesses and discover everything from fashion and jewellery to food, lifestyle products and local services.",
    ctaLabel: "Start exploring",
    ctaHref: "/categories",
    secondaryLabel: "Book a service",
    secondaryHref: "/services",
    image: photo("hero-market", "terracotta", "A vibrant market stall"),
    isActive: true,
    displayOrder: 1,
  },
];
