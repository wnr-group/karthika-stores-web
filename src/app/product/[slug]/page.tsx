import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToBag } from "@/components/product/add-to-bag";
import { ProductGallery } from "@/components/product/gallery";
import { ProductGrid } from "@/components/product/product-card";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Accordion } from "@/components/ui/accordion";
import { Breadcrumb, Price, StockNote, Tag } from "@/components/ui/primitives";
import { getRepository } from "@/lib/data/repository";
import { site } from "@/lib/site";
import type { ProductWithRelations } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const repository = await getRepository();
  const slugs = await repository.listAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = await getRepository();
  const product = await repository.getProductBySlug(slug);

  if (!product) return { title: "Not found" };

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      url: `/product/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const repository = await getRepository();
  const product = await repository.getProductBySlug(slug);

  if (!product) notFound();

  const related = await repository.getRelatedProducts(product.slug, 4);

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Sarees", href: "/shop" },
          { label: product.category.name, href: `/shop/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.craftTags.length ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {product.craftTags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          ) : null}

          <h1 className="display-md">{product.name}</h1>
          <p className="mt-2 text-[0.9375rem] text-taupe">
            {product.fabric} &middot; {product.color}
          </p>

          <Price
            amount={product.price}
            compareAt={product.compareAtPrice}
            size="lg"
            className="mt-5"
          />

          <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-graphite">
            {product.shortDescription}
          </p>

          <StockNote quantity={product.stockQuantity} className="mt-5" />

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <AddToBag product={product} className="flex-1" />
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="inline"
            />
          </div>

          <Accordion
            className="mt-10"
            defaultOpen={0}
            items={[
              {
                label: "Description",
                content: (
                  <div className="space-y-3">
                    {product.description.split("\n\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ),
              },
              {
                label: "The story",
                content: <p>{product.story}</p>,
              },
              {
                label: "Details",
                content: (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <dt className="text-taupe">Fabric</dt>
                    <dd className="text-ink">{product.fabric}</dd>
                    <dt className="text-taupe">Weave</dt>
                    <dd className="text-ink">{product.weave || "—"}</dd>
                    <dt className="text-taupe">Length</dt>
                    <dd className="tnum text-ink">{product.lengthMetres} m</dd>
                    <dt className="text-taupe">Width</dt>
                    <dd className="tnum text-ink">{product.widthMetres} m</dd>
                    <dt className="text-taupe">Blouse piece</dt>
                    <dd className="text-ink">{product.blousePiece || "—"}</dd>
                  </dl>
                ),
              },
              {
                label: "Care",
                content: (
                  <ul className="list-disc space-y-1.5 pl-4">
                    {product.care.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </div>
      </div>

      {related.length ? (
        <div className="mt-24 border-t border-stone pt-16 md:mt-32">
          <h2 className="display-sm mb-10">You may also like</h2>
          <ProductGrid products={related} className="md:grid-cols-4" />
        </div>
      ) : null}

      <ProductSchema product={product} />
    </div>
  );
}

/** Product structured data, for the rich result in search. */
function ProductSchema({ product }: { product: ProductWithRelations }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.id,
    url: `${site.url}/product/${product.slug}`,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: site.currency,
      price: product.price,
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${site.url}/product/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
