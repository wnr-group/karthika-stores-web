import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardFrame, DemoBanner } from "@/components/dashboard/ui";
import { getAdminAccess } from "@/lib/auth/access";

const NAV = [
  { label: "Overview", href: "/admin/overview" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Vendors", href: "/admin/vendors" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // With no sign-in and no database configured (demo mode) the dashboard is
  // open to everyone; otherwise only signed-in ADMIN_EMAILS get in.
  const { allowed, user, demo } = await getAdminAccess();
  if (!allowed) redirect(user ? "/" : "/login?redirect=/admin");

  return (
    <DashboardFrame
      title="Admin"
      subtitle="Orders, products and sellers across the shop"
      nav={NAV}
      banner={
        demo ? (
          <DemoBanner>
            No sign-in is configured, so this dashboard is open to everyone. Changes are kept in
            memory until the server restarts.
          </DemoBanner>
        ) : null
      }
      aside={
        <Link href="/vendor" className="text-[0.875rem] font-medium text-ink hover:text-forest-soft">
          Vendor dashboard &rarr;
        </Link>
      }
    >
      {children}
    </DashboardFrame>
  );
}
