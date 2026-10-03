import { NextResponse } from "next/server";

import { priceCart } from "@/lib/cart/price";
import { checkoutSchema, fieldErrors } from "@/lib/checkout/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

/**
 * Places an order.
 *
 * Every price is re-read from the catalogue here; nothing the browser sends
 * about cost is trusted. Cash-on-delivery orders are confirmed immediately.
 * Razorpay orders are created "pending" and paid from the order confirmation
 * page, then confirmed by /api/razorpay/verify.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please check the form for errors.", errors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { contact, address, paymentMethod, saveAddress, lines } = parsed.data;

  const priced = await priceCart(lines);

  if (priced.lines.length === 0) {
    return NextResponse.json(
      { message: "Your bag is empty or nothing in it is available any more." },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const repository = await getRepository();

  if (user && saveAddress) {
    await repository.createAddress(user.uid, {
      label: "Home",
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: false,
    });
  }

  const order = await repository.createOrder({
    userId: user?.uid ?? null,
    customerName: address.name,
    email: contact.email,
    phone: contact.phone,
    shippingAddress: {
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    paymentMethod,
    // Both methods start pending: COD settles with the courier, Razorpay on
    // the confirmation page via /api/razorpay/verify.
    paymentStatus: "pending",
    couponCode: priced.coupon?.code || null,
    // One vendor order per group, each with its own delivery and discount.
    groups: priced.groups.map((group) => ({
      vendorId: group.vendorId,
      fulfillmentType: group.fulfillmentType,
      shippingAmount: group.shipping,
      discountAmount: group.discount,
      lines: priced.lines
        .filter((line) => group.lineKeys.includes(line.key))
        .map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          customization: line.customization,
        })),
    })),
  });

  if (paymentMethod === "cod") {
    await repository.updateOrder(order.id, { status: "confirmed" });
    await repository.commitStock(order.id);
  }

  return NextResponse.json({ orderNumber: order.orderNumber });
}
