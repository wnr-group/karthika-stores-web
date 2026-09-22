"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/**
 * Opens Razorpay Checkout.js for an order that is still awaiting payment.
 *
 * The order already exists (created at /api/checkout, status "pending"); this
 * only collects the payment against it. Verification happens server-side at
 * /api/razorpay/verify, never on the strength of what the browser reports.
 */
export function RazorpayPayButton({
  orderNumber,
  amount,
  email,
  phone,
  publicKeyId,
}: {
  orderNumber: string;
  amount: number;
  email: string;
  phone: string;
  publicKeyId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);

    try {
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });

      if (!response.ok) throw new Error("Could not start the payment");

      const razorpayOrder = (await response.json()) as { id: string; amount: number };

      if (!window.Razorpay) throw new Error("Payment could not load");

      const checkout = new window.Razorpay({
        key: publicKeyId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: site.name,
        description: `Order ${orderNumber}`,
        prefill: { email, contact: phone },
        theme: { color: "#1f1c19" },
        handler: async (result: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              orderNumber,
              razorpayOrderId: result.razorpay_order_id,
              razorpayPaymentId: result.razorpay_payment_id,
              signature: result.razorpay_signature,
            }),
          }).catch(() => null);

          if (verify?.ok) {
            toast("Payment received", "success");
            router.refresh();
          } else {
            toast("We could not confirm that payment. Contact us if you were charged.", "error");
          }
          setBusy(false);
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });

      checkout.open();
    } catch {
      toast("We could not start the payment. Please try again.", "error");
      setBusy(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setReady(true)}
      />
      <button
        type="button"
        onClick={pay}
        disabled={!ready || busy}
        className="mt-6 h-12 w-full bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {busy ? "Opening payment..." : `Pay ${formatPrice(amount)} now`}
      </button>
    </>
  );
}
