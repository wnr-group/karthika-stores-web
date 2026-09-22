import Link from "next/link";

import { NewsletterForm } from "@/components/layout/newsletter-form";
import { footerNav, site } from "@/lib/site";

/**
 * The footer.
 *
 * A wide masthead block on the left with the letter sign-up, four link
 * columns on the right, and a hairline legal row underneath. No icons except
 * the three social links, and no payment badge wall.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-stone bg-shell/60 md:mt-32">
      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
        {/* Masthead */}
        <div className="lg:col-span-5">
          <p className="font-display text-[1.35rem] tracking-[0.34em] text-ink">KARTHIKA</p>
          <p className="mt-1 text-[0.5rem] uppercase tracking-[0.3em] text-taupe">
            Saree Atelier &middot; Est. {site.founded}
          </p>

          <p className="measure mt-8 text-sm leading-relaxed text-graphite">
            Rooted in Indian craftsmanship, made for the way women dress today. We buy from six
            weaving families and we tell you which one made your saree.
          </p>

          <div className="mt-10 max-w-sm">
            <p className="eyebrow mb-4">The Letter</p>
            <p className="mb-4 text-[0.8125rem] text-taupe">
              New pieces, twice a month. Nothing else.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="lg:col-span-1" />

        {/* Links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-6">
          {footerNav.map((column) => (
            <div key={column.heading}>
              <p className="eyebrow mb-5">{column.heading}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-quiet text-[0.8125rem] text-graphite hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Contact strip */}
      <div className="shell grid gap-8 border-t border-stone py-10 md:grid-cols-3">
        <div>
          <p className="eyebrow mb-3">The Atelier</p>
          <address className="text-[0.8125rem] not-italic leading-relaxed text-graphite">
            {site.contact.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <p className="mt-2 text-[0.75rem] text-taupe">{site.contact.hours}</p>
        </div>

        <div>
          <p className="eyebrow mb-3">Reach us</p>
          <p className="text-[0.8125rem] leading-relaxed">
            <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="link-quiet">
              {site.contact.phone}
            </a>
            <br />
            <a href={`mailto:${site.contact.email}`} className="link-quiet">
              {site.contact.email}
            </a>
            <br />
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="link-quiet"
            >
              WhatsApp
            </a>
          </p>
        </div>

        <div>
          <p className="eyebrow mb-3">Follow</p>
          <ul className="flex gap-5 text-[0.8125rem]">
            <li>
              <a href={site.social.instagram} target="_blank" rel="noreferrer" className="link-quiet">
                Instagram
              </a>
            </li>
            <li>
              <a href={site.social.pinterest} target="_blank" rel="noreferrer" className="link-quiet">
                Pinterest
              </a>
            </li>
            <li>
              <a href={site.social.facebook} target="_blank" rel="noreferrer" className="link-quiet">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Legal */}
      <div className="shell flex flex-col gap-4 border-t border-stone py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-[0.6875rem] text-taupe">
          &copy; {year} {site.legalName}. All rights reserved.
        </p>

        <div className="flex flex-wrap items-center gap-5 text-[0.6875rem] text-taupe">
          <Link href="/policies/privacy" className="transition-colors hover:text-ink">
            Privacy
          </Link>
          <Link href="/policies/terms" className="transition-colors hover:text-ink">
            Terms
          </Link>
          <Link href="/policies/returns" className="transition-colors hover:text-ink">
            Refunds
          </Link>
          <span aria-hidden className="text-stone">|</span>
          <span>UPI &middot; Cards &middot; Netbanking &middot; Cash on delivery</span>
        </div>
      </div>
    </footer>
  );
}
