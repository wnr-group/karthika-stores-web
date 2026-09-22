import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Listing } from "@/components/shop/listing";
import { getRepository } from "@/lib/data/repository";
import type { RawSearchParams } from "@/lib/shop/search-params";

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateStaticParams() {
  const repository = await getRepository();
  const categories = await repository.listCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const repository = await getRepository();
  const category = await repository.getCategoryBySlug(slug);

  if (!category) return { title: "Not found" };

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: {
      title: category.name,
      description: category.description,
      url: `/shop/${category.slug}`,
    },
  };
}

export default async function ShopCategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const repository = await getRepository();
  const category = await repository.getCategoryBySlug(slug);

  if (!category) notFound();

  const resolvedSearchParams = await searchParams;

  return (
    <Listing
      searchParams={resolvedSearchParams}
      basePath={`/shop/${category.slug}`}
      categorySlug={category.slug}
      eyebrow="Weave"
      title={category.name}
      intro={category.intro ?? category.description}
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Sarees", href: "/shop" },
        { label: category.name },
      ]}
    />
  );
}
