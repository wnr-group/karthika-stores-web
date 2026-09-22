import { NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: { notes?: { orderNumber?: string } } };
    order?: { entity?: { notes?: { orderNumber?: string } } };
  };
}

/**
 * The server-to-server fallback. Checkout.js confirms most payments through
 * /api/razorpay/verify, but a closed tab or a dropped connection can leave an
 * order unconfirmed on our side even though Razorpay collected the money;
 * this webhook catches that case independently of the browser.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookPayload;

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ ok: true });
  }

  const orderNumber =
    event.payload?.payment?.entity?.notes?.orderNumber ??
    event.payload?.order?.entity?.notes?.orderNumber;

  if (!orderNumber) return NextResponse.json({ ok: true });

  const repository = await getRepository();
  const order = await repository.getOrderByNumber(orderNumber);
  if (!order) return NextResponse.json({ ok: true });

  await repository.updateOrder(order.id, { status: "confirmed", paymentStatus: "paid" });
  await repository.commitStock(order.id);

  return NextResponse.json({ ok: true });
}
