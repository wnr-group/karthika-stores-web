import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/ui/primitives";
import { site } from "@/lib/site";

interface Policy {
  slug: string;
  title: string;
  description: string;
  body: Array<{ heading: string; paragraphs: string[] }>;
}

const POLICIES: Policy[] = [
  {
    slug: "shipping",
    title: "Shipping",
    description: "How and when we ship, and what it costs.",
    body: [
      {
        heading: "Dispatch",
        paragraphs: [
          "Everything in stock ships within two working days. A piece that needs fall, pico or a blouse stitched to order takes five to seven days; we will tell you the exact date at checkout.",
          `Orders above ${"₹5,000"} ship free across India. Below that, shipping is a flat ${"₹250"}.`,
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Metro cities usually take two to four working days from dispatch; the rest of India, four to seven. You will get a tracking link by SMS and email the moment the courier picks up.",
        ],
      },
      {
        heading: "International",
        paragraphs: [
          `We ship outside India on request. Write to ${site.contact.email} with your address and we will quote the courier cost separately, since it varies a great deal by country.`,
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Exchange",
    description: "Our return and exchange window, and how to start one.",
    body: [
      {
        heading: "The window",
        paragraphs: [
          "Unworn, unwashed pieces with tags attached can be returned or exchanged within seven days of delivery. Blouse pieces cut to a custom size and bespoke stitching are final sale.",
        ],
      },
      {
        heading: "How it works",
        paragraphs: [
          `Message us on WhatsApp or email ${site.contact.email} with your order number and we will arrange a pickup. Refunds are issued to the original payment method within five to seven working days of the piece reaching us.`,
        ],
      },
      {
        heading: "Cash on delivery",
        paragraphs: [
          "Orders paid by cash on delivery are refunded by bank transfer, so please have your account details ready when you write in.",
        ],
      },
    ],
  },
  {
    slug: "care",
    title: "Saree Care",
    description: "How to store, wash and iron each fabric we sell.",
    body: [
      {
        heading: "Silk",
        paragraphs: [
          "Dry clean only, and tell the cleaner it is pure zari. Store folded in the cotton bag it arrived in, and refold along a new line every few months so the zari does not crease in one place. Keep away from direct sunlight, damp and naphthalene.",
        ],
      },
      {
        heading: "Cotton and linen",
        paragraphs: [
          "First wash separately in cold water; the colour settles after two or three washes. Gentle hand wash with a mild detergent, no bleach, no brush. Dry in shade and steam iron while very slightly damp.",
        ],
      },
      {
        heading: "Organza and chanderi",
        paragraphs: [
          "Dry clean only. Hang rather than fold, on a padded hanger, so the crispness holds. Never wring, and never iron directly on the fabric; use a muslin cloth.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    description: "What we collect and what we do with it.",
    body: [
      {
        heading: "What we collect",
        paragraphs: [
          "Your name, address, phone number and email when you place an order or create an account, and nothing more than that. We do not sell or rent this information to anyone.",
        ],
      },
      {
        heading: "Payments",
        paragraphs: [
          "Card and UPI payments are processed by Razorpay; we never see or store your card number. Cash-on-delivery orders are settled directly with our courier partner.",
        ],
      },
      {
        heading: "Your data",
        paragraphs: [
          `Write to ${site.contact.email} at any time to see, correct or delete the information we hold on you.`,
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms",
    description: "The terms of using this site and buying from us.",
    body: [
      {
        heading: "Orders",
        paragraphs: [
          "Placing an order is an offer to buy, which we accept when we confirm and dispatch it. Prices are in Indian rupees and include GST. We reserve the right to cancel an order that was mispriced or where the item has sold out before dispatch, in which case any payment taken is refunded in full.",
        ],
      },
      {
        heading: "Product",
        paragraphs: [
          "Handloom sarees vary slightly from the photograph in colour and weave, being handmade; this is the nature of the fabric, not a fault. Weight and length are given on each product page as woven, within a small tolerance.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`Karthika is a trading name of ${site.legalName}, ${site.city}.`],
      },
    ],
  },
];

export async function generateStaticParams() {
  return POLICIES.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES.find((entry) => entry.slug === slug);
  if (!policy) return { title: "Not found" };

  return {
    title: policy.title,
    description: policy.description,
    alternates: { canonical: `/policies/${policy.slug}` },
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = POLICIES.find((entry) => entry.slug === slug);

  if (!policy) notFound();

  return (
    <div className="shell pb-24 pt-8 md:pt-10">
      <Breadcrumb
        trail={[{ label: "Home", href: "/" }, { label: "Policies", href: "/policies/shipping" }, { label: policy.title }]}
      />

      <header className="mt-8 max-w-2xl border-b border-stone pb-12">
        <p className="eyebrow mb-4">Policies</p>
        <h1 className="display-lg">{policy.title}</h1>
      </header>

      <div className="mt-12 grid gap-12 md:grid-cols-12">
        <nav aria-label="Policies" className="md:col-span-3">
          <ul className="space-y-1 border-l border-stone">
            {POLICIES.map((entry) => (
              <li key={entry.slug}>
                <a
                  href={`/policies/${entry.slug}`}
                  className={
                    entry.slug === policy.slug
                      ? "-ml-px block border-l border-ink py-2 pl-4 text-[0.75rem] uppercase tracking-[0.14em] text-ink"
                      : "-ml-px block border-l border-transparent py-2 pl-4 text-[0.75rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-ink"
                  }
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-2xl space-y-10 md:col-span-8 md:col-start-5">
          {policy.body.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="mt-4 text-[0.9375rem] leading-relaxed text-graphite">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
