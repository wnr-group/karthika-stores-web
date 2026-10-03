/**
 * Fulfilment and location rules.
 *
 * Not every item ships: a saree goes by courier, a cake goes out with the
 * bakery's rider or waits at the counter, an e-invite arrives by email, and a
 * makeup artist is booked rather than delivered. Location decides which of
 * those a customer in a given city can actually use.
 */

import { cityName, commerce } from "@/lib/site";
import type {
  FulfillmentType,
  OrderStatus,
  Product,
  Service,
  Vendor,
  VendorOrderStatus,
} from "@/lib/types";

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  shipping: "Shipping",
  local_delivery: "Local delivery",
  pickup: "Pickup",
  digital: "Digital delivery",
  service_booking: "Service booking",
};

export const FULFILLMENT_DESCRIPTIONS: Record<FulfillmentType, string> = {
  shipping: "Tracked courier anywhere in India",
  local_delivery: "Delivered by the seller's own rider",
  pickup: "Collect from the seller",
  digital: "Sent to your email, nothing ships",
  service_booking: "Delivered in person at the booked time",
};

/** Types that work anywhere in the country, whatever the customer's city. */
const NATIONWIDE: FulfillmentType[] = ["shipping", "digital"];

/**
 * The fulfilment types a product can use for a customer in `city`. Local
 * delivery and pickup only count where the vendor actually operates.
 */
export function availableFulfillment(
  product: Pick<Product, "fulfillmentTypes">,
  vendor: Pick<Vendor, "city" | "settings">,
  city: string | null | undefined,
): FulfillmentType[] {
  if (!city) return product.fulfillmentTypes;
  const local = vendor.city === city || vendor.settings.deliveryZones.includes(city);
  return product.fulfillmentTypes.filter((type) => NATIONWIDE.includes(type) || local);
}

export function isProductAvailableIn(
  product: Pick<Product, "fulfillmentTypes">,
  vendor: Pick<Vendor, "city" | "settings">,
  city: string | null | undefined,
): boolean {
  return availableFulfillment(product, vendor, city).length > 0;
}

/** True when the product is local-only and the vendor serves this city. */
export function isLocalTo(
  product: Pick<Product, "fulfillmentTypes">,
  vendor: Pick<Vendor, "city" | "settings">,
  city: string | null | undefined,
): boolean {
  if (!city) return false;
  const local = vendor.city === city || vendor.settings.deliveryZones.includes(city);
  return local && product.fulfillmentTypes.some((type) => type === "local_delivery" || type === "pickup");
}

export function isServiceAvailableIn(service: Pick<Service, "serviceArea" | "modes" | "city">, city: string | null | undefined) {
  if (!city) return true;
  return service.modes.includes("online") || service.city === city || service.serviceArea.includes(city);
}

/* -------------------------------------------------------------------------
   Fees and estimates for one vendor group
   ------------------------------------------------------------------------- */

export function fulfillmentFee(
  type: FulfillmentType,
  vendor: Pick<Vendor, "settings">,
  subtotal: number,
): number {
  if (subtotal === 0) return 0;
  switch (type) {
    case "shipping": {
      const threshold = vendor.settings.freeShippingThreshold ?? commerce.freeShippingThreshold;
      return subtotal >= threshold ? 0 : vendor.settings.shippingFee;
    }
    case "local_delivery":
      return vendor.settings.localDeliveryFee;
    default:
      return 0;
  }
}

export function freeShippingRemaining(type: FulfillmentType, vendor: Pick<Vendor, "settings">, subtotal: number) {
  if (type !== "shipping" || vendor.settings.shippingFee === 0) return 0;
  const threshold = vendor.settings.freeShippingThreshold ?? commerce.freeShippingThreshold;
  return Math.max(0, threshold - subtotal);
}

export function fulfillmentEstimate(type: FulfillmentType, vendor: Pick<Vendor, "settings" | "city">): string {
  switch (type) {
    case "shipping": {
      const days = vendor.settings.processingDays;
      return `Ships in ${days}-${days + 1} days, delivered in ${days + 3}-${days + 6}`;
    }
    case "local_delivery":
      return `Delivered in ${cityName(vendor.city)} by the seller`;
    case "pickup":
      return vendor.settings.pickupAddress ? `Pick up at ${vendor.settings.pickupAddress}` : "Pick up from the seller";
    case "digital":
      return "Delivered by email";
    case "service_booking":
      return "At your booked time";
  }
}

/* -------------------------------------------------------------------------
   Status language

   One vendor order can be shipped while another is still being baked, so
   statuses are worded per fulfilment type and rolled up for the customer.
   ------------------------------------------------------------------------- */

export function vendorOrderStatusLabel(status: VendorOrderStatus, type: FulfillmentType): string {
  if (status === "shipped") {
    if (type === "local_delivery") return "Out for delivery";
    if (type === "pickup") return "Ready for pickup";
    if (type === "digital") return "Sent";
  }
  if (status === "delivered" && type === "pickup") return "Collected";
  return {
    new: "New",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  }[status];
}

/** Rolls the vendor orders up into one customer-facing status. */
export function aggregateOrderStatus(statuses: VendorOrderStatus[]): OrderStatus {
  if (statuses.length === 0) return "pending";
  const live = statuses.filter((status) => status !== "cancelled");
  if (live.length === 0) return "cancelled";
  if (live.every((status) => status === "returned")) return "returned";
  if (live.every((status) => status === "delivered" || status === "returned")) return "delivered";
  if (live.some((status) => status === "shipped" || status === "delivered")) return "shipped";
  if (live.some((status) => status === "processing")) return "processing";
  return "confirmed";
}
