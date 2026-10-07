import Link from "next/link";

import { SectionTitle } from "@/components/dashboard/ui";
import { VendorProductForm } from "@/components/vendor/product-form";
import { getVendorAccess } from "@/lib/auth/access";
import { loadCategoryChoices } from "@/lib/vendor/product-form-options";

export const metadata = { title: "Add a product" };

export default async function NewVendorProductPage() {
  const { vendor } = await getVendorAccess();
  if (!vendor) return null;

  const categories = await loadCategoryChoices();

  return (
    <div>
      <SectionTitle
        title="Add a product"
        meta={
          <Link href="/vendor/products" className="hover:text-ink">
            &larr; All products
          </Link>
        }
      />
      <div className="mt-8">
        <VendorProductForm categories={categories} />
      </div>
    </div>
  );
}
