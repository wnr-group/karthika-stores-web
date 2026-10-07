import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionTitle } from "@/components/dashboard/ui";
import { VendorProductForm } from "@/components/vendor/product-form";
import { getVendorAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";
import { loadCategoryChoices } from "@/lib/vendor/product-form-options";

export const metadata = { title: "Edit product" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorProductPage({ params }: PageProps) {
  const { id } = await params;
  const { vendor } = await getVendorAccess();
  if (!vendor) return null;

  const [product, categories] = await Promise.all([
    (await getRepository()).getProductById(id),
    loadCategoryChoices(),
  ]);
  // Another seller's product looks exactly like a missing one.
  if (!product || product.vendorId !== vendor.id) notFound();

  return (
    <div>
      <SectionTitle
        title={product.name}
        meta={
          <Link href="/vendor/products" className="hover:text-ink">
            &larr; All products
          </Link>
        }
      />
      {product.status === "archived" ? (
        <p className="mt-6 border border-stone bg-shell/60 px-4 py-3 text-[0.8125rem] text-graphite">
          This product is archived and hidden from the shop. Restore it from the product list to sell it again.
        </p>
      ) : null}
      <div className="mt-8">
        {/* Keyed so switching products resets the form. */}
        <VendorProductForm key={product.id} categories={categories} product={product} />
      </div>
    </div>
  );
}
