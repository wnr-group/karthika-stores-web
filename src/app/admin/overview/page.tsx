import type { Metadata } from "next";
import Link from "next/link";

import { OrderStatusLabel } from "@/components/account/order-list";
import { SectionTitle, Stat, StatGrid, StatusPill, Th } from "@/components/dashboard/ui";
import { getRepository } from "@/lib/data/repository";
import {
  compareWindows,
  formatChange,
  formatCompactInr,
  topBy,
  vendorOrderCommission,
  vendorOrderGmv,
} from "@/lib/marketplace/analytics";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  const repository = await getRepository();
  const [vendorOrders, vendors, products] = await Promise.all([
    repository.listVendorOrders(),
    repository.queryVendors({ includeAllStatuses: true }),
    repository.queryProducts({ perPage: 1 }),
  ]);

  const createdAt = (order: (typeof vendorOrders)[number]) => order.createdAt;
  const gmv = compareWindows(vendorOrders, createdAt, vendorOrderGmv, 30);
  const revenue = compareWindows(vendorOrders, createdAt, vendorOrderCommission, 30);
  const count = compareWindows(vendorOrders, createdAt, () => 1, 30);
  const pendingVendors = vendors.filter((vendor) => vendor.status === "pending").length;

  const topSellers = topBy(vendorOrders, (order) => order.vendorSlug, vendorOrderGmv, 5);
  const recent = [...vendorOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  // Show the order's own status, as the order pages and the customer see it.
  // A seller's "new" part of an order is a "confirmed" order everywhere else.
  const parentOrders = new Map(
    (await Promise.all(recent.map((order) => repository.getOrderById(order.orderId))))
      .filter((order) => order !== null)
      .map((order) => [order.id, order]),
  );

  return (
    <div className="space-y-10">
      <StatGrid>
        <Stat label="Sales, last 30 days" value={formatCompactInr(gmv.current)} hint={`${formatChange(gmv.change)} vs previous 30`} />
        <Stat label="Commission earned" value={formatCompactInr(revenue.current)} hint={`${formatChange(revenue.change)} vs previous 30`} />
        <Stat label="Orders, last 30 days" value={count.current} hint={`${formatChange(count.change)} vs previous 30`} />
        <Stat label="Live products" value={products.total} hint={`${vendors.length} sellers, ${pendingVendors} awaiting approval`} />
      </StatGrid>

      <div className="grid gap-10 xl:grid-cols-[1fr_20rem]">
        <section>
          <SectionTitle title="Recent orders" meta={<Link href="/admin/orders" className="hover:text-ink">All orders &rarr;</Link>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-stone">
                  <Th>Order</Th>
                  <Th>Seller</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id} className="border-b border-stone-soft">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${order.orderId}`} className="tnum text-ink hover:text-forest-soft">
                        {order.number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-graphite">{order.vendorName}</td>
                    <td className="py-3 pr-4 text-graphite">{formatDate(order.createdAt)}</td>
                    <td className="py-3 pr-4">
                      {parentOrders.get(order.orderId) ? (
                        <OrderStatusLabel status={parentOrders.get(order.orderId)!.status} />
                      ) : (
                        <StatusPill status={order.status} />
                      )}
                    </td>
                    <td className="tnum py-3 pr-4 text-right text-ink">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle title="Top sellers" meta="All time" />
          <ol className="mt-2">
            {topSellers.map((seller, index) => (
              <li key={seller.key} className="flex items-center justify-between gap-3 border-b border-stone-soft py-3 text-[0.8125rem]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-shell text-[0.6875rem] text-ink">
                    {index + 1}
                  </span>
                  <span className="truncate text-ink">{seller.sample.vendorName}</span>
                </span>
                <span className="tnum shrink-0 text-graphite">{formatCompactInr(seller.value)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
