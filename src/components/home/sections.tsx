import Link from "next/link";
import type { ReactNode } from "react";

import { ArrivalRail } from "@/components/home/arrival-rail";
import { ProductCard } from "@/components/product/product-card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Media } from "@/components/ui/media";
import type { Category, ProductImage, ProductWithRelations } from "@/lib/types";
import { site, valueAddedServices } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";

/* =========================================================================
   Shared bits
   ========================================================================= */

/** Eyebrow, title and an optional "view all" link on the right. */
function Header({
  eyebrow,
  title,
  intro,
  action,
  tone = "light",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: { label: string; href: string };
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p
          className={cn(
            "flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em]",
            dark ? "text-sandal" : "text-forest-soft",
          )}
        >
          <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-sandal" : "bg-brand")} />
          {eyebrow}
        </p>
        <h2
          className={cn(
            "mt-3 font-display text-[2rem] font-medium leading-[1.08] md:text-[2.5rem]",
            dark ? "text-paper" : "text-ink",
          )}
        >
          {title}
        </h2>
        {intro ? (
          <p className={cn("mt-3 text-[0.9375rem] leading-relaxed", dark ? "text-paper/70" : "text-graphite")}>
            {intro}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 text-[0.875rem] font-medium",
            dark ? "text-paper hover:text-sandal" : "text-ink hover:text-forest-soft",
          )}
        >
          {action.label}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function ProductRow({ products }: { products: ProductWithRelations[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
      {products.slice(0, 4).map((product) => (
        <ProductCard key={product.id} product={product} sizes="(min-width: 768px) 23vw, 45vw" />
      ))}
    </div>
  );
}

/* =========================================================================
   1. Shop by category
   ========================================================================= */

export interface CategoryTile {
  name: string;
  href: string;
  image: ProductImage;
}

export function CategoryTiles({ tiles }: { tiles: CategoryTile[] }) {
  return (
    <section className="shell py-12 md:py-16">
      <Header eyebrow="Shop by category" title="Find your piece" action={{ label: "View everything", href: "/shop" }} />

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link href={tile.href} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-shell">
                <Media
                  image={tile.image}
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 31vw, 47vw"
                  className="absolute inset-0 transition-transform duration-[600ms] group-hover:scale-[1.05]"
                />
              </div>
              <p className="mt-3 flex items-center justify-between text-[0.9375rem] font-medium text-ink">
                {tile.name}
                <ArrowRightIcon className="h-4 w-4 text-taupe transition-all group-hover:translate-x-0.5 group-hover:text-ink" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================================================================
   2. Imitation jewellery
   ========================================================================= */

/** Style shortcuts to try; the page only shows the ones that return pieces. */
export const JEWELLERY_STYLES = ["Kundan", "Temple", "Polki", "Jhumka", "Choker", "Oxidised", "Bangles", "Earrings", "Necklace", "Ring"];

export function JewelleryBox({ products, styles }: { products: ProductWithRelations[]; styles: string[] }) {
  if (products.length === 0) return null;

  return (
    <section className="shell pb-12 md:pb-16">
      <Header
        eyebrow="Imitation jewellery"
        title="Fine looks, everyday prices"
        intro="Kundan, polki and temple styles, plated to last and finished by hand."
        action={{ label: "Shop all jewellery", href: "/shop/imitation-jewellery" }}
      />

      {styles.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {styles.map((style) => (
            <li key={style}>
              <Link
                href={`/shop/imitation-jewellery?q=${encodeURIComponent(style)}`}
                className="inline-block rounded-full border border-stone bg-paper px-4 py-2 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                {style}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <ProductRow products={products} />
    </section>
  );
}

/* =========================================================================
   3. Promo pair
   ========================================================================= */

export interface Promo {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  image: ProductImage;
}

export function PromoPair({ promos }: { promos: [Promo, Promo] }) {
  return (
    <section className="shell pb-12 md:pb-16">
      <div className="grid gap-4 md:grid-cols-2">
        {promos.map((promo, index) => {
          const dark = index === 0;
          return (
            <Link
              key={promo.href}
              href={promo.href}
              className={cn(
                "group grid min-h-[15rem] grid-cols-5 overflow-hidden rounded-[1.5rem]",
                dark ? "bg-forest" : "bg-shell",
              )}
            >
              <div className="col-span-3 flex flex-col justify-center p-6 md:p-8">
                <p className={cn("text-[0.6875rem] font-medium uppercase tracking-[0.2em]", dark ? "text-sandal" : "text-forest-soft")}>
                  {promo.eyebrow}
                </p>
                <h3 className={cn("mt-3 font-display text-[1.625rem] font-medium leading-tight md:text-[1.875rem]", dark ? "text-paper" : "text-ink")}>
                  {promo.title}
                </h3>
                <p className={cn("mt-2 text-[0.875rem] leading-relaxed", dark ? "text-paper/70" : "text-graphite")}>
                  {promo.body}
                </p>
                <span className={cn("mt-5 inline-flex items-center gap-2 text-[0.875rem] font-medium", dark ? "text-paper" : "text-ink")}>
                  {promo.cta}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <div className="relative col-span-2">
                <Media
                  image={promo.image}
                  sizes="(min-width: 768px) 20vw, 40vw"
                  className="absolute inset-0 transition-transform duration-[600ms] group-hover:scale-[1.04]"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================================
   4. New arrivals
   ========================================================================= */

export function NewArrivalsBand({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) return null;

  return (
    <section className="bg-forest py-14 md:py-16">
      <div className="shell">
        <Header
          tone="dark"
          eyebrow="Just in"
          title="New arrivals"
          action={{ label: "See everything new", href: "/shop?sort=newest" }}
        />
        <ArrivalRail products={products} />
      </div>
    </section>
  );
}

/* =========================================================================
   5. Textiles
   ========================================================================= */

export function TextileEdit({ weaves, products }: { weaves: Category[]; products: ProductWithRelations[] }) {
  if (products.length === 0) return null;

  return (
    <section className="shell py-12 md:py-16">
      <Header
        eyebrow="Textiles"
        title="Sarees, kurtis & dresses"
        intro="Silks for the big days, cottons and linens for every other one. Bought straight from the looms."
        action={{ label: "Shop textiles", href: "/shop/fashion" }}
      />

      {weaves.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {weaves.map((weave) => (
            <li key={weave.id}>
              <Link
                href={`/shop/${weave.slug}`}
                className="inline-block rounded-full bg-shell px-4 py-2 text-[0.8125rem] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                {weave.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <ProductRow products={products} />
    </section>
  );
}

/* =========================================================================
   6. Value-added services
   ========================================================================= */

export function ValueServices() {
  return (
    <section id="services" className="scroll-mt-24 bg-shell py-14 md:py-16">
      <div className="shell">
        <Header
          eyebrow="Value-added services"
          title="We finish it for you"
          intro="Stitched, pleated, polished and wrapped by our own team. Book any of these on WhatsApp."
        />

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {valueAddedServices.map((service, index) => (
            <li key={service.title} className="flex flex-col rounded-2xl bg-paper p-6">
              <div className="flex items-center gap-4">
                <span className="tnum flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-[0.8125rem] font-medium text-paper">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-sans text-[1rem] font-medium text-ink">{service.title}</h3>
              </div>
              <p className="mt-4 flex-1 text-[0.875rem] leading-relaxed text-graphite">{service.body}</p>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-stone pt-4">
                <p className="text-[0.8125rem] text-taupe">
                  From <span className="tnum font-medium text-ink">{formatPrice(service.fromPrice)}</span>
                </p>
                <a
                  href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(service.enquiry)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-forest px-4 text-[0.8125rem] font-medium text-paper transition-colors hover:bg-forest-soft"
                >
                  Enquire
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* =========================================================================
   7. Reviews
   ========================================================================= */

export interface ReviewCard {
  id: string;
  body: string;
  author: string;
  detail: string;
  rating: number;
}

export function Reviews({ reviews }: { reviews: ReviewCard[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="shell py-12 md:py-16">
      <Header eyebrow="Reviews" title="What customers say" />
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 3).map((review) => (
          <li key={review.id} className="flex flex-col rounded-2xl border border-stone bg-paper p-6">
            <p aria-label={`${review.rating} out of 5`} className="text-[0.875rem] tracking-[0.15em] text-gold">
              {"★".repeat(review.rating)}
              <span className="text-stone">{"★".repeat(5 - review.rating)}</span>
            </p>
            <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-ink">{review.body}</blockquote>
            <footer className="mt-5 border-t border-stone pt-4">
              <p className="text-[0.875rem] font-medium text-ink">{review.author}</p>
              <p className="mt-0.5 text-[0.75rem] text-taupe">{review.detail}</p>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================================================================
   8. More to explore
   ========================================================================= */

export function MoreToExplore({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="shell pb-4">
      <div className="rounded-[1.5rem] border border-stone p-6 md:p-8">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-forest-soft">Also in store</p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/shop/${category.slug}`}
                className="inline-flex items-center gap-2.5 rounded-full border border-stone bg-paper py-1.5 pl-1.5 pr-4 text-[0.8125rem] text-ink transition-colors hover:border-ink"
              >
                <span className="relative h-8 w-8 overflow-hidden rounded-full bg-shell">
                  <Media image={category.image} sizes="64px" className="absolute inset-0" />
                </span>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
