import type { Metadata } from "next";
import Link from "next/link";

import { OrderRow } from "@/components/account/order-list";
import { EmptyState } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  const repository = await getRepository();
  const orders = user ? await repository.getOrdersForUser(user.uid) : [];
  const recent = orders.slice(0, 3);

  return (
    <div>
      <div className="flex items-end justify-between border-b border-stone pb-4">
        <h2 className="display-sm">Recent orders</h2>
        {orders.length > 3 ? (
          <Link href="/account/orders" className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]">
            View all
          </Link>
        ) : null}
      </div>

      {recent.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="When you place an order it will show up here, with tracking as soon as it ships."
          action={{ label: "Browse sarees", href: "/shop" }}
        />
      ) : (
        <ul>
          {recent.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}
