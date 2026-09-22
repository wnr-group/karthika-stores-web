import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumb } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Karthika: the weavers, the atelier, and why we buy the way we do.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="pb-24">
      <div className="shell pt-8 md:pt-10">
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <header className="mt-8 max-w-3xl border-b border-stone pb-14">
          <p className="eyebrow mb-4">Since {site.founded}</p>
          <h1 className="display-lg">A shop built around six looms, not one warehouse.</h1>
          <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-graphite">
            {site.description} We buy from the weavers directly, we visit the looms ourselves,
            and every saree on this site carries the name of the family that made it.
          </p>
        </header>
      </div>

      <div className="shell mt-14 grid gap-14 md:mt-20 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-5">
          <p className="eyebrow mb-4">How we buy</p>
          <h2 className="display-sm">Six families, not a marketplace.</h2>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="text-[0.9375rem] leading-relaxed text-graphite">
            We started in {site.founded} with a single relationship: Rathinam and his sons on
            Salai Street in Kanchipuram. Everything since has grown the same way, one loom at a
            time. We do not buy on consignment and we do not list anything we have not seen woven.
            When a saree sells out, it sells out, and it comes back only when the same hands make
            another.
          </p>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-graphite">
            That is slower than running a warehouse. It also means the fabric on the tag is the
            fabric in the parcel, and the weaver&apos;s name printed on it is a real person we can
            put you in touch with.
          </p>
        </div>
      </div>

      <div className="shell mt-14 grid gap-14 md:mt-20 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-5">
          <p className="eyebrow mb-4">Visit</p>
          <h2 className="display-sm">The Alwarpet atelier.</h2>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <address className="text-[0.9375rem] not-italic leading-relaxed text-graphite">
            {site.contact.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <p className="mt-3 text-[0.9375rem] text-graphite">{site.contact.hours}</p>
          <Link href="/contact" className="link-rule mt-6 inline-block text-[0.6875rem] uppercase tracking-[0.16em]">
            Get in touch
          </Link>
        </div>
      </div>

      <div className="shell mt-14 border-t border-stone pt-14 text-center md:mt-20">
        <h2 className="display-sm">Have a question about a piece?</h2>
        <p className="measure mx-auto mt-4 text-sm text-taupe">
          Fabric weight, colour under different light, draping advice: ask us before you buy, not
          after.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-block border border-ink px-8 py-3.5 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Talk to the atelier
        </Link>
      </div>
    </div>
  );
}
