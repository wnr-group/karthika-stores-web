import type { Metadata } from "next";

import { WishlistView } from "@/components/account/wishlist-view";
import { Breadcrumb } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The sarees you have saved.",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />

      <h1 className="display-lg mt-8 border-b border-stone pb-10">Wishlist</h1>

      <div className="mt-12">
        <WishlistView />
      </div>
    </div>
  );
}
