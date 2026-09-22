import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OrderStatusLabel } from "@/components/account/order-list";
import { Media, ratio } from "@/components/ui/media";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import type { OrderStatus } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

async function updateOrder(id: string, formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user || !(await isAdmin(user))) return;

  const repository = await getRepository();
  const status = formData.get("status");
  const trackingNumber = formData.get("trackingNumber");
  const courier = formData.get("courier");

  await repository.updateOrder(id, {
    status: typeof status === "string" ? (status as OrderStatus) : undefined,
    trackingNumber: typeof trackingNumber === "string" && trackingNumber ? trackingNumber : null,
    courier: typeof courier === "string" && courier ? courier : null,
  });
}

export default async function AdminOrderPage({ params }: PageProps) {
  const { id } = await params;
  const repository = await getRepository();
  const order = await repository.getOrderById(id);

  if (!order) notFound();

  const saveOrder = updateOrder.bind(null, order.id);

  async function saveAndReturn(formData: FormData) {
    "use server";
    await saveOrder(formData);
    redirect(`/admin/orders/${order!.id}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-stone pb-4">
        <div>
          <h2 className="display-sm">
            Order <span className="tnum">{order.orderNumber}</span>
          </h2>
          <p className="mt-1 text-[0.75rem] text-taupe">
            {formatDate(order.createdAt)} &middot; {order.email} &middot; {order.phone}
          </p>
        </div>
        <OrderStatusLabel status={order.status} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ul className="divide-y divide-stone">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className={cn("relative w-16 shrink-0 overflow-hidden", ratio.product)}>
                  <Media image={item.image} className="absolute inset-0" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1rem] leading-snug text-ink">{item.name}</p>
                  <p className="mt-0.5 text-[0.75rem] text-taupe">Qty {item.quantity}</p>
                </div>
                <span className="tnum shrink-0 text-[0.8125rem] text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-stone pt-5">
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
              <br />
              <span className="tnum">{order.shippingAddress.phone}</span>
            </address>
          </div>
        </div>

        <form action={saveAndReturn} className="lg:col-span-5">
          <div className="border border-stone bg-paper p-6">
            <h3 className="eyebrow mb-6">Fulfilment</h3>

            <label className="field-label" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" defaultValue={order.status} className="field cursor-pointer">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <label className="field-label mt-5" htmlFor="courier">
              Courier
            </label>
            <input
              id="courier"
              name="courier"
              defaultValue={order.courier ?? ""}
              className="field"
              placeholder="e.g. Delhivery"
            />

            <label className="field-label mt-5" htmlFor="trackingNumber">
              Tracking number
            </label>
            <input
              id="trackingNumber"
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="field"
            />

            <button
              type="submit"
              className="mt-6 h-11 w-full bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
