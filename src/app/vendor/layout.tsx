import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { openVendorDashboard } from "@/app/vendor/actions";
import { DashboardFrame, DemoBanner } from "@/components/dashboard/ui";
import { getVendorAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: { default: "Vendor dashboard", template: "%s — Vendor dashboard" },
  robots: { index: false, follow: false },
};

const NAV = [
  { label: "Overview", href: "/vendor" },
  { label: "Orders", href: "/vendor/orders" },
  { label: "Products", href: "/vendor/products" },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const { vendor, user, demo, viaAdmin } = await getVendorAccess();
  if (!vendor) redirect(user ? "/" : "/login?redirect=/vendor");

  // Demo visitors and admins can hop between sellers.
  const canSwitch = demo || viaAdmin;
  const vendors = canSwitch ? await (await getRepository()).queryVendors({ includeAllStatuses: true, sort: "name" }) : [];

  return (
    <DashboardFrame
      title={vendor.name}
      subtitle={`Vendor dashboard · ${vendor.locality ? `${vendor.locality}, ` : ""}${vendor.city}`}
      nav={NAV}
      banner={
        demo ? (
          <DemoBanner>
            No sign-in is configured, so you can view any seller&rsquo;s dashboard. Changes are
            kept in memory until the server restarts.
          </DemoBanner>
        ) : null
      }
      aside={
        canSwitch ? (
          <form action={openVendorDashboard} className="flex items-center gap-2">
            <label htmlFor="vendor-switch" className="sr-only">
              Switch seller
            </label>
            <select
              id="vendor-switch"
              name="vendor"
              defaultValue={vendor.slug}
              className="h-10 max-w-[14rem] rounded-full border border-stone bg-paper px-4 text-[0.8125rem] text-ink"
            >
              {vendors.map((option) => (
                <option key={option.id} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-full bg-ink px-4 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-forest-soft"
            >
              Switch
            </button>
          </form>
        ) : null
      }
    >
      {children}
    </DashboardFrame>
  );
}
