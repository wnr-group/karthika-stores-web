import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { ProductGallery } from "@/components/product/gallery";
import { ProductGrid } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { Breadcrumb, Tag } from "@/components/ui/primitives";
import { getRepository } from "@/lib/data/repository";
import { site } from "@/lib/site";
import type { AttributeDefinition, ProductWithRelations } from "@/lib/types";
import { titleFromSlug } from "@/lib/utils";

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

  const [related, attributeDefinitions] = await Promise.all([
    repository.getRelatedProducts(product.slug, 4),
    repository.getAttributeDefinitions(product.categoryId),
  ]);

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.category.name, href: `/shop/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.tags.length ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          ) : null}

          <h1 className="display-md">{product.name}</h1>
          <p className="mt-2 text-[0.9375rem] text-taupe">
            {[product.subtitle, product.color].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-taupe">
            Sold by{" "}
            <span className="text-ink">{product.vendor.name}</span>
          </p>

          <ProductPurchase product={product}>
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="inline"
            />
          </ProductPurchase>

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
              ...attributeAccordionItems(product.attributes, attributeDefinitions),
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

/**
 * Turns a product's `attributes` bag into the page's "Details" and, when
 * there is at least one list-valued attribute (care instructions, what's
 * included, ...), a second tab for those — generically, for whatever
 * category this product belongs to, not just a saree's fixed field set.
 */
function attributeAccordionItems(
  attributes: Record<string, unknown>,
  definitions: AttributeDefinition[],
): AccordionItem[] {
  const labelByKey = new Map(definitions.map((def) => [def.key, def] as const));
  const orderByKey = new Map(definitions.map((def) => [def.key, def.displayOrder] as const));

  const entries = Object.entries(attributes)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .sort(([a], [b]) => (orderByKey.get(a) ?? 99) - (orderByKey.get(b) ?? 99));

  const scalarEntries = entries.filter(([, value]) => !Array.isArray(value));
  const listEntries = entries.filter(([, value]) => Array.isArray(value)) as Array<
    [string, string[]]
  >;

  const items: AccordionItem[] = [];

  if (scalarEntries.length) {
    items.push({
      label: "Details",
      content: (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          {scalarEntries.map(([key, value]) => {
            const definition = labelByKey.get(key);
            return (
              <Fragment key={key}>
                <dt className="text-taupe">{definition?.label ?? titleFromSlug(key)}</dt>
                <dd className={definition?.inputType === "number" ? "tnum text-ink" : "text-ink"}>
                  {String(value)}
                  {definition?.unit ? ` ${definition.unit}` : ""}
                </dd>
              </Fragment>
            );
          })}
        </dl>
      ),
    });
  }

  for (const [key, value] of listEntries) {
    const definition = labelByKey.get(key);
    items.push({
      label: definition?.label ?? titleFromSlug(key),
      content: (
        <ul className="list-disc space-y-1.5 pl-4">
          {value.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      ),
    });
  }

  return items;
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
