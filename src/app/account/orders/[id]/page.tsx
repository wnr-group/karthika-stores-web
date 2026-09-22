import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OrderStatusLabel } from "@/components/account/order-list";
import { Media, ratio } from "@/components/ui/media";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { cn, formatDate, formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export default async function AccountOrderPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/orders");

  const repository = await getRepository();
  const order = await repository.getOrderById(id);

  // Never confirm to a signed-in customer that an id belongs to someone else.
  if (!order || order.userId !== user.uid) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-stone pb-4">
        <div>
          <h2 className="display-sm">
            Order <span className="tnum">{order.orderNumber}</span>
          </h2>
          <p className="mt-1 text-[0.75rem] text-taupe">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusLabel status={order.status} />
      </div>

      {order.trackingNumber ? (
        <p className="mt-4 text-[0.8125rem] text-graphite">
          {order.courier ? `${order.courier} · ` : ""}
          <span className="tnum">{order.trackingNumber}</span>
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-stone">
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

      <div className="mt-6 grid gap-10 border-t border-stone pt-6 sm:grid-cols-2">
        <div>
          <h3 className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink">
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
          </address>
        </div>

        <dl className="space-y-3 text-[0.875rem]">
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
    </div>
  );
}
