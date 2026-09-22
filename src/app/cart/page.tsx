import type { Metadata } from "next";

import { CartPage } from "@/components/cart/cart-page";
import { Breadcrumb } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the sarees in your bag before checking out.",
  robots: { index: false, follow: false },
};

export default function Cart() {
  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Your bag" }]} />

      <h1 className="display-lg mt-8 border-b border-stone pb-10">Your bag</h1>

      <div className="mt-12">
        <CartPage />
      </div>
    </div>
  );
}
