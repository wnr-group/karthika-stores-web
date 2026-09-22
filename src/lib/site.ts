/**
 * Brand and commerce constants. Everything a shop owner would plausibly want
 * to change without touching a component lives here.
 */

export const site = {
  name: "Karthika",
  /** Used in <title> suffixes and structured data. */
  legalName: "Karthika Saree Atelier",
  tagline: "A saree atelier",
  description:
    "Handwoven sarees from Kanchipuram, Banaras and the looms of the south, made for the way women dress now.",
  // `||` rather than `??`: an env var present but set to an empty string
  // (which is what Vercel creates if you import names from .env.example
  // without filling in values) must fall back too, or `new URL(site.url)`
  // in the root layout throws at build time.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "en_IN",
  currency: "INR",

  founded: 2016,
  city: "Chennai",

  contact: {
    email: "atelier@karthika.in",
    phone: "+91 44 4212 8860",
    /** Digits only, for wa.me links. */
    whatsapp: "919840012345",
    address: ["12 Kasturi Ranga Road", "Alwarpet, Chennai 600018", "Tamil Nadu, India"],
    hours: "Monday to Saturday, 10.30am to 7pm",
  },

  social: {
    instagram: "https://instagram.com",
    pinterest: "https://pinterest.com",
    facebook: "https://facebook.com",
  },
} as const;

/* -------------------------------------------------------------------------
   Commerce rules. The server is the only thing that reads these when it
   prices a cart; the UI reads them purely to explain itself.
   ------------------------------------------------------------------------- */

export const commerce = {
  /** Orders at or above this ship free across India. */
  freeShippingThreshold: 5000,
  standardShipping: 250,
  /** Guard rail on the quantity stepper and on server-side validation. */
  maxLineQuantity: 5,
  productsPerPage: 12,
} as const;

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
  columns?: Array<{ heading: string; links: NavLink[] }>;
  /** The single promoted image inside the panel. */
  feature?: { eyebrow: string; title: string; href: string; tone: string };
}

export const primaryNav: NavGroup[] = [
  {
    label: "New Arrivals",
    href: "/shop?sort=newest",
  },
  {
    label: "Sarees",
    href: "/shop",
    columns: [
      {
        heading: "By weave",
        links: [
          { label: "Kanchipuram Silk", href: "/shop/kanchipuram-silk" },
          { label: "Banarasi", href: "/shop/banarasi" },
          { label: "Chanderi", href: "/shop/chanderi" },
          { label: "Organza", href: "/shop/organza" },
        ],
      },
      {
        heading: "Everyday",
        links: [
          { label: "Linen", href: "/shop/linen" },
          { label: "Cotton", href: "/shop/cotton" },
          { label: "Printed", href: "/shop/printed" },
          { label: "All sarees", href: "/shop" },
        ],
      },
      {
        heading: "By occasion",
        links: [
          { label: "Festive", href: "/shop/festive" },
          { label: "Wedding", href: "/shop/wedding" },
          { label: "Under 10,000", href: "/shop?maxPrice=10000" },
          { label: "In stock", href: "/shop?availability=in-stock" },
        ],
      },
    ],
    feature: {
      eyebrow: "The new season",
      title: "Kanchipuram, rewoven",
      href: "/collections/the-new-season",
      tone: "maroon",
    },
  },
  {
    label: "Collections",
    href: "/collections",
    columns: [
      {
        heading: "Curated",
        links: [
          { label: "The New Season", href: "/collections/the-new-season" },
          { label: "Silk Stories", href: "/collections/silk-stories" },
          { label: "The Festive Edit", href: "/collections/the-festive-edit" },
        ],
      },
      {
        heading: "Also",
        links: [
          { label: "Everyday Drape", href: "/collections/everyday-drape" },
          { label: "Bridal Heirloom", href: "/collections/bridal-heirloom" },
          { label: "All collections", href: "/collections" },
        ],
      },
    ],
  },
  {
    label: "Silk",
    href: "/collections/silk-stories",
  },
  {
    label: "Festive",
    href: "/collections/the-festive-edit",
  },
  {
    label: "About",
    href: "/about",
  },
];

export const footerNav: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: "Shop",
    links: [
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "All Sarees", href: "/shop" },
      { label: "Kanchipuram Silk", href: "/shop/kanchipuram-silk" },
      { label: "Banarasi", href: "/shop/banarasi" },
      { label: "Linen & Cotton", href: "/shop/linen" },
    ],
  },
  {
    heading: "Collections",
    links: [
      { label: "The New Season", href: "/collections/the-new-season" },
      { label: "Silk Stories", href: "/collections/silk-stories" },
      { label: "The Festive Edit", href: "/collections/the-festive-edit" },
      { label: "Bridal Heirloom", href: "/collections/bridal-heirloom" },
    ],
  },
  {
    heading: "Atelier",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "The Weavers", href: "/about#weavers" },
      { label: "Visit Us", href: "/contact" },
      { label: "Bespoke Orders", href: "/contact#bespoke" },
    ],
  },
  {
    heading: "Care",
    links: [
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns & Exchange", href: "/policies/returns" },
      { label: "Saree Care", href: "/policies/care" },
      { label: "Privacy", href: "/policies/privacy" },
      { label: "Terms", href: "/policies/terms" },
    ],
  },
];

/** The rotating strip above the header. Kept short and unexcited. */
export const announcements: string[] = [
  "Complimentary shipping across India on orders above Rs 5,000",
  "Each saree ships with its weaver's note and a cotton storage bag",
  "Ready to wear? Ask us about fall, pico and blouse stitching",
];
