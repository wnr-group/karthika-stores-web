import Link from "next/link";

import { SectionTitle, StatusPill, Th } from "@/components/dashboard/ui";
import { getVendorAccess } from "@/lib/auth/access";
import { getRepository } from "@/lib/data/repository";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function VendorProductsPage() {
  const { vendor } = await getVendorAccess();
  if (!vendor) return null;

  const products = await (await getRepository()).listProductsForDashboard({ vendorId: vendor.id });

  return (
    <div>
      <SectionTitle title="Products" meta={`${products.length} listings`} />

      {products.length === 0 ? (
        <p className="py-10 text-center text-[0.875rem] text-taupe">No products listed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-stone">
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-right">Stock</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-stone-soft">
                  <td className="py-3 pr-4">
                    {product.status === "approved" ? (
                      <Link href={`/product/${product.slug}`} className="text-ink hover:text-forest-soft">
                        {product.name}
                      </Link>
                    ) : (
                      <span className="text-ink">{product.name}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-graphite">{product.category.name}</td>
                  <td className="py-3 pr-4"><StatusPill status={product.status} /></td>
                  <td className="tnum py-3 pr-4 text-right text-ink">{formatPrice(product.price)}</td>
                  <td
                    className={
                      product.stockQuantity <= 0
                        ? "tnum py-3 pr-4 text-right text-danger"
                        : product.stockQuantity <= 2
                          ? "tnum py-3 pr-4 text-right text-terracotta"
                          : "tnum py-3 pr-4 text-right text-ink"
                    }
                  >
                    {product.stockQuantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
