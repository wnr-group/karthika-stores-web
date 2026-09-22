import type { Metadata } from "next";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Breadcrumb } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Bag", href: "/cart" }, { label: "Checkout" }]} />

      <h1 className="display-lg mt-8 border-b border-stone pb-10">Checkout</h1>

      <div className="mt-12">
        <CheckoutFlow />
      </div>
    </div>
  );
}
