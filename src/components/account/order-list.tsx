import Link from "next/link";

import { Media, ratio } from "@/components/ui/media";
import type { Order } from "@/lib/types";
import { cn, formatDate, formatPrice, pluralise } from "@/lib/utils";

/**
 * Order status, as a word rather than a coloured pill. The only colour is on
 * the two states a customer needs to act on or worry about.
 */
const STATUS_TONE: Record<Order["status"], string> = {
  pending: "text-terracotta",
  confirmed: "text-ink",
  processing: "text-ink",
  shipped: "text-ink",
  delivered: "text-success",
  cancelled: "text-taupe",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Being packed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusLabel({ status }: { status: Order["status"] }) {
  return (
    <span className={cn("text-[0.6875rem] uppercase tracking-[0.16em]", STATUS_TONE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <li className="border-b border-stone py-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <Link
            href={`/account/orders/${order.id}`}
            className="tnum link-quiet text-[0.9375rem] text-ink"
          >
            {order.orderNumber}
          </Link>
          <p className="mt-1 text-[0.75rem] text-taupe">
            {formatDate(order.createdAt)} &middot; {itemCount}{" "}
            {pluralise(itemCount, "piece")}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <OrderStatusLabel status={order.status} />
          <span className="tnum text-[0.9375rem] text-ink">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-6">
        <div className="flex gap-2">
          {order.items.slice(0, 4).map((item) => (
            <div key={item.id} className={cn("relative w-14 overflow-hidden", ratio.product)}>
              <Media image={item.image} className="absolute inset-0" sizes="56px" />
            </div>
          ))}
          {order.items.length > 4 ? (
            <span className="self-end text-[0.75rem] text-taupe">
              +{order.items.length - 4}
            </span>
          ) : null}
        </div>

        <Link
          href={`/account/orders/${order.id}`}
          className="link-quiet shrink-0 text-[0.6875rem] uppercase tracking-[0.16em]"
        >
          View order
        </Link>
      </div>
    </li>
  );
}
