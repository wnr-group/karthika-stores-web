import Link from "next/link";

import { Media } from "@/components/ui/media";
import type { Banner } from "@/lib/types";

/**
 * The hero.
 *
 * Deliberately not a headline centred over a photograph. The type sits in its
 * own ivory column on the left and the image runs off the right edge of the
 * screen, which is how a magazine opens a feature and which keeps the words
 * legible whatever the photography turns out to be.
 */
export function Hero({ banner }: { banner: Banner }) {
  return (
    <section className="relative border-b border-stone">
      <div className="lg:grid lg:min-h-[86vh] lg:grid-cols-12">
        {/* Image. First on mobile, right-hand seven columns on desktop. */}
        <div className="relative order-1 aspect-[4/5] w-full sm:aspect-[3/2] lg:order-2 lg:col-span-7 lg:aspect-auto">
          <Media
            image={banner.image}
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {/* Type */}
        <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
          <div className="px-5 py-12 md:px-10 md:py-16 lg:py-24 xl:pl-16 xl:pr-14">
            <p className="eyebrow">{banner.eyebrow}</p>

            <h1 className="display-xl mt-7">
              {/* Broken by hand so the line falls where it should. */}
              The art
              <br />
              of the drape
            </h1>

            <p className="measure mt-8 text-[0.9375rem] leading-relaxed text-graphite">
              {banner.body}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href={banner.ctaHref}
                className="border border-ink px-8 py-3.5 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors duration-[240ms] hover:bg-ink hover:text-paper"
              >
                {banner.ctaLabel}
              </Link>

              {banner.secondaryHref && banner.secondaryLabel ? (
                <Link
                  href={banner.secondaryHref}
                  className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]"
                >
                  {banner.secondaryLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* A caption rule under the fold, in the manner of a photo credit. */}
      <div className="shell flex items-center justify-between border-t border-stone py-3.5">
        <p className="text-[0.625rem] uppercase tracking-[0.2em] text-taupe">
          Kanchipuram, March
        </p>
        <p className="hidden text-[0.625rem] uppercase tracking-[0.2em] text-taupe sm:block">
          Photographed at the Alwarpet atelier
        </p>
        <p className="text-[0.625rem] uppercase tracking-[0.2em] text-taupe">01 / 04</p>
      </div>
    </section>
  );
}
