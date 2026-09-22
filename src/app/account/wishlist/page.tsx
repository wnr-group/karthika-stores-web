import type { Metadata } from "next";

import { WishlistView } from "@/components/account/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

export default function AccountWishlistPage() {
  return (
    <div>
      <h2 className="display-sm border-b border-stone pb-4">Wishlist</h2>
      <div className="mt-8">
        <WishlistView />
      </div>
    </div>
  );
}
