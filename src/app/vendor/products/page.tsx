import Link from "next/link";

import { archiveVendorProduct, restoreVendorProduct } from "@/app/vendor/products/actions";
import { SectionTitle, StatusPill, Th } from "@/components/dashboard/ui";
import { getVendorAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

interface PageProps {
  searchParams: Promise<{ saved?: string }>;
}

const ROW_BUTTON =
  "whitespace-nowrap rounded-full border border-stone px-3 py-1 text-[0.75rem] text-ink transition-colors hover:border-ink";

export default async function VendorProductsPage({ searchParams }: PageProps) {
  const { vendor } = await getVendorAccess();
  if (!vendor) return null;

  const { saved } = await searchParams;
  const products = await (await getRepository()).listProductsForDashboard({ vendorId: vendor.id });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle title="Products" meta={`${products.length} listings`} className="flex-1" />
        <Link
          href="/vendor/products/new"
          className="rounded-full bg-forest px-5 py-2.5 text-[0.75rem] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-forest-soft"
        >
          + Add product
        </Link>
      </div>

      {saved ? (
        <p role="status" className="mt-4 border border-success/40 bg-success/5 px-4 py-3 text-[0.8125rem] text-success">
          Saved &ldquo;{saved}&rdquo;. Changes are live in the shop.
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className="py-10 text-center text-[0.875rem] text-taupe">
          No products listed yet.{" "}
          <Link href="/vendor/products/new" className="text-ink underline underline-offset-4">
            Add your first product
          </Link>
          .
        </p>
      ) : (
        // `relative` keeps the absolutely positioned sr-only header inside
        // the scroll box; otherwise it widens the whole page on phones.
        <div className="relative mt-2 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-stone">
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
                <Th><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const live = product.status === "approved" && product.isActive;
                return (
                  <tr key={product.id} className="border-b border-stone-soft">
                    <td className="py-3 pr-4">
                      {live ? (
                        <Link href={`/product/${product.slug}`} className="text-ink hover:text-forest-soft">
                          {product.name}
                        </Link>
                      ) : (
                        <span className="text-ink">{product.name}</span>
                      )}
                      {product.options.length ? (
                        <p className="text-[0.6875rem] text-taupe">
                          {product.variants.length} options &middot; {product.options.map((option) => option.name).join(", ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-graphite">{product.category.name}</td>
                    <td className="py-3 pr-4">
                      <StatusPill status={product.status} />
                      {product.status === "approved" && !product.isActive ? (
                        <p className="mt-1 text-[0.6875rem] text-taupe">Hidden from shop</p>
                      ) : null}
                    </td>
                    <td className="tnum py-3 pr-4 text-right text-ink">
                      {product.variants.length > 1 ? "from " : ""}
                      {formatPrice(product.price)}
                    </td>
                    <td
                      className={
                        !product.trackInventory
                          ? "py-3 pr-4 text-right text-taupe"
                          : product.stockQuantity <= 0
                            ? "tnum py-3 pr-4 text-right text-danger"
                            : product.stockQuantity <= 2
                              ? "tnum py-3 pr-4 text-right text-terracotta"
                              : "tnum py-3 pr-4 text-right text-ink"
                      }
                    >
                      {product.trackInventory ? product.stockQuantity : "Made to order"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/vendor/products/${product.id}`} className={ROW_BUTTON}>
                          Edit
                        </Link>
                        <form action={product.status === "archived" ? restoreVendorProduct : archiveVendorProduct}>
                          <input type="hidden" name="productId" value={product.id} />
                          <button
                            type="submit"
                            aria-label={`${product.status === "archived" ? "Restore" : "Archive"} ${product.name}`}
                            className={ROW_BUTTON}
                          >
                            {product.status === "archived" ? "Restore" : "Archive"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
