/**
 * Brand, marketplace and commerce constants. Everything an operator would
 * plausibly want to change without touching a component lives here.
 */

import type { City, SubscriptionPlan } from "@/lib/types";

export const site = {
  /** The marketplace's name. Changing it here renames the whole platform. */
  name: "Haat",
  /** Used in <title> suffixes and structured data. */
  legalName: "Haat Marketplace Private Limited",
  tagline: "Imitation jewellery, textiles & services",
  description:
    "Statement imitation jewellery, handwoven sarees and textiles, and the finishing services that go with them: stitching, draping, polishing and more.",
  // `||` rather than `??`: an env var present but set to an empty string
  // must fall back too, or `new URL(site.url)` in the root layout throws.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "en_IN",
  currency: "INR",

  founded: 2024,
  city: "Chennai",

  /** Prefixes for customer-facing references. */
  orderPrefix: "HT",
  bookingPrefix: "BK",

  contact: {
    email: "hello@haat.market",
    phone: "+91 44 4212 8860",
    /** Digits only, for wa.me links. */
    whatsapp: "919840012345",
    address: ["12 Kasturi Ranga Road", "Alwarpet, Chennai 600018", "Tamil Nadu, India"],
    hours: "Support: every day, 9am to 9pm",
  },

  social: {
    instagram: "https://instagram.com",
    pinterest: "https://pinterest.com",
    facebook: "https://facebook.com",
  },
} as const;

/* -------------------------------------------------------------------------
   Commerce rules. The server is the only thing that reads these when it
   prices a cart; the UI reads them purely to explain itself. Per-vendor
   shipping fees and thresholds live on each vendor's settings.
   ------------------------------------------------------------------------- */

export const commerce = {
  /** Fallback when a vendor has not set its own free-shipping threshold. */
  freeShippingThreshold: 999,
  standardShipping: 79,
  /** Guard rail on the quantity stepper and on server-side validation. */
  maxLineQuantity: 10,
  productsPerPage: 24,
  servicesPerPage: 18,
} as const;

/* -------------------------------------------------------------------------
   Marketplace economics. The default commission sits under the override
   chain in `lib/marketplace/commission.ts`.
   ------------------------------------------------------------------------- */

export const marketplace = {
  defaultCommissionRate: 10,
  /** Charged per new listing beyond a plan's free allowance. Not yet billed. */
  listingFee: 0,
  featuredVendorFeeMonthly: 2999,
  paymentProcessingFeePercent: 2,
} as const;

export const plans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyFee: 0,
    commissionDiscount: 0,
    features: ["Up to 50 listings", "Storefront & dashboard", "Weekly payouts"],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyFee: 1499,
    commissionDiscount: 1,
    features: ["Unlimited listings", "Coupons & flash sales", "Analytics", "Twice-weekly payouts"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyFee: 4999,
    commissionDiscount: 2,
    features: ["Everything in Growth", "Featured placement credits", "Priority support", "Daily payouts"],
  },
];

/* -------------------------------------------------------------------------
   Cities. Location drives "near you", local delivery and service areas.
   ------------------------------------------------------------------------- */

export const cities: City[] = [
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu" },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka" },
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra" },
  { slug: "delhi", name: "Delhi", state: "Delhi" },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana" },
  { slug: "kochi", name: "Kochi", state: "Kerala" },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan" },
  { slug: "madurai", name: "Madurai", state: "Tamil Nadu" },
  { slug: "coimbatore", name: "Coimbatore", state: "Tamil Nadu" },
  { slug: "pune", name: "Pune", state: "Maharashtra" },
];

export const DEFAULT_CITY = "chennai";

/** The cookie the location selector writes and server components read. */
export const CITY_COOKIE = "haat.city";

export function cityName(slug: string | null | undefined): string {
  if (!slug) return "";
  return cities.find((city) => city.slug === slug)?.name ?? slug;
}

/* -------------------------------------------------------------------------
   Navigation
   ------------------------------------------------------------------------- */

export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  href: string;
  /** Rendered as a panel under the header on hover. */
  columns?: Array<{ heading: string; href?: string; links: NavLink[] }>;
  /** The single promoted image inside the panel. */
  feature?: { eyebrow: string; title: string; href: string; image: string; alt: string };
}

const PX = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const primaryNav: NavGroup[] = [
  {
    label: "Jewellery",
    href: "/shop/jewellery",
    columns: [
      {
        heading: "Imitation jewellery",
        href: "/shop/imitation-jewellery",
        links: [
          { label: "All imitation jewellery", href: "/shop/imitation-jewellery" },
          { label: "Kundan", href: "/shop/imitation-jewellery?q=Kundan" },
          { label: "Temple", href: "/shop/imitation-jewellery?q=Temple" },
          { label: "Jhumkas", href: "/shop/imitation-jewellery?q=Jhumka" },
        ],
      },
      {
        heading: "Fine jewellery",
        href: "/shop/fine-jewellery",
        links: [
          { label: "Silver & pearl", href: "/shop/fine-jewellery" },
          { label: "All jewellery", href: "/shop/jewellery" },
        ],
      },
      {
        heading: "Edits",
        links: [
          { label: "The wedding edit", href: "/collections/the-wedding-edit" },
          { label: "All collections", href: "/collections" },
        ],
      },
    ],
    feature: {
      eyebrow: "The wedding edit",
      title: "Kundan, temple and polki for the big day",
      href: "/collections/the-wedding-edit",
      image: PX(33154729),
      alt: "Kundan bridal choker necklace with earrings and maang tikka",
    },
  },
  {
    label: "Textiles",
    href: "/shop/fashion",
    columns: [
      {
        heading: "Sarees",
        href: "/shop/sarees",
        links: [
          { label: "All sarees", href: "/shop/sarees" },
          { label: "Kanchipuram silk", href: "/shop/kanchipuram-silk" },
          { label: "Banarasi", href: "/shop/banarasi" },
          { label: "Organza", href: "/shop/organza" },
          { label: "Cotton", href: "/shop/cotton" },
          { label: "Linen", href: "/shop/linen" },
        ],
      },
      {
        heading: "Wear",
        links: [
          { label: "Kurtis", href: "/shop/kurtis" },
          { label: "Dresses", href: "/shop/dresses" },
          { label: "Accessories", href: "/shop/accessories" },
          { label: "Handbags", href: "/shop/handbags" },
        ],
      },
      {
        heading: "Shop",
        links: [
          { label: "New arrivals", href: "/shop?sort=newest" },
          { label: "Best sellers", href: "/shop?sort=popular" },
          { label: "Everything", href: "/shop" },
        ],
      },
    ],
  },
  {
    label: "Services",
    href: "/#services",
  },
  {
    label: "Collections",
    href: "/collections",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export const footerNav: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: "Shop",
    links: [
      { label: "Imitation jewellery", href: "/shop/imitation-jewellery" },
      { label: "Fine jewellery", href: "/shop/fine-jewellery" },
      { label: "Sarees", href: "/shop/sarees" },
      { label: "Kurtis", href: "/shop/kurtis" },
      { label: "Dresses", href: "/shop/dresses" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "New arrivals", href: "/shop?sort=newest" },
      { label: "Collections", href: "/collections" },
      { label: "Value-added services", href: "/#services" },
      { label: "Our story", href: "/about" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Shipping & delivery", href: "/policies/shipping" },
      { label: "Returns & refunds", href: "/policies/returns" },
      { label: "Privacy", href: "/policies/privacy" },
      { label: "Terms", href: "/policies/terms" },
    ],
  },
];

/** The rotating strip above the header. */
export const announcements: string[] = [
  "Free delivery on orders above Rs 999",
  "Blouse stitching, fall & pico and pre-pleating on any saree you buy",
  "Jewellery polishing and repair, done in-house",
];

/* -------------------------------------------------------------------------
   Value-added services, shown on the homepage. Booked by WhatsApp enquiry
   until a services booking page exists. Prices are "from" amounts in rupees.
   ------------------------------------------------------------------------- */

export interface ValueAddedService {
  title: string;
  body: string;
  fromPrice: number;
  /** Pre-filled WhatsApp message. */
  enquiry: string;
}

export const valueAddedServices: ValueAddedService[] = [
  {
    title: "Blouse stitching",
    body: "Measured, cut and stitched to your pattern, ready in five working days.",
    fromPrice: 650,
    enquiry: "Hi, I would like to book blouse stitching.",
  },
  {
    title: "Fall & pico",
    body: "Fall stitched and edges finished on any saree, bought here or not.",
    fromPrice: 150,
    enquiry: "Hi, I would like fall and pico done on a saree.",
  },
  {
    title: "Pre-pleating & box folding",
    body: "Pleats pressed in and folded, so the saree drapes in five minutes.",
    fromPrice: 350,
    enquiry: "Hi, I would like a saree pre-pleated.",
  },
  {
    title: "Saree draping",
    body: "A draper at your home or ours, for weddings, functions and photo shoots.",
    fromPrice: 1200,
    enquiry: "Hi, I would like to book saree draping.",
  },
  {
    title: "Jewellery polishing & repair",
    body: "Re-plating, stone setting and clasp repair for imitation and silver pieces.",
    fromPrice: 299,
    enquiry: "Hi, I would like jewellery polishing or repair.",
  },
  {
    title: "Gift wrapping",
    body: "Boxed, wrapped and sent with a handwritten note, for any order.",
    fromPrice: 99,
    enquiry: "Hi, I would like gift wrapping on my order.",
  },
];
