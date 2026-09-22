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
    // Cash on delivery is settled with the courier, so it is "confirmed" the
    // moment the order is placed. A Razorpay order stays pending until the
    // customer pays on the confirmation page.
    paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    lines: priced.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    subtotal: priced.totals.subtotal,
    shippingAmount: priced.totals.shipping,
    totalAmount: priced.totals.total,
  });

  if (paymentMethod === "cod") {
    await repository.updateOrder(order.id, { status: "confirmed" });
    await repository.commitStock(order.id);
  }

  return NextResponse.json({ orderNumber: order.orderNumber });
}
