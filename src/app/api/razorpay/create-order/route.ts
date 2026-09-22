import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";

/** Creates a fresh Razorpay order for the "Pay now" button on the confirmation page. */
export async function POST(request: Request) {
  if (!isRazorpayConfigured) {
    return NextResponse.json({ message: "Online payment is not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => null)) as { orderNumber?: string } | null;
  if (!body?.orderNumber) {
    return NextResponse.json({ message: "Missing order number" }, { status: 400 });
  }

  const repository = await getRepository();
  const order = await repository.getOrderByNumber(body.orderNumber);

  if (!order || order.paymentMethod !== "razorpay" || order.paymentStatus !== "pending") {
    return NextResponse.json({ message: "This order cannot be paid" }, { status: 400 });
  }

  const razorpayOrder = await createRazorpayOrder({
    amountInRupees: order.totalAmount,
    receipt: order.orderNumber,
    notes: { orderNumber: order.orderNumber },
  });

  return NextResponse.json(razorpayOrder);
}
