import type { Metadata } from "next";

import { OrderRow } from "@/components/account/order-list";
import { EmptyState } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  const repository = await getRepository();
  const orders = user ? await repository.getOrdersForUser(user.uid) : [];

  return (
    <div>
      <h2 className="display-sm border-b border-stone pb-4">Orders</h2>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="When you place an order it will show up here, with tracking as soon as it ships."
          action={{ label: "Browse sarees", href: "/shop" }}
        />
      ) : (
        <ul>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}
