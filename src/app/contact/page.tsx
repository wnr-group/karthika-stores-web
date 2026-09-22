import type { Metadata } from "next";

import { Breadcrumb } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Visit the Alwarpet atelier, or reach us by phone, email or WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <header className="mt-8 max-w-2xl border-b border-stone pb-12">
        <p className="eyebrow mb-4">Get in touch</p>
        <h1 className="display-lg">We answer these ourselves.</h1>
        <p className="mt-6 text-[0.9375rem] leading-relaxed text-graphite">
          Fabric weight, colour under different light, a fall-and-pico request, a bespoke blouse:
          write to us, call, or come to Alwarpet and see the piece in daylight before you decide.
        </p>
      </header>

      <div className="mt-14 grid gap-12 md:grid-cols-3">
        <div>
          <p className="eyebrow mb-3">Visit</p>
          <address className="text-[0.9375rem] not-italic leading-relaxed text-graphite">
            {site.contact.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <p className="mt-3 text-[0.8125rem] text-taupe">{site.contact.hours}</p>
        </div>

        <div>
          <p className="eyebrow mb-3">Reach us</p>
          <p className="text-[0.9375rem] leading-relaxed">
            <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="link-quiet text-ink">
              {site.contact.phone}
            </a>
            <br />
            <a href={`mailto:${site.contact.email}`} className="link-quiet text-ink">
              {site.contact.email}
            </a>
            <br />
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="link-quiet text-ink"
            >
              WhatsApp
            </a>
          </p>
        </div>

        <div>
          <p className="eyebrow mb-3">Follow</p>
          <ul className="space-y-2 text-[0.9375rem]">
            <li>
              <a href={site.social.instagram} target="_blank" rel="noreferrer" className="link-quiet text-ink">
                Instagram
              </a>
            </li>
            <li>
              <a href={site.social.pinterest} target="_blank" rel="noreferrer" className="link-quiet text-ink">
                Pinterest
              </a>
            </li>
            <li>
              <a href={site.social.facebook} target="_blank" rel="noreferrer" className="link-quiet text-ink">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-14 border-t border-stone pt-10">
        <p className="text-[0.8125rem] leading-relaxed text-taupe">
          For an order already placed, include the order number ({" "}
          <span className="tnum">e.g. KAR-24081</span>) so we can find it immediately.
        </p>
      </div>
    </div>
  );
}
