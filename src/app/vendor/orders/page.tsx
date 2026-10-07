import { SectionTitle, StatusPill, Th } from "@/components/dashboard/ui";
import { getVendorAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function VendorOrdersPage() {
  const { vendor } = await getVendorAccess();
  if (!vendor) return null;

  const orders = await (await getRepository()).listVendorOrders({ vendorId: vendor.id });
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <SectionTitle title="Orders" meta={`${orders.length} total`} />

      {sorted.length === 0 ? (
        <p className="py-10 text-center text-[0.875rem] text-taupe">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-stone">
                <Th>Order</Th>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">You earn</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => (
                <tr key={order.id} className="border-b border-stone-soft align-top">
                  <td className="tnum py-3 pr-4 text-ink">{order.number}</td>
                  <td className="py-3 pr-4 text-graphite">{formatDate(order.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <p className="text-ink">{order.customerName}</p>
                    <p className="text-[0.75rem] capitalize text-taupe">{order.city}</p>
                  </td>
                  <td className="py-3 pr-4 text-graphite">
                    {order.items
                      .map(
                        (item) =>
                          `${item.quantity} × ${item.name}${item.variantTitle && item.variantTitle !== "Default" ? ` (${item.variantTitle})` : ""}`,
                      )
                      .join(", ")}
                  </td>
                  <td className="py-3 pr-4"><StatusPill status={order.status} /></td>
                  <td className="tnum py-3 pr-4 text-right text-ink">{formatPrice(order.total)}</td>
                  <td className="tnum py-3 pr-4 text-right text-forest-soft">{formatPrice(order.vendorEarnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
