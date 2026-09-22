import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RazorpayPayButton } from "@/components/checkout/razorpay-pay-button";
import { OrderStatusLabel } from "@/components/account/order-list";
import { Media, ratio } from "@/components/ui/media";
import { Breadcrumb } from "@/components/ui/primitives";
import { getRepository } from "@/lib/data/repository";
import { publicKeyId } from "@/lib/payments/razorpay";
import { cn, formatDate, formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ number: string }>;
}

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: PageProps) {
  const { number } = await params;
  const repository = await getRepository();
  const order = await repository.getOrderByNumber(number);

  if (!order) notFound();

  const awaitingPayment = order.paymentMethod === "razorpay" && order.paymentStatus === "pending";
  const keyId = publicKeyId();

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Your order" }]} />

      <header className="mt-8 border-b border-stone pb-10">
        <p className="eyebrow mb-4">
          {awaitingPayment ? "Order received" : "Thank you"}
        </p>
        <h1 className="display-lg">
          {awaitingPayment ? "One step left" : "Your order is confirmed"}
        </h1>
        <p className="mt-4 text-[0.9375rem] text-graphite">
          Order <span className="tnum text-ink">{order.orderNumber}</span>, placed{" "}
          {formatDate(order.createdAt)}. A confirmation has gone to {order.email}.
        </p>

        {awaitingPayment && keyId ? (
          <RazorpayPayButton
            orderNumber={order.orderNumber}
            amount={order.totalAmount}
            email={order.email}
            phone={order.phone}
            publicKeyId={keyId}
          />
        ) : null}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">Items</h2>
          <ul className="mt-6 divide-y divide-stone">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className={cn("relative w-16 shrink-0 overflow-hidden", ratio.product)}>
                  <Media image={item.image} className="absolute inset-0" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1rem] leading-snug text-ink">{item.name}</p>
                  <p className="mt-0.5 text-[0.75rem] text-taupe">
                    {item.fabric} &middot; Qty {item.quantity}
                  </p>
                </div>
                <span className="tnum shrink-0 text-[0.8125rem] text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-stone pt-5 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-taupe">Subtotal</dt>
              <dd className="tnum text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-taupe">Shipping</dt>
              <dd className="tnum text-ink">
                {order.shippingAmount === 0 ? "Complimentary" : formatPrice(order.shippingAmount)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-stone pt-3">
              <dt className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink">Total</dt>
              <dd className="tnum text-lg text-ink">{formatPrice(order.totalAmount)}</dd>
            </div>
          </dl>
        </div>

        <aside className="lg:col-span-5">
          <div className="border border-stone bg-paper p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">Status</h2>
              <OrderStatusLabel status={order.status} />
            </div>

            {order.trackingNumber ? (
              <p className="mt-4 text-[0.8125rem] text-graphite">
                {order.courier ? `${order.courier} · ` : ""}
                <span className="tnum">{order.trackingNumber}</span>
              </p>
            ) : null}

            <h3 className="mt-8 text-[0.6875rem] uppercase tracking-[0.2em] text-ink">
              Delivery address
            </h3>
            <address className="mt-3 text-[0.8125rem] not-italic leading-relaxed text-graphite">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.addressLine1}
              <br />
              {order.shippingAddress.addressLine2 ? (
                <>
                  {order.shippingAddress.addressLine2}
                  <br />
                </>
              ) : null}
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              <span className="tnum">{order.shippingAddress.phone}</span>
            </address>

            <h3 className="mt-8 text-[0.6875rem] uppercase tracking-[0.2em] text-ink">Payment</h3>
            <p className="mt-3 text-[0.8125rem] text-graphite">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}
            </p>
          </div>

          <p className="mt-6 text-[0.8125rem] text-taupe">
            Questions about this order?{" "}
            <Link href="/contact" className="link-rule text-ink">
              Get in touch
            </Link>{" "}
            with your order number.
          </p>
        </aside>
      </div>
    </div>
  );
}
