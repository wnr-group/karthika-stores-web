import Link from "next/link";

import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-24">
      <div className="max-w-xl">
        <p className="eyebrow">404</p>
        <h1 className="display-lg mt-5">This page has gone.</h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed text-graphite">
          Either the piece has sold and been taken down, or the link has a typo in it. Both happen
          more than we would like.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/shop"
            className="border border-ink px-8 py-3.5 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Browse sarees
          </Link>
          <Link href="/" className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]">
            Back to the homepage
          </Link>
        </div>

        <p className="mt-12 border-t border-stone pt-6 text-[0.8125rem] text-taupe">
          Looking for something specific? Tell us on{" "}
          <a
            href={`https://wa.me/${site.contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="link-rule text-ink"
          >
            WhatsApp
          </a>{" "}
          and we will find it.
        </p>
      </div>
    </div>
  );
}
