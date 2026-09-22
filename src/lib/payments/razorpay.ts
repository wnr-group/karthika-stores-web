import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay helpers.
 *
 * Kept deliberately small: create an order, check a signature. The keys never
 * leave the server, and every signature comparison is constant-time so a
 * response cannot be timed to guess a digest.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export const isRazorpayConfigured = Boolean(KEY_ID && KEY_SECRET);

/** The public key id, safe to hand to Checkout.js in the browser. */
export function publicKeyId(): string | null {
  return KEY_ID ?? null;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Creates an order with Razorpay. Amounts are sent in paise, which is why
 * every rupee figure in this codebase is an integer.
 */
export async function createRazorpayOrder(input: {
  amountInRupees: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: input.amountInRupees * 100,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Razorpay rejected the order: ${response.status} ${detail}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/**
 * Verifies the signature returned by Checkout.js after a successful payment.
 * Razorpay signs `${razorpayOrderId}|${razorpayPaymentId}` with the key
 * secret; anything that does not match is treated as an unpaid order.
 */
export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  if (!KEY_SECRET) return false;

  const expected = createHmac("sha256", KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  return safeEqual(expected, input.signature);
}

/** Verifies a webhook against the raw request body, which must not be re-serialised. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;

  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // timingSafeEqual throws on a length mismatch, which is itself a leak of
  // one bit. Compare lengths first and return the same way for both cases.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
