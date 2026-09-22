import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Listing } from "@/components/shop/listing";
import { Media } from "@/components/ui/media";
import { getRepository } from "@/lib/data/repository";
import type { RawSearchParams } from "@/lib/shop/search-params";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateStaticParams() {
  const repository = await getRepository();
  const collections = await repository.listCollections();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = await getRepository();
  const collection = await repository.getCollectionBySlug(slug);

  if (!collection) return { title: "Not found" };

  return {
    title: collection.name,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title: collection.name,
      description: collection.description,
      url: `/collections/${collection.slug}`,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const repository = await getRepository();
  const collection = await repository.getCollectionBySlug(slug);

  if (!collection) notFound();

  const resolvedSearchParams = await searchParams;

  return (
    <>
      {/* A full-bleed opening image with the story beneath it, then the
          standard listing. The edit gets a cover; the grid gets to be a grid. */}
      <section className="relative">
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
          <Media
            image={collection.image}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </section>

      <div className="shell border-b border-stone py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow mb-4">The edit</p>
            <h1 className="display-lg">{collection.name}</h1>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="text-[1.0625rem] leading-relaxed text-graphite">{collection.story}</p>
          </div>
        </div>
      </div>

      <Listing
        searchParams={resolvedSearchParams}
        basePath={`/collections/${collection.slug}`}
        collectionSlug={collection.slug}
        title="The pieces"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection.name },
        ]}
      />
    </>
  );
}
