import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser, isAdmin } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (!(await isAdmin(user))) redirect("/");

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <h1 className="display-lg border-b border-stone pb-10">Admin</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-14">
        <nav aria-label="Admin" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex gap-6 overflow-x-auto border-b border-stone pb-4 lg:flex-col lg:gap-0 lg:border-b-0 lg:pb-0">
            <li className="lg:border-b lg:border-stone-soft">
              <Link
                href="/admin/orders"
                className="block whitespace-nowrap py-0 text-[0.6875rem] uppercase tracking-[0.16em] text-taupe transition-colors hover:text-ink lg:py-3.5"
              >
                Orders
              </Link>
            </li>
            <li className="lg:border-b lg:border-stone-soft">
              <Link
                href="/admin/products"
                className="block whitespace-nowrap py-0 text-[0.6875rem] uppercase tracking-[0.16em] text-taupe transition-colors hover:text-ink lg:py-3.5"
              >
                Products
              </Link>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
