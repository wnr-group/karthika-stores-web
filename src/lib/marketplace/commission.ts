/**
 * Commission resolution.
 *
 * The narrowest rule wins: product > vendor > category (nearest ancestor
 * first) > global > the marketplace default. A vendor's subscription plan
 * then takes its discount off whatever was resolved.
 *
 *   Product price  Rs 1,000
 *   Commission     10%       -> platform keeps Rs 100
 *   Vendor gets    Rs 900
 */

import { marketplace, plans } from "@/lib/site";
import type { CommissionRule, CommissionScope, VendorPlan } from "@/lib/types";

export interface CommissionContext {
  rules: CommissionRule[];
  productId?: string;
  productRate?: number | null;
  vendorId?: string;
  vendorRate?: number | null;
  vendorPlan?: VendorPlan;
  /** Root first, as `categoryTrail` returns it. */
  categoryTrailIds?: string[];
}

export interface ResolvedCommission {
  rate: number;
  scope: CommissionScope | "default";
  /** The rule's scope id, when a rule (rather than a listing field) decided. */
  source: string | null;
}

function ruleFor(rules: CommissionRule[], scope: CommissionScope, scopeId: string | null) {
  return rules.find((rule) => rule.scope === scope && rule.scopeId === scopeId);
}

export function resolveCommission(context: CommissionContext): ResolvedCommission {
  const { rules } = context;
  let resolved: ResolvedCommission | null = null;

  if (context.productRate != null) {
    resolved = { rate: context.productRate, scope: "product", source: context.productId ?? null };
  } else if (context.productId && ruleFor(rules, "product", context.productId)) {
    resolved = { rate: ruleFor(rules, "product", context.productId)!.rate, scope: "product", source: context.productId };
  } else if (context.vendorRate != null) {
    resolved = { rate: context.vendorRate, scope: "vendor", source: context.vendorId ?? null };
  } else if (context.vendorId && ruleFor(rules, "vendor", context.vendorId)) {
    resolved = { rate: ruleFor(rules, "vendor", context.vendorId)!.rate, scope: "vendor", source: context.vendorId };
  } else {
    for (const categoryId of [...(context.categoryTrailIds ?? [])].reverse()) {
      const rule = ruleFor(rules, "category", categoryId);
      if (rule) {
        resolved = { rate: rule.rate, scope: "category", source: categoryId };
        break;
      }
    }
  }

  if (!resolved) {
    const global = ruleFor(rules, "global", null);
    resolved = global
      ? { rate: global.rate, scope: "global", source: null }
      : { rate: marketplace.defaultCommissionRate, scope: "default", source: null };
  }

  const discount = plans.find((plan) => plan.id === context.vendorPlan)?.commissionDiscount ?? 0;
  return { ...resolved, rate: Math.max(0, resolved.rate - discount) };
}

/** Commission on an amount, rounded to the rupee. */
export function commissionOn(amount: number, rate: number): number {
  return Math.round((amount * rate) / 100);
}
