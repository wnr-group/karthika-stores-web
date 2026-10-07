import type { Metadata } from "next";

import { approveVendor, rejectVendor } from "@/app/admin/vendors/actions";
import { SectionTitle, StatusPill, Th } from "@/components/dashboard/ui";
import { openVendorDashboard } from "@/app/vendor/actions";
import { getRepository } from "@/lib/data/repository";
import { topBy, vendorOrderGmv, formatCompactInr } from "@/lib/marketplace/analytics";

export const metadata: Metadata = {
  title: "Vendors",
  robots: { index: false, follow: false },
};

const ROW_BUTTON =
  "whitespace-nowrap rounded-full border border-stone px-3.5 py-1.5 text-[0.75rem] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper";

export default async function AdminVendorsPage() {
  const repository = await getRepository();
  const [allVendors, vendorOrders] = await Promise.all([
    repository.queryVendors({ includeAllStatuses: true, sort: "name" }),
    repository.listVendorOrders(),
  ]);

  // Applications waiting for a decision come first, still in name order.
  const vendors = [...allVendors].sort(
    (a, b) => Number(b.status === "pending") - Number(a.status === "pending"),
  );
  const pending = vendors.filter((vendor) => vendor.status === "pending").length;

  const sales = new Map(
    topBy(vendorOrders, (order) => order.vendorId, vendorOrderGmv, vendors.length).map((row) => [row.key, row]),
  );

  return (
    <div>
      <SectionTitle
        title="Vendors"
        meta={`${vendors.length} sellers${pending ? `, ${pending} awaiting approval` : ""}`}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b border-stone">
              <Th>Seller</Th>
              <Th>City</Th>
              <Th>Status</Th>
              <Th>Rating</Th>
              <Th className="text-right">Sales</Th>
              <Th className="text-right">Orders</Th>
              <Th><span className="sr-only">Actions</span></Th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const row = sales.get(vendor.id);
              return (
                <tr key={vendor.id} className="border-b border-stone-soft">
                  <td className="py-3 pr-4">
                    <p className="text-ink">{vendor.name}</p>
                    <p className="text-[0.75rem] text-taupe">{vendor.ownerName}</p>
                  </td>
                  <td className="py-3 pr-4 capitalize text-graphite">{vendor.city}</td>
                  <td className="py-3 pr-4"><StatusPill status={vendor.status} /></td>
                  <td className="tnum py-3 pr-4 text-graphite">
                    {vendor.ratingCount > 0 ? `${vendor.rating.toFixed(1)} (${vendor.ratingCount})` : "–"}
                  </td>
                  <td className="tnum py-3 pr-4 text-right text-ink">{formatCompactInr(row?.value ?? 0)}</td>
                  <td className="tnum py-3 pr-4 text-right text-graphite">{row?.count ?? 0}</td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      {vendor.status === "pending" || vendor.status === "rejected" ? (
                        <form action={approveVendor}>
                          <input type="hidden" name="vendorId" value={vendor.id} />
                          <button
                            type="submit"
                            aria-label={`Approve ${vendor.name}`}
                            className="whitespace-nowrap rounded-full bg-forest px-3.5 py-1.5 text-[0.75rem] text-paper transition-colors hover:bg-forest-soft"
                          >
                            Approve
                          </button>
                        </form>
                      ) : null}
                      {vendor.status === "pending" ? (
                        <form action={rejectVendor}>
                          <input type="hidden" name="vendorId" value={vendor.id} />
                          <button type="submit" aria-label={`Reject ${vendor.name}`} className={ROW_BUTTON}>
                            Reject
                          </button>
                        </form>
                      ) : null}
                      <form action={openVendorDashboard}>
                        <input type="hidden" name="vendor" value={vendor.slug} />
                        <button type="submit" className={ROW_BUTTON}>
                          Open dashboard
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
