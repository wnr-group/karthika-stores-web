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
    <footer className="mt-16 bg-forest text-paper/75 md:mt-20">
      <div className="shell grid gap-14 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
        {/* Masthead */}
        <div className="lg:col-span-5">
          <p className="font-display text-[2rem] leading-none text-paper">haat<span className="text-sandal">.</span></p>
          <p className="mt-1 text-[0.5rem] uppercase tracking-[0.3em] text-sandal/80">
            Imitation jewellery, textiles &amp; services
          </p>

          <p className="measure mt-8 text-sm leading-relaxed text-paper/75">
            Statement imitation jewellery, handwoven sarees and kurtis, and the stitching, draping
            and polishing that go with them.
          </p>

          <div className="mt-10 max-w-sm">
            <p className="eyebrow mb-4 !text-sandal">Newsletter</p>
            <p className="mb-4 text-[0.8125rem] text-paper/60">
              New arrivals and offers, twice a month.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="lg:col-span-1" />

        {/* Links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6">
          {footerNav.map((column) => (
            <div key={column.heading}>
              <p className="eyebrow mb-5 !text-sandal">{column.heading}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.8125rem] text-paper/70 transition-colors hover:text-sandal"
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
      <div className="shell grid gap-8 border-t border-paper/10 py-10 md:grid-cols-3">
        <div>
          <p className="eyebrow mb-3 !text-sandal">Haat HQ</p>
          <address className="text-[0.8125rem] not-italic leading-relaxed text-paper/70">
            {site.contact.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <p className="mt-2 text-[0.75rem] text-paper/50">{site.contact.hours}</p>
        </div>

        <div>
          <p className="eyebrow mb-3 !text-sandal">Reach us</p>
          <p className="text-[0.8125rem] leading-relaxed">
            <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="link-quiet text-paper/80 hover:text-sandal">
              {site.contact.phone}
            </a>
            <br />
            <a href={`mailto:${site.contact.email}`} className="link-quiet text-paper/80 hover:text-sandal">
              {site.contact.email}
            </a>
            <br />
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="link-quiet text-paper/80 hover:text-sandal"
            >
              WhatsApp
            </a>
          </p>
        </div>

        <div>
          <p className="eyebrow mb-3 !text-sandal">Follow</p>
          <ul className="flex gap-5 text-[0.8125rem]">
            <li>
              <a href={site.social.instagram} target="_blank" rel="noreferrer" className="link-quiet text-paper/80 hover:text-sandal">
                Instagram
              </a>
            </li>
            <li>
              <a href={site.social.pinterest} target="_blank" rel="noreferrer" className="link-quiet text-paper/80 hover:text-sandal">
                Pinterest
              </a>
            </li>
            <li>
              <a href={site.social.facebook} target="_blank" rel="noreferrer" className="link-quiet text-paper/80 hover:text-sandal">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Legal */}
      <div className="shell flex flex-col gap-4 border-t border-paper/10 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-[0.6875rem] text-paper/50">
          &copy; {year} {site.legalName}. All rights reserved.
        </p>

        <div className="flex flex-wrap items-center gap-5 text-[0.6875rem] text-paper/50">
          <Link href="/policies/privacy" className="transition-colors hover:text-sandal">
            Privacy
          </Link>
          <Link href="/policies/terms" className="transition-colors hover:text-sandal">
            Terms
          </Link>
          <Link href="/policies/returns" className="transition-colors hover:text-sandal">
            Refunds
          </Link>
          <span aria-hidden className="text-paper/20">|</span>
          <span>UPI &middot; Cards &middot; Netbanking &middot; Cash on delivery</span>
        </div>
      </div>
    </footer>
  );
}
