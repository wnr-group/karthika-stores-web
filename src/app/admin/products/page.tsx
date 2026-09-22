import type { Metadata } from "next";

import { getRepository } from "@/lib/data/repository";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const repository = await getRepository();
  const { items: products } = await repository.queryProducts({
    sort: "newest",
    perPage: 500,
  });

  const byStock = [...products].sort((a, b) => a.stockQuantity - b.stockQuantity);

  return (
    <div>
      <div className="flex items-end justify-between border-b border-stone pb-4">
        <h2 className="display-sm">Products</h2>
        <p className="text-[0.75rem] text-taupe">{products.length} active</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b border-stone text-[0.6875rem] uppercase tracking-[0.14em] text-taupe">
              <th className="py-3 pr-4 font-normal">Name</th>
              <th className="py-3 pr-4 font-normal">Category</th>
              <th className="py-3 pr-4 font-normal">Price</th>
              <th className="py-3 pr-4 font-normal">Stock</th>
            </tr>
          </thead>
          <tbody>
            {byStock.map((product) => (
              <tr key={product.id} className="border-b border-stone-soft">
                <td className="py-3 pr-4 text-ink">{product.name}</td>
                <td className="py-3 pr-4 text-graphite">{product.category.name}</td>
                <td className="tnum py-3 pr-4 text-ink">{formatPrice(product.price)}</td>
                <td
                  className={
                    product.stockQuantity <= 0
                      ? "tnum py-3 pr-4 text-danger"
                      : product.stockQuantity <= 2
                        ? "tnum py-3 pr-4 text-terracotta"
                        : "tnum py-3 pr-4 text-ink"
                  }
                >
                  {product.stockQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
