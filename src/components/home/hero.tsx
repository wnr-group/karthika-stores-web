import Link from "next/link";

import { ArrowRightIcon, CheckIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";
import { Media } from "@/components/ui/media";
import type { ProductImage } from "@/lib/types";

/**
 * The hero.
 *
 * One rounded green banner: the pitch and the numbers on the left, a
 * three-photo collage on the right where the two small photos are also the
 * fastest way into the two main departments. A row of promises sits under it.
 */

export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroTile {
  label: string;
  href: string;
  image: ProductImage;
}

interface HeroProps {
  leadImage: ProductImage;
  tiles: [HeroTile, HeroTile];
  stats: HeroStat[];
}

const PROMISES = [
  { icon: TruckIcon, text: "Free delivery above Rs 999" },
  { icon: CheckIcon, text: "Stitching & finishing in-house" },
  { icon: ReturnIcon, text: "Seven-day easy returns" },
  { icon: ShieldIcon, text: "UPI, cards & cash on delivery" },
];

export function Hero({ leadImage, tiles, stats }: HeroProps) {
  return (
    <section className="shell pt-4 md:pt-6">
      <div className="grid overflow-hidden rounded-[1.75rem] bg-forest lg:min-h-[32rem] lg:grid-cols-12">
        {/* Pitch */}
        <div className="flex flex-col justify-between gap-8 p-7 md:p-10 lg:col-span-5">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-sandal">
              Jewellery &middot; Textiles &middot; Services
            </p>
            <h1 className="mt-5 font-display text-[2.25rem] font-medium leading-[1.05] text-paper md:text-[3rem] xl:text-[3.25rem]">
              Jewellery that shines. Sarees that stay.
            </h1>
            <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-paper/75">
              Imitation jewellery for every occasion, handwoven sarees and kurtis, and the
              stitching and finishing done for you before it ships.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop/imitation-jewellery"
                className="inline-flex h-12 items-center gap-2.5 rounded-full bg-paper px-6 text-[0.875rem] font-medium text-ink transition-colors hover:bg-sandal"
              >
                Shop jewellery
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/shop/sarees"
                className="inline-flex h-12 items-center rounded-full border border-paper/35 px-6 text-[0.875rem] font-medium text-paper transition-colors hover:border-paper hover:bg-paper/10"
              >
                Explore sarees
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-paper/15 pt-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="tnum font-display text-[1.75rem] font-medium leading-none text-paper md:text-[2rem]">
                  {stat.value}
                </dd>
                <dd className="mt-1.5 text-[0.75rem] leading-snug text-paper/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Collage */}
        <div className="grid h-[22rem] grid-cols-3 grid-rows-2 gap-2 p-2 sm:h-[28rem] lg:col-span-7 lg:h-full lg:min-h-[32rem]">
          <div className="relative col-span-2 row-span-2 overflow-hidden rounded-[1.375rem]">
            <Media
              image={leadImage}
              priority
              sizes="(min-width: 1024px) 38vw, 66vw"
              className="absolute inset-0"
            />
          </div>
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group relative overflow-hidden rounded-[1.375rem]"
            >
              <Media
                image={tile.image}
                priority
                sizes="(min-width: 1024px) 19vw, 33vw"
                className="absolute inset-0 transition-transform duration-[600ms] group-hover:scale-[1.05]"
              />
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-full bg-paper/95 py-2 pl-4 pr-2 text-[0.75rem] font-medium text-ink md:text-[0.8125rem]">
                <span className="truncate">{tile.label}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Promises */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-stone py-6 lg:grid-cols-4">
        {PROMISES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-[0.8125rem] text-graphite">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-shell text-ink">
              <Icon className="h-4 w-4" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
