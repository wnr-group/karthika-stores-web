import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import { Media, ratio } from "@/components/ui/media";
import { LoomIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/primitives";
import type { Category, Collection, ProductWithRelations } from "@/lib/types";
import { cn } from "@/lib/utils";

/* =========================================================================
   1. Statement
   A text-only band. No image, no button. It exists to slow the page down
   after the hero and to say what the shop is for.
   ========================================================================= */

export function Statement() {
  return (
    <section className="shell py-20 md:py-28">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <p className="eyebrow">Since 2016</p>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-taupe">
            Six weaving families. One shop on Kasturi Ranga Road. No middlemen between the loom
            and the label.
          </p>
        </div>

        <div className="md:col-span-8 md:col-start-5">
          <Reveal>
            <p className="font-display text-[1.75rem] font-light leading-[1.28] text-ink md:text-[2.5rem] lg:text-[2.9rem]">
              The soft sheen of silk. The weight of a handwoven border. A saree that becomes part
              of your story, and then part of someone else&rsquo;s.
            </p>
          </Reveal>

          <Reveal delay={90}>
            <p className="measure mt-8 text-[0.9375rem] leading-relaxed text-graphite">
              We started because the sarees we wanted did not exist at a price we could defend.
              Everything here is bought directly from the people who wove it, and every piece
              carries their name.
            </p>
            <Link
              href="/about"
              className="link-rule mt-6 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
            >
              Read our story
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   2. Featured collection
   Asymmetric: one tall piece on the left, two stacked on the right, with the
   heading pinned into the right column rather than centred above.
   ========================================================================= */

export function FeaturedCollection({
  collection,
  products,
}: {
  collection: Collection;
  products: ProductWithRelations[];
}) {
  const [lead, ...rest] = products;
  if (!lead) return null;

  return (
    <section className="shell pb-20 md:pb-28">
      <div className="grid gap-x-8 gap-y-12 lg:grid-cols-12">
        {/* Lead piece */}
        <Reveal className="lg:col-span-6 xl:col-span-7">
          <ProductCard
            product={lead}
            featured
            sizes="(min-width: 1024px) 55vw, 100vw"
          />
        </Reveal>

        {/* Heading and the two smaller pieces */}
        <div className="lg:col-span-5 lg:col-start-8 lg:flex lg:flex-col lg:justify-between">
          <Reveal delay={60}>
            <p className="eyebrow">{collection.name}</p>
            <h2 className="display-lg mt-5">Woven this season</h2>
            <p className="measure mt-5 text-[0.9375rem] leading-relaxed text-graphite">
              {collection.story}
            </p>
            <Link
              href={`/collections/${collection.slug}`}
              className="link-rule mt-6 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
            >
              See the collection
            </Link>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:mt-16">
            {rest.slice(0, 2).map((product, index) => (
              <Reveal key={product.id} delay={120 + index * 60}>
                <ProductCard product={product} sizes="(min-width: 1024px) 22vw, 45vw" />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   3. Categories
   A horizontal rail of tall images. Photography instead of icons, and it
   scrolls rather than wrapping, so the row reads as a shelf.
   ========================================================================= */

export function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <section className="py-20 md:py-28">
      <div className="shell">
        <SectionHeader
          eyebrow="Shop by weave"
          title="Nine ways to wear a saree"
          action={{ label: "All sarees", href: "/shop" }}
        />
      </div>

      <div className="no-scrollbar mt-12 flex gap-4 overflow-x-auto px-5 pb-2 md:gap-6 md:px-10 xl:px-16">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop/${category.slug}`}
            className="group w-[62vw] shrink-0 sm:w-[38vw] md:w-[30vw] lg:w-[21vw] xl:w-[17vw]"
          >
            <div className={cn("relative overflow-hidden bg-shell", ratio.portrait)}>
              <Media
                image={category.image}
                sizes="(min-width: 1280px) 17vw, (min-width: 768px) 30vw, 62vw"
                className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]"
              />
            </div>
            <h3 className="mt-4 font-display text-[1.25rem] leading-snug text-ink">
              {category.name}
            </h3>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-taupe">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   4. New arrivals
   The one conventional grid on the page, and it earns it: this is where
   people who came back to shop actually want to land.
   ========================================================================= */

export function NewArrivals({ products }: { products: ProductWithRelations[] }) {
  return (
    <section className="shell pb-20 md:pb-28">
      <SectionHeader
        eyebrow="Just arrived"
        title="New this month"
        action={{ label: "See everything new", href: "/shop?sort=newest" }}
      />

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6 lg:gap-x-8">
        {products.slice(0, 4).map((product, index) => (
          <Reveal key={product.id} delay={index * 60}>
            <ProductCard
              product={product}
              sizes="(min-width: 768px) 23vw, 45vw"
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   5. Silk stories
   Image-heavy, warm, and off-centre: the text block overlaps the image on
   desktop rather than sitting politely beside it.
   ========================================================================= */

export function SilkStories({
  collection,
  products,
}: {
  collection: Collection;
  products: ProductWithRelations[];
}) {
  return (
    <section className="relative overflow-hidden bg-shell/70 py-20 md:py-28">
      <div className="shell">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className={cn("relative overflow-hidden", ratio.landscape)}>
              <Media
                image={collection.image}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="absolute inset-0"
              />
            </div>
          </Reveal>

          <Reveal
            delay={80}
            className="lg:col-span-6 lg:col-start-7 lg:-ml-16 lg:bg-paper lg:p-12 xl:-ml-24 xl:p-14"
          >
            <p className="eyebrow">Silk stories</p>
            <h2 className="display-lg mt-5">
              From the looms
              <br />
              of Kanchipuram
            </h2>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-graphite">
              {collection.story}
            </p>
            <Link
              href={`/collections/${collection.slug}`}
              className="link-rule mt-7 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
            >
              Explore silk sarees
            </Link>
          </Reveal>
        </div>

        {/* Three silks, sitting under the story rather than in their own band. */}
        <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8">
          {products.slice(0, 3).map((product, index) => (
            <Reveal key={product.id} delay={index * 60}>
              <ProductCard product={product} sizes="(min-width: 768px) 30vw, 45vw" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   6. Festive band
   The one dark section on the page. Deep maroon ground, image bleeding off
   the left edge, text right.
   ========================================================================= */

export function FestiveBand({ collection }: { collection: Collection }) {
  return (
    <section className="bg-maroon text-[#f0e4dc]">
      <div className="grid lg:grid-cols-12">
        <div className="relative aspect-[4/3] lg:col-span-6 lg:aspect-auto lg:min-h-[34rem]">
          <Media
            image={collection.image}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="flex items-center lg:col-span-6">
          <div className="px-5 py-16 md:px-14 lg:py-20 xl:px-20">
            <p className="text-[0.625rem] uppercase tracking-[0.22em] text-[#d8b39c]">
              The festive edit
            </p>

            <h2 className="mt-5 font-display text-[2.25rem] font-light leading-[1.05] text-[#f7ece4] md:text-[3.25rem]">
              Deep colour,
              <br />
              restrained gold
            </h2>

            <p className="measure mt-6 text-[0.9375rem] leading-relaxed text-[#e4cfc2]">
              {collection.story}
            </p>

            <Link
              href={`/collections/${collection.slug}`}
              className="mt-9 inline-block border border-[#c9a289] px-8 py-3.5 text-[0.6875rem] uppercase tracking-[0.16em] text-[#f7ece4] transition-colors duration-[240ms] hover:bg-[#f7ece4] hover:text-maroon"
            >
              Shop the edit
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   7. Atelier note
   A short signed note. Text-heavy, narrow measure, one small portrait.
   ========================================================================= */

export function AtelierNote() {
  return (
    <section className="shell py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-12 md:items-start">
        <Reveal className="md:col-span-3">
          <div className={cn("relative overflow-hidden", ratio.portrait)}>
            <Media
              image={{
                id: "atelier-portrait",
                url: null,
                alt: "Lakshmi Narayanan at the Karthika atelier in Alwarpet",
                kind: "lifestyle",
                tone: "sand",
                displayOrder: 0,
              }}
              sizes="(min-width: 768px) 22vw, 100vw"
              className="absolute inset-0"
            />
          </div>
        </Reveal>

        <Reveal delay={80} className="md:col-span-7 md:col-start-6">
          <p className="eyebrow">From the atelier</p>

          <p className="mt-6 font-display text-[1.5rem] font-light leading-[1.35] text-ink md:text-[1.875rem]">
            &ldquo;My grandmother had eleven sarees and could tell you where each one came from.
            I would rather sell one saree a woman keeps for thirty years than thirty she
            forgets.&rdquo;
          </p>

          <p className="mt-8 text-[0.9375rem] leading-relaxed text-graphite">
            We visit the looms four times a year. We pay before the saree is finished, not after
            it sells, because a weaver should not be the one carrying the risk. It makes our
            range smaller than it could be. We have made our peace with that.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <span className="h-px w-10 bg-stone" />
            <p className="text-[0.75rem] text-taupe">
              Lakshmi Narayanan, founder
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* =========================================================================
   8. Assurances
   A hairline row, not a card row. Four short facts, no shadows, no boxes.
   ========================================================================= */

const ASSURANCES = [
  {
    icon: TruckIcon,
    title: "Complimentary shipping",
    body: "On orders above Rs 5,000, anywhere in India. Dispatched within two working days.",
  },
  {
    icon: ReturnIcon,
    title: "Seven-day returns",
    body: "Unworn, with the tag on. We arrange the pickup and pay for it.",
  },
  {
    icon: LoomIcon,
    title: "Named weavers",
    body: "Every piece ships with a note saying who wove it and how long it took.",
  },
  {
    icon: ShieldIcon,
    title: "Secure payment",
    body: "UPI, cards, netbanking and cash on delivery. Nothing is stored on our servers.",
  },
];

export function Assurances() {
  return (
    <section className="shell pb-20 md:pb-28">
      <div className="grid gap-x-8 gap-y-10 border-t border-stone pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {ASSURANCES.map(({ icon: Icon, title, body }) => (
          <div key={title}>
            <Icon className="h-5 w-5 text-taupe" />
            <h3 className="mt-4 text-[0.6875rem] uppercase tracking-[0.18em] text-ink">
              {title}
            </h3>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-taupe">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
