import Link from "next/link";

import { SectionTitle, Stat, StatGrid, StatusPill, Th } from "@/components/dashboard/ui";
import { getVendorAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";
import { compareWindows, formatChange, formatCompactInr, vendorOrderGmv } from "@/lib/marketplace/analytics";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function VendorOverviewPage() {
  const { vendor } = await getVendorAccess();
  if (!vendor) return null;

  const repository = await getRepository();
  const [orders, products] = await Promise.all([
    repository.listVendorOrders({ vendorId: vendor.id }),
    repository.listProductsForDashboard({ vendorId: vendor.id }),
  ]);

  const createdAt = (order: (typeof orders)[number]) => order.createdAt;
  const sales = compareWindows(orders, createdAt, vendorOrderGmv, 30);
  const earnings = compareWindows(
    orders,
    createdAt,
    (order) => (vendorOrderGmv(order) > 0 ? order.vendorEarnings : 0),
    30,
  );
  const toFulfil = orders.filter((order) => order.status === "new" || order.status === "processing");
  const lowStock = products.filter((product) => product.status === "approved" && product.stockQuantity <= 2);
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-10">
      <StatGrid>
        <Stat label="Sales, last 30 days" value={formatCompactInr(sales.current)} hint={`${formatChange(sales.change)} vs previous 30`} />
        <Stat label="Your earnings, 30 days" value={formatCompactInr(earnings.current)} hint="After commission" />
        <Stat label="Orders to fulfil" value={toFulfil.length} hint="New and processing" />
        <Stat label="Listings" value={products.length} hint={`${lowStock.length} low on stock`} />
      </StatGrid>

      <div className="grid gap-10 xl:grid-cols-[1fr_20rem]">
        <section>
          <SectionTitle title="Recent orders" meta={<Link href="/vendor/orders" className="hover:text-ink">All orders &rarr;</Link>} />
          {recent.length === 0 ? (
            <p className="py-10 text-center text-[0.875rem] text-taupe">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-stone">
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr key={order.id} className="border-b border-stone-soft">
                      <td className="tnum py-3 pr-4 text-ink">{order.number}</td>
                      <td className="py-3 pr-4 text-graphite">{order.customerName}</td>
                      <td className="py-3 pr-4 text-graphite">{formatDate(order.createdAt)}</td>
                      <td className="py-3 pr-4"><StatusPill status={order.status} /></td>
                      <td className="tnum py-3 pr-4 text-right text-ink">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="Low stock" meta={<Link href="/vendor/products" className="hover:text-ink">All products &rarr;</Link>} />
          {lowStock.length === 0 ? (
            <p className="py-6 text-[0.8125rem] text-taupe">Everything is well stocked.</p>
          ) : (
            <ul className="mt-2">
              {lowStock.slice(0, 6).map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 border-b border-stone-soft py-3 text-[0.8125rem]">
                  <span className="truncate text-ink">{product.name}</span>
                  <span className={product.stockQuantity <= 0 ? "tnum shrink-0 text-danger" : "tnum shrink-0 text-terracotta"}>
                    {product.stockQuantity <= 0 ? "Sold out" : `${product.stockQuantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
