import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";

interface VerifyBody {
  orderNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  signature?: string;
}

/** Confirms a Razorpay payment against the order it was collected for. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyBody | null;

  if (!body?.orderNumber || !body.razorpayOrderId || !body.razorpayPaymentId || !body.signature) {
    return NextResponse.json({ message: "Missing payment details" }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    signature: body.signature,
  });

  if (!valid) {
    return NextResponse.json({ message: "That payment could not be verified" }, { status: 400 });
  }

  const repository = await getRepository();
  const order = await repository.getOrderByNumber(body.orderNumber);
  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  await repository.updateOrder(order.id, { status: "confirmed", paymentStatus: "paid" });
  await repository.commitStock(order.id);

  return NextResponse.json({ ok: true });
}
