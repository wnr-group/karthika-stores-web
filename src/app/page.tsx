import type { Metadata } from "next";

import { Hero } from "@/components/home/hero";
import {
  Assurances,
  AtelierNote,
  CategoryRail,
  FeaturedCollection,
  FestiveBand,
  NewArrivals,
  SilkStories,
  Statement,
} from "@/components/home/sections";
import { getRepository } from "@/lib/data/repository";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} — Handwoven sarees from Kanchipuram and Banaras`,
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * The homepage reads top to bottom as an issue: an opening spread, a written
 * statement, a shoppable feature, the shelf, then two stories and a note.
 * Every section has a different shape on purpose.
 */
export default async function HomePage() {
  const repository = await getRepository();

  // One parallel fetch for the whole page.
  const [banners, categories, newSeason, silkStories, festive, newest, featured] =
    await Promise.all([
      repository.listBanners(),
      repository.listCategories(),
      repository.getCollectionBySlug("the-new-season"),
      repository.getCollectionBySlug("silk-stories"),
      repository.getCollectionBySlug("the-festive-edit"),
      repository.queryProducts({ sort: "newest", perPage: 4, inStockOnly: true }),
      repository.queryProducts({ isFeatured: true, perPage: 3 }),
    ]);

  const [banner] = banners;

  const [newSeasonProducts, silkProducts] = await Promise.all([
    repository.queryProducts({ collectionSlugs: ["the-new-season"], perPage: 3 }),
    repository.queryProducts({ collectionSlugs: ["silk-stories"], perPage: 3 }),
  ]);

  return (
    <>
      {banner ? <Hero banner={banner} /> : null}

      <Statement />

      {newSeason && newSeasonProducts.items.length >= 3 ? (
        <FeaturedCollection collection={newSeason} products={newSeasonProducts.items} />
      ) : null}

      <CategoryRail categories={categories} />

      <NewArrivals products={newest.items.length >= 4 ? newest.items : featured.items} />

      {silkStories ? (
        <SilkStories collection={silkStories} products={silkProducts.items} />
      ) : null}

      {festive ? <FestiveBand collection={festive} /> : null}

      <AtelierNote />

      <Assurances />

      <OrganizationSchema />
    </>
  );
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
