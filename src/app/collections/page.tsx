import type { Metadata } from "next";
import Link from "next/link";

import { Media, ratio } from "@/components/ui/media";
import { Breadcrumb } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { getRepository } from "@/lib/data/repository";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Five edits: the new season, silk stories, the festive edit, everyday drape and bridal heirloom.",
  alternates: { canonical: "/collections" },
};

/**
 * The collections index.
 *
 * Alternating full-width bands rather than a grid of equal cards, so each
 * edit gets a page-width of its own and the eye moves left, right, left.
 */
export default async function CollectionsPage() {
  const repository = await getRepository();
  const collections = await repository.listCollections();

  return (
    <div className="pb-24">
      <div className="shell pt-8 md:pt-10">
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Collections" }]} />

        <header className="mt-8 grid gap-6 border-b border-stone pb-12 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <p className="eyebrow mb-4">Edits</p>
            <h1 className="display-lg">Collections</h1>
          </div>
          <p className="text-[0.9375rem] leading-relaxed text-graphite md:col-span-5 md:col-start-8">
            We group sarees the way we actually talk about them in the shop, rather than by
            season. Five edits, re-cut whenever the looms give us a reason to.
          </p>
        </header>
      </div>

      <div className="shell">
        {collections.map((collection, index) => {
          const flipped = index % 2 === 1;

          return (
            <Reveal
              key={collection.id}
              className={cn(
                "grid items-center gap-8 border-b border-stone py-14 md:grid-cols-12 md:gap-12 md:py-20",
              )}
            >
              <Link
                href={`/collections/${collection.slug}`}
                className={cn(
                  "group md:col-span-7",
                  flipped ? "md:order-2 md:col-start-6" : "md:order-1",
                )}
              >
                <div className={cn("relative overflow-hidden", ratio.landscape)}>
                  <Media
                    image={collection.image}
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
                  />
                </div>
              </Link>

              <div
                className={cn(
                  "md:col-span-4",
                  flipped ? "md:order-1 md:col-start-1" : "md:order-2 md:col-start-9",
                )}
              >
                <p className="eyebrow mb-4">
                  {String(index + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}
                </p>
                <h2 className="display-md">
                  <Link href={`/collections/${collection.slug}`} className="link-quiet">
                    {collection.name}
                  </Link>
                </h2>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-graphite">
                  {collection.story}
                </p>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="link-rule mt-6 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
                >
                  View the edit
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
