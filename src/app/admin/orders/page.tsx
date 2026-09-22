import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusLabel } from "@/components/account/order-list";
import { getRepository } from "@/lib/data/repository";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const repository = await getRepository();
  const orders = await repository.listOrders();

  return (
    <div>
      <div className="flex items-end justify-between border-b border-stone pb-4">
        <h2 className="display-sm">Orders</h2>
        <p className="text-[0.75rem] text-taupe">{orders.length} total</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b border-stone text-[0.6875rem] uppercase tracking-[0.14em] text-taupe">
              <th className="py-3 pr-4 font-normal">Order</th>
              <th className="py-3 pr-4 font-normal">Date</th>
              <th className="py-3 pr-4 font-normal">Customer</th>
              <th className="py-3 pr-4 font-normal">Status</th>
              <th className="py-3 pr-4 font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-stone-soft">
                <td className="py-3 pr-4">
                  <Link href={`/admin/orders/${order.id}`} className="tnum link-quiet text-ink">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-graphite">{formatDate(order.createdAt)}</td>
                <td className="py-3 pr-4 text-graphite">{order.email}</td>
                <td className="py-3 pr-4">
                  <OrderStatusLabel status={order.status} />
                </td>
                <td className="tnum py-3 pr-4 text-ink">{formatPrice(order.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 ? (
          <p className="py-10 text-center text-[0.875rem] text-taupe">No orders yet.</p>
        ) : null}
      </div>
    </div>
  );
}
