import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import {
  CategoryTiles,
  JEWELLERY_STYLES,
  JewelleryBox,
  MoreToExplore,
  NewArrivalsBand,
  PromoPair,
  Reviews,
  TextileEdit,
  ValueServices,
  type ReviewCard,
} from "@/components/home/sections";
import { getRepository } from "@/lib/data/repository";
import { site, valueAddedServices } from "@/lib/site";
import type { ProductImage, ProductWithRelations, Review } from "@/lib/types";

export const metadata: Metadata = {
  title: `${site.name} — Imitation jewellery, textiles & services`,
  description: site.description,
  alternates: { canonical: "/" },
};

/** Verticals that get their own section; everything else goes in "More to explore". */
const FEATURED_ROOTS = new Set(["jewellery", "fashion"]);

/**
 * The homepage leads with imitation jewellery, then textiles, then the
 * value-added services, and closes with the rest of the shop. White ground,
 * green bands and pale green panels.
 */
export default async function HomePage() {
  const repository = await getRepository();

  // One parallel fetch for the whole page.
  const [categories, imitation, jewelleryCount, textiles, newest, reviews, featuredRange] = await Promise.all([
    repository.listCategories({ kind: "product" }),
    repository.queryProducts({ categorySlugs: ["imitation-jewellery"], sort: "newest", perPage: 8 }),
    repository.queryProducts({ categorySlugs: ["jewellery"], perPage: 1 }),
    repository.queryProducts({ categorySlugs: ["sarees", "kurtis", "dresses"], sort: "newest", perPage: 12 }),
    repository.queryProducts({ sort: "newest", perPage: 24, inStockOnly: true }),
    repository.listReviews({ subjectType: "product" }),
    // Only to know which reviews are about jewellery or textiles.
    repository.queryProducts({ categorySlugs: [...FEATURED_ROOTS], perPage: 500 }),
  ]);

  // Only offer the style shortcuts that actually return pieces.
  const styleCounts = await Promise.all(
    JEWELLERY_STYLES.map((style) =>
      repository.queryProducts({ categorySlugs: ["imitation-jewellery"], search: style, perPage: 1 }),
    ),
  );
  const styles = JEWELLERY_STYLES.filter((_, index) => (styleCounts[index]?.total ?? 0) > 0);

  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const cover = (slug: string) => bySlug.get(slug)?.image;
  const sarees = bySlug.get("sarees");
  const weaves = sarees ? categories.filter((category) => category.parentId === sarees.id) : [];
  const weaveCover = (slug: string) => weaves.find((weave) => weave.slug === slug)?.image;

  const jewelleryPieces = imitation.items;
  const textilePieces = pickVaried(textiles.items, 4);
  const choker = jewelleryPieces.find((product) => /choker|bridal/i.test(product.name));

  return (
    <>
      <Hero
        leadImage={pick("hero-lead", cover("jewellery"), jewelleryPieces[0]?.images[0])}
        tiles={[
          {
            label: "Imitation jewellery",
            href: "/shop/imitation-jewellery",
            image: pick("hero-jewellery", jewelleryPieces[1]?.images[0], cover("fine-jewellery")),
          },
          {
            label: "Sarees",
            href: "/shop/sarees",
            image: pick("hero-sarees", weaveCover("organza"), cover("sarees")),
          },
        ]}
        stats={[
          { value: String(jewelleryCount.total), label: "Jewellery designs" },
          { value: String(textiles.total), label: "Sarees & textiles" },
          { value: String(valueAddedServices.length), label: "In-house services" },
        ]}
      />

      <CategoryTiles
        tiles={[
          { name: "Imitation jewellery", href: "/shop/imitation-jewellery", image: pick("cat-imitation", jewelleryPieces[2]?.images[0], cover("imitation-jewellery")) },
          { name: "Fine jewellery", href: "/shop/fine-jewellery", image: pick("cat-fine", cover("fine-jewellery")) },
          { name: "Sarees", href: "/shop/sarees", image: pick("cat-sarees", cover("sarees")) },
          { name: "Kurtis", href: "/shop/kurtis", image: pick("cat-kurtis", cover("kurtis")) },
          { name: "Dresses", href: "/shop/dresses", image: pick("cat-dresses", cover("dresses")) },
          { name: "Accessories", href: "/shop/accessories", image: pick("cat-accessories", cover("accessories"), cover("handbags")) },
        ]}
      />

      <JewelleryBox products={jewelleryPieces} styles={styles} />

      <PromoPair
        promos={[
          {
            eyebrow: "The wedding edit",
            title: "Bridal sets & silks",
            body: "Chokers, jhumkas and Kanchipurams picked to go together.",
            cta: "Shop the edit",
            href: "/collections/the-wedding-edit",
            image: pick("promo-wedding", choker?.images[0], cover("jewellery")),
          },
          {
            eyebrow: "Ready to wear",
            title: "Stitched before it ships",
            body: "Blouse stitching, fall & pico and pre-pleating on any saree.",
            cta: "See our services",
            href: "/#services",
            image: pick("promo-services", textilePieces[2]?.images[0], weaveCover("cotton"), cover("sarees")),
          },
        ]}
      />

      <NewArrivalsBand products={arrivals(jewelleryPieces, textiles.items, newest.items)} />

      <TextileEdit weaves={weaves.slice(0, 6)} products={textilePieces} />

      <ValueServices />

      <Reviews reviews={toReviewCards(reviews, new Set(featuredRange.items.map((product) => product.id)))} />

      <MoreToExplore
        categories={categories.filter(
          (category) => category.parentId === null && !FEATURED_ROOTS.has(category.slug),
        )}
      />

      <OrganizationSchema />
    </>
  );
}

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */

/** The first image that exists, or a tonal placeholder so the layout holds. */
function pick(id: string, ...candidates: Array<ProductImage | undefined>): ProductImage {
  return (
    candidates.find(Boolean) ?? {
      id,
      url: null,
      alt: "",
      kind: "lifestyle",
      tone: "sand",
      displayOrder: 0,
    }
  );
}

/** Up to `count` products, one per category before any category repeats. */
function pickVaried(products: ProductWithRelations[], count: number) {
  const seen = new Set<string>();
  const first = products.filter((product) => {
    if (seen.has(product.category.id)) return false;
    seen.add(product.category.id);
    return true;
  });
  const rest = products.filter((product) => !first.includes(product));
  return [...first, ...rest].slice(0, count);
}

/** Jewellery and textiles first, interleaved, then a few from the rest of the shop. */
function arrivals(
  jewellery: ProductWithRelations[],
  textiles: ProductWithRelations[],
  newest: ProductWithRelations[],
): ProductWithRelations[] {
  const textileMix = pickVaried(textiles, 3);
  const others = pickVaried(
    newest.filter((product) => !FEATURED_ROOTS.has(product.categoryTrail[0]?.slug ?? "")),
    3,
  );

  const mixed: ProductWithRelations[] = [];
  for (let i = 0; i < 3; i++) {
    const piece = jewellery[i];
    const textile = textileMix[i];
    if (piece) mixed.push(piece);
    if (textile) mixed.push(textile);
  }
  mixed.push(...others);

  return mixed.filter((product) => product.images[0]);
}

/** Short, well-rated reviews of jewellery and textiles. */
function toReviewCards(reviews: Review[], productIds: Set<string>): ReviewCard[] {
  return reviews
    .filter((review) => productIds.has(review.subjectId))
    .filter((review) => review.rating >= 4 && review.body.length >= 50 && review.body.length <= 220)
    .slice(0, 3)
    .map((review) => ({
      id: review.id,
      body: review.body,
      author: review.authorName,
      detail: `${review.authorCity} · on ${review.subjectName}`,
      rating: review.rating,
    }));
}

/**
 * Organisation and website structured data. Product-level data lives on the
 * product page itself.
 */
function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.legalName,
        url: site.url,
        email: site.contact.email,
        telephone: site.contact.phone,
        foundingDate: String(site.founded),
        address: {
          "@type": "PostalAddress",
          streetAddress: site.contact.address[0],
          addressLocality: site.city,
          addressRegion: "Tamil Nadu",
          addressCountry: "IN",
        },
        sameAs: [site.social.instagram, site.social.pinterest, site.social.facebook],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": `${site.url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${site.url}/shop?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
