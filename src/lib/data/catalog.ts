/**
 * The Karthika catalogue.
 *
 * This is the seed content the storefront runs on until Supabase is wired up.
 * It is shaped exactly like the database rows, so `MockRepository` and
 * `SupabaseRepository` return identical objects and no component knows which
 * one it is talking to. `supabase/seed.sql` is generated from this same data.
 *
 * Every `url` is null on purpose: real photography has not been shot yet, and
 * the placeholder system in `components/ui/media.tsx` renders a woven ground
 * in the garment's own tone instead. Drop a Supabase Storage URL into any
 * `url` field and that image starts rendering. Nothing else has to change.
 */

import type {
  Banner,
  Category,
  Collection,
  ImageKind,
  Product,
  Tone,
} from "@/lib/types";

/* -------------------------------------------------------------------------
   Image helpers
   ------------------------------------------------------------------------- */

const GALLERY_ORDER: ImageKind[] = [
  "primary",
  "draped",
  "detail",
  "border",
  "fabric",
  "lifestyle",
];

const ALT_BY_KIND: Record<ImageKind, (name: string, fabric: string) => string> = {
  primary: (name) => `${name} draped on a model, front view`,
  draped: (name) => `${name} shown in full drape from the side`,
  detail: (name, fabric) => `Close crop of the ${fabric.toLowerCase()} weave on the ${name}`,
  border: (name) => `The border and pallu of the ${name}`,
  fabric: (name, fabric) => `Flat ${fabric.toLowerCase()} texture from the ${name}`,
  lifestyle: (name) => `${name} worn indoors in daylight`,
};

function gallery(slug: string, name: string, fabric: string, tone: Tone) {
  return GALLERY_ORDER.map((kind, index) => ({
    id: `${slug}-${kind}`,
    url: null,
    alt: ALT_BY_KIND[kind](name, fabric),
    kind,
    tone,
    displayOrder: index,
  }));
}

function cover(id: string, alt: string, tone: Tone, kind: ImageKind = "lifestyle") {
  return { id, url: null, alt, kind, tone, displayOrder: 0 };
}

/* -------------------------------------------------------------------------
   Care instructions, by fabric family
   ------------------------------------------------------------------------- */

const CARE = {
  silk: [
    "Dry clean only, and tell the cleaner it is pure zari.",
    "Store folded in the cotton bag it arrived in. Refold along a new line every few months so the zari does not crease in one place.",
    "Keep away from direct sunlight, damp and naphthalene.",
  ],
  organza: [
    "Dry clean only.",
    "Hang rather than fold, on a padded hanger, so the crispness holds.",
    "Never wring. Never iron directly on the fabric, use a muslin cloth.",
  ],
  cotton: [
    "First wash separately in cold water. The colour will settle after two or three washes.",
    "Gentle hand wash with a mild detergent. No bleach, no brush.",
    "Dry in shade and steam iron while very slightly damp.",
  ],
  linen: [
    "Gentle hand wash in cold water, or dry clean if you prefer the crisp finish.",
    "Dry flat in shade. Linen creases, that is the point of it.",
    "Iron on a medium setting while damp.",
  ],
  chanderi: [
    "Dry clean recommended for the first year.",
    "Store rolled rather than sharply folded, the silk-cotton mix marks easily.",
    "Steam iron on low, always on the reverse.",
  ],
} as const;

/* -------------------------------------------------------------------------
   Categories
   ------------------------------------------------------------------------- */

export const categories: Category[] = [
  {
    id: "cat-kanchipuram",
    name: "Kanchipuram Silk",
    slug: "kanchipuram-silk",
    description: "Korvai borders, three-ply mulberry silk, woven in and around Kanchipuram.",
    intro:
      "The body and the border are woven separately and locked together by hand at the join. Hold a Kanchipuram up to the light and you can find that seam. It is the reason the border sits flat when the rest of the saree moves.",
    image: cover("cat-kanchipuram-img", "A folded Kanchipuram silk saree with a contrast korvai border", "maroon"),
    displayOrder: 1,
  },
  {
    id: "cat-banarasi",
    name: "Banarasi",
    slug: "banarasi",
    description: "Brocade from the Varanasi looms, in katan silk and tissue.",
    intro:
      "Banaras weaves in metal. Kadhwa, cutwork, jangla, tissue: each is a different argument about how much gold a saree can carry before it stops being wearable. We buy the ones that stayed on the right side of that line.",
    image: cover("cat-banarasi-img", "Gold brocade motifs across a Banarasi silk saree", "ivory"),
    displayOrder: 2,
  },
  {
    id: "cat-organza",
    name: "Organza",
    slug: "organza",
    description: "Sheer, weightless, and sharper than it looks.",
    intro:
      "Organza holds its shape without any help. It photographs beautifully and it travels badly, so we ship it rolled.",
    image: cover("cat-organza-img", "Sheer organza saree catching light against a wall", "rose"),
    displayOrder: 3,
  },
  {
    id: "cat-linen",
    name: "Linen",
    slug: "linen",
    description: "Handwoven linen for the long working day.",
    intro:
      "Linen sarees crease within an hour of wearing them. We have stopped apologising for it. They also breathe through a Chennai May, which nothing else in this list can claim.",
    image: cover("cat-linen-img", "Textured handwoven linen saree folded on a wooden surface", "charcoal"),
    displayOrder: 4,
  },
  {
    id: "cat-cotton",
    name: "Cotton",
    slug: "cotton",
    description: "Everyday handloom cotton, mostly from Andhra and Bengal.",
    intro:
      "The kind of saree that gets worn twice a week and softens for years. Priced so that is possible.",
    image: cover("cat-cotton-img", "Striped handloom cotton saree stacked in a pile", "indigo"),
    displayOrder: 5,
  },
  {
    id: "cat-chanderi",
    name: "Chanderi",
    slug: "chanderi",
    description: "Silk-cotton from Madhya Pradesh, with that particular glassy sheen.",
    intro:
      "Chanderi is not quite silk and not quite cotton, and it is the transparency that gives it away. Best in the small motifs, worst when someone tries to make it grand.",
    image: cover("cat-chanderi-img", "Chanderi saree with fine gold butis held to the light", "sand"),
    displayOrder: 6,
  },
  {
    id: "cat-printed",
    name: "Printed",
    slug: "printed",
    description: "Hand block and screen prints on soft grounds.",
    intro:
      "Block printing leaves a slightly uneven edge where the wooden block lifts. We look for that, not against it.",
    image: cover("cat-printed-img", "Hand block printed saree with a repeating floral motif", "terracotta"),
    displayOrder: 7,
  },
  {
    id: "cat-festive",
    name: "Festive",
    slug: "festive",
    description: "Pieces built for a room full of people and low light.",
    intro:
      "Festive sarees have to work under tube light, under a lamp and in a phone camera flash. These do.",
    image: cover("cat-festive-img", "A deep maroon festive saree with gold zari lit warmly", "maroon"),
    displayOrder: 8,
  },
  {
    id: "cat-wedding",
    name: "Wedding",
    slug: "wedding",
    description: "The heavy pieces. Muhurtham silks and heirloom brocade.",
    intro:
      "A wedding saree is bought once and kept for forty years. We keep a small number and we tell you exactly what is in them.",
    image: cover("cat-wedding-img", "A bridal silk saree with a wide gold border laid flat", "saffron"),
    displayOrder: 9,
  },
];

/* -------------------------------------------------------------------------
   Collections
   ------------------------------------------------------------------------- */

export const collections: Collection[] = [
  {
    id: "col-new-season",
    name: "The New Season",
    slug: "the-new-season",
    description: "What came off the looms this quarter.",
    story:
      "We went back to Kanchipuram in March with a narrower brief than usual: fewer colours, thinner borders, and nothing above nine hundred grams. What came back is quieter than last year and easier to wear twice in a week.",
    image: cover("col-new-season-img", "New season sarees folded and stacked in daylight", "olive"),
    displayOrder: 1,
  },
  {
    id: "col-silk-stories",
    name: "Silk Stories",
    slug: "silk-stories",
    description: "From the looms of Kanchipuram and Banaras to your wardrobe.",
    story:
      "Six families weave for us. The oldest partnership is with Rathinam and his two sons on Salai Street, who have been putting korvai borders on our sarees since the first year. Everything here is three-ply mulberry silk with tested zari, and every piece carries the weaver's name on its tag.",
    image: cover("col-silk-stories-img", "A weaver's hands passing a shuttle across a silk warp", "maroon"),
    displayOrder: 2,
  },
  {
    id: "col-festive-edit",
    name: "The Festive Edit",
    slug: "the-festive-edit",
    description: "Deep grounds, restrained gold, built for lamplight.",
    story:
      "Festive does not have to mean heavy. This edit keeps the colour deep and the zari sparing, so the saree reads rich from across a room without weighing on the shoulder by the end of the night.",
    image: cover("col-festive-edit-img", "Festive sarees in maroon and saffron beside an oil lamp", "saffron"),
    displayOrder: 3,
  },
  {
    id: "col-everyday",
    name: "Everyday Drape",
    slug: "everyday-drape",
    description: "Cotton, linen and light chanderi for the working week.",
    story:
      "The sarees we wear ourselves. Soft enough to sit in all day, cheap enough to not think about, and good enough that people ask where they are from.",
    image: cover("col-everyday-img", "Cotton and linen sarees hanging on a rail", "indigo"),
    displayOrder: 4,
  },
  {
    id: "col-bridal",
    name: "Bridal Heirloom",
    slug: "bridal-heirloom",
    description: "A small, considered set of muhurtham silks.",
    story:
      "We hold no more than eight bridal pieces at a time. Each one is documented: weaver, loom, zari assay, weight in grams. Come to Alwarpet and see them in daylight before you decide, or ask us to send the fabric card.",
    image: cover("col-bridal-img", "A bridal silk saree in arakku maroon with a wide gold border", "saffron"),
    displayOrder: 5,
  },
];

/* -------------------------------------------------------------------------
   Homepage banners
   ------------------------------------------------------------------------- */

export const banners: Banner[] = [
  {
    id: "banner-drape",
    eyebrow: "Autumn / Winter",
    headline: "The art of the drape",
    body: "Handwoven sarees that carry six centuries of Indian craft into a wardrobe you actually wear.",
    ctaLabel: "Explore the collection",
    ctaHref: "/shop",
    secondaryLabel: "Discover our story",
    secondaryHref: "/about",
    image: cover("banner-drape-img", "A woman in a handwoven silk saree in a courtyard doorway", "maroon", "primary"),
    isActive: true,
    displayOrder: 1,
  },
];

/* -------------------------------------------------------------------------
   Products
   ------------------------------------------------------------------------- */

interface Seed {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  fabric: string;
  color: string;
  tone: Tone;
  weave: string;
  craftTags: string[];
  occasions: Product["occasions"];
  category: string;
  collection: string | null;
  stock: number;
  featured?: boolean;
  isNew?: boolean;
  length?: number;
  width?: number;
  blousePiece: string;
  care: readonly string[];
  short: string;
  description: string;
  story: string;
  /** Days before "now" that the piece was listed, so ordering is stable. */
  age: number;
}

const seeds: Seed[] = [
  {
    name: "Anika Handwoven Silk Saree",
    slug: "anika-handwoven-silk-saree",
    price: 18500,
    fabric: "Pure Kanchipuram Silk",
    color: "Deep madder",
    tone: "maroon",
    weave: "Korvai, three-shuttle",
    craftTags: ["Handwoven", "Korvai border", "Tested zari"],
    occasions: ["festive", "ceremony"],
    category: "cat-kanchipuram",
    collection: "col-silk-stories",
    stock: 4,
    featured: true,
    blousePiece: "0.8m contrast blouse piece attached, in the border colour",
    care: CARE.silk,
    short: "A madder-red Kanchipuram with a mustard korvai border and a plain, unfussy pallu.",
    description:
      "The body is a flat madder red with no motif at all, which is rarer than it sounds and much harder to weave well. The interest sits entirely in the border, where a mustard korvai is locked in by hand and edged with a single line of zari.\n\nAt around 620 grams it is a light Kanchipuram. It will hold a pleat through a long evening without asking anything of your shoulder.",
    story:
      "Woven by Rathinam and his son Suresh on Salai Street, Kanchipuram, on a pit loom their family has used for three generations. The korvai join took eleven days.",
    age: 34,
  },
  {
    name: "Meera Peacock Silk Saree",
    slug: "meera-peacock-silk-saree",
    price: 24800,
    fabric: "Pure Kanchipuram Silk",
    color: "Peacock green",
    tone: "teal",
    weave: "Korvai with rettai pettu border",
    craftTags: ["Handwoven", "Double-warp border", "Tested zari"],
    occasions: ["festive", "wedding"],
    category: "cat-kanchipuram",
    collection: "col-new-season",
    stock: 3,
    featured: true,
    isNew: true,
    blousePiece: "0.8m contrast blouse piece attached, in ochre",
    care: CARE.silk,
    short: "Peacock green with an ochre double-warp border and a pallu of small mango butis.",
    description:
      "Peacock is the colour Kanchipuram does better than anywhere else, and this is a good one: green in daylight, closer to blue under a lamp. The rettai pettu border is woven with a doubled warp so it stands slightly proud of the body.\n\nThe pallu carries small mango butis rather than a full brocade panel. It keeps the weight down and stops the saree from tipping into bridal territory.",
    story:
      "From the Vasanthi cooperative loom shed outside Kanchipuram, where eleven women weave under one roof. The zari is from Surat and assayed at 57 per cent silver.",
    age: 9,
  },
  {
    name: "Ila Ivory Banarasi Saree",
    slug: "ila-ivory-banarasi-saree",
    price: 32000,
    fabric: "Katan Silk",
    color: "Bone ivory",
    tone: "ivory",
    weave: "Kadhwa brocade",
    craftTags: ["Handwoven", "Kadhwa", "Real zari"],
    occasions: ["wedding", "ceremony"],
    category: "cat-banarasi",
    collection: "col-silk-stories",
    stock: 2,
    featured: true,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.silk,
    short: "Ivory katan silk with kadhwa jaal in antique gold, woven motif by motif.",
    description:
      "Kadhwa means each motif is woven as its own small tapestry rather than carried across the back of the fabric. Turn the saree over: there are no floats, no cut threads, and the reverse is nearly as clean as the front.\n\nThe gold is antique-toned rather than bright, which is what keeps an ivory saree from looking like a costume.",
    story:
      "Nine months on a jala loom in Lohta, on the edge of Varanasi. Irshad Ansari and his brother worked it between them, and the naqsha for the jaal is one his grandfather punched.",
    age: 61,
  },
  {
    name: "Nithya Organza Saree",
    slug: "nithya-organza-saree",
    price: 9800,
    fabric: "Silk Organza",
    color: "Blush",
    tone: "rose",
    weave: "Plain woven, hand-embroidered border",
    craftTags: ["Hand embroidery", "Scalloped edge"],
    occasions: ["ceremony", "festive"],
    category: "cat-organza",
    collection: "col-new-season",
    stock: 6,
    isNew: true,
    blousePiece: "0.8m raw silk blouse piece in the same blush",
    care: CARE.organza,
    short: "Sheer blush organza with a hand-embroidered scalloped edge in the same colour.",
    description:
      "Tone-on-tone embroidery, so the border reads as texture rather than pattern. The scallop is cut and finished by hand, which is why no two edges are quite identical.\n\nOrganza needs a proper petticoat and a firm pin. Give it both and it holds a shape nothing else can.",
    story:
      "Embroidered at a small unit in Chennai run by Fatima, who takes twenty pieces a month and no more.",
    age: 5,
  },
  {
    name: "Vaidehi Indigo Banarasi Saree",
    slug: "vaidehi-indigo-banarasi-saree",
    price: 28400,
    fabric: "Katan Silk",
    color: "Deep indigo",
    tone: "indigo",
    weave: "Jangla brocade",
    craftTags: ["Handwoven", "Jangla", "Real zari"],
    occasions: ["festive", "wedding"],
    category: "cat-banarasi",
    collection: "col-new-season",
    stock: 3,
    isNew: true,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.silk,
    short: "Indigo katan with a creeping jangla vine in gold across the whole body.",
    description:
      "Jangla covers the entire field with a single continuous vine, so there is no empty ground to break the pattern. On a dark indigo it reads almost like a night garden.\n\nHeavier than our other Banarasis at 780 grams. Worth knowing before a long evening.",
    story:
      "Woven in Ramnagar over seven months. The indigo is a chemical dye, not natural, and we would rather say so than let you assume otherwise.",
    age: 12,
  },
  {
    name: "Suhasini Chanderi Saree",
    slug: "suhasini-chanderi-saree",
    price: 7200,
    fabric: "Chanderi Silk-Cotton",
    color: "Wheat",
    tone: "sand",
    weave: "Plain with gold butis",
    craftTags: ["Handwoven", "Nakshi buti"],
    occasions: ["work", "everyday", "ceremony"],
    category: "cat-chanderi",
    collection: "col-everyday",
    stock: 8,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.chanderi,
    short: "Wheat chanderi scattered with small gold butis and a narrow zari edge.",
    description:
      "The buti here is nakshi, woven with an extra weft rather than printed, so it has a slight raised feel under the thumb.\n\nThis is the saree we recommend to anyone buying their first handloom. It is forgiving to drape, light enough for an office day, and smart enough for a lunch afterwards.",
    story:
      "From Chanderi town, Madhya Pradesh, through a cooperative we have bought from since 2018.",
    age: 78,
  },
  {
    name: "Kanaka Muhurtham Silk Saree",
    slug: "kanaka-muhurtham-silk-saree",
    price: 42000,
    fabric: "Pure Kanchipuram Silk",
    color: "Turmeric gold",
    tone: "saffron",
    weave: "Korvai with brocade pallu",
    craftTags: ["Handwoven", "Korvai border", "Tested zari", "Brocade pallu"],
    occasions: ["wedding", "ceremony"],
    category: "cat-kanchipuram",
    collection: "col-silk-stories",
    stock: 2,
    blousePiece: "0.9m contrast blouse piece in arakku maroon",
    care: CARE.silk,
    short: "Turmeric gold with an arakku maroon korvai border and a full brocade pallu.",
    description:
      "The classic muhurtham pairing, turmeric against arakku, done without excess. The border is four and a half inches, not nine, and the pallu carries a rudraksham and mayil chain rather than a solid gold panel.\n\n940 grams. It is a heavy saree and it is meant to be.",
    story:
      "Rathinam's loom again, this time with his elder son Murugan on the border. Twenty-six days from warp to cut.",
    age: 47,
  },
  {
    name: "Revathi Linen Saree",
    slug: "revathi-linen-saree",
    price: 5400,
    fabric: "Handwoven Linen",
    color: "Slate",
    tone: "charcoal",
    weave: "Plain weave, 100 count",
    craftTags: ["Handwoven", "100 count linen"],
    occasions: ["work", "everyday"],
    category: "cat-linen",
    collection: "col-everyday",
    stock: 9,
    blousePiece: "0.8m matching linen blouse piece",
    care: CARE.linen,
    short: "Slate grey linen in 100 count with a thin silver line at the border.",
    description:
      "100 count linen is fine enough to drape properly but still has the dry hand that makes linen worth wearing in heat.\n\nIt will crease. It creases in the first hour and then stops mattering.",
    story: "Woven in Bhoodan Pochampally, Telangana, on fly-shuttle looms.",
    age: 55,
  },
  {
    name: "Padma Handloom Cotton Saree",
    slug: "padma-handloom-cotton-saree",
    price: 3900,
    fabric: "Handloom Cotton",
    color: "Indigo and white",
    tone: "indigo",
    weave: "Plain weave with woven stripe",
    craftTags: ["Handwoven", "Natural indigo"],
    occasions: ["everyday", "work"],
    category: "cat-cotton",
    collection: "col-everyday",
    stock: 12,
    blousePiece: "0.8m matching cotton blouse piece",
    care: CARE.cotton,
    short: "Natural indigo cotton with a fine white stripe running the length of the body.",
    description:
      "Dyed with real indigo, which means the colour will move a little in the first few washes and settle into something softer than it started.\n\nThe stripe is woven, not printed. It runs vertically down the body and turns horizontal across the pallu, which is a small thing that took the weaver an extra day to set up.",
    story: "From a family of indigo dyers in Srikalahasti, Andhra Pradesh.",
    age: 92,
  },
  {
    name: "Tara Olive Organza Saree",
    slug: "tara-olive-organza-saree",
    price: 11200,
    fabric: "Silk Organza",
    color: "Olive",
    tone: "olive",
    weave: "Plain woven with foil-printed buti",
    craftTags: ["Hand foiling", "Sheer"],
    occasions: ["ceremony", "festive"],
    category: "cat-organza",
    collection: "col-new-season",
    stock: 5,
    isNew: true,
    blousePiece: "0.8m raw silk blouse piece in deep olive",
    care: CARE.organza,
    short: "Olive organza with hand-applied gold foil butis and a plain selvedge.",
    description:
      "Olive is an unexpected colour for organza and it is the reason we bought it. Warmer than sage, dustier than emerald, and it sits well against most Indian skin.\n\nThe foil butis are applied by hand and will lose a few over years of wear. That is normal for foil work and not a fault.",
    story: "Foiled at the same Chennai unit as the Nithya, in batches of ten.",
    age: 7,
  },
  {
    name: "Amrita Bridal Silk Saree",
    slug: "amrita-bridal-silk-saree",
    price: 56000,
    compareAtPrice: 62000,
    fabric: "Pure Kanchipuram Silk",
    color: "Arakku maroon",
    tone: "maroon",
    weave: "Korvai with nine-inch border",
    craftTags: ["Handwoven", "Korvai border", "Tested zari", "Nine-inch border"],
    occasions: ["wedding"],
    category: "cat-kanchipuram",
    collection: "col-bridal",
    stock: 1,
    featured: true,
    blousePiece: "0.9m contrast blouse piece in turmeric gold",
    care: CARE.silk,
    short: "Arakku maroon with a nine-inch turmeric korvai border and a temple-motif pallu.",
    description:
      "Arakku is the old lac red, browner and deeper than a modern crimson, and it is the colour most Tamil brides still ask for. The border runs nine inches with a temple thread line at both edges.\n\nThe pallu is a full brocade panel of yaali and temple motifs. 1,140 grams, and the last one at this weight we expect to see this year.",
    story:
      "Fourteen weeks on Murugan's loom. The zari assayed at 61 per cent silver and the certificate ships with the saree.",
    age: 21,
  },
  {
    name: "Charu Block Print Saree",
    slug: "charu-block-print-saree",
    price: 4600,
    fabric: "Mul Cotton",
    color: "Terracotta",
    tone: "terracotta",
    weave: "Hand block print on mul",
    craftTags: ["Hand block print", "Natural dye"],
    occasions: ["everyday", "work"],
    category: "cat-printed",
    collection: "col-everyday",
    stock: 10,
    blousePiece: "0.8m matching printed blouse piece",
    care: CARE.cotton,
    short: "Terracotta block print on soft mul cotton, with the block edges left visible.",
    description:
      "Printed in madder on mul so fine you can see your hand through it. The repeat is deliberately slightly off where the block lifts, and we have not asked the printers to correct it.\n\nMul is the lightest cotton there is. In a Chennai summer this is the only thing worth wearing.",
    story: "Block printed in Bagru, Rajasthan, using madder root and iron.",
    age: 68,
  },
  {
    name: "Indrani Festive Banarasi Saree",
    slug: "indrani-festive-banarasi-saree",
    price: 36500,
    fabric: "Katan Silk",
    color: "Wine",
    tone: "maroon",
    weave: "Cutwork brocade",
    craftTags: ["Handwoven", "Cutwork", "Real zari"],
    occasions: ["festive", "wedding"],
    category: "cat-banarasi",
    collection: "col-festive-edit",
    stock: 2,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.silk,
    short: "Wine katan with cutwork butis and a broad tissue pallu.",
    description:
      "Cutwork leaves the float threads on the reverse to be trimmed away by hand once the saree is off the loom. It is the faster cousin of kadhwa and the reason this piece costs what it does rather than half as much again.\n\nThe pallu shifts into tissue for the last thirty inches, so it catches light differently to the body.",
    story: "Lohta, Varanasi. Five months, and the pallu alone took six weeks.",
    age: 41,
  },
  {
    name: "Leela Chanderi Saree",
    slug: "leela-chanderi-saree",
    price: 8900,
    fabric: "Chanderi Silk-Cotton",
    color: "Chalk white",
    tone: "ivory",
    weave: "Plain with gold checks",
    craftTags: ["Handwoven", "Zari check"],
    occasions: ["ceremony", "work"],
    category: "cat-chanderi",
    collection: "col-new-season",
    stock: 0,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.chanderi,
    short: "Chalk white chanderi with a fine gold check and a plain pallu.",
    description:
      "A gold check on white is the hardest thing to get right in chanderi. Too heavy and it turns into a tablecloth. This one is a single zari thread every two inches.\n\nBest worn with something unexpected on top. A dark blouse, or none of the usual gold.",
    story: "Chanderi town, from the same cooperative as the Suhasini.",
    age: 30,
  },
  {
    name: "Manasi Linen Saree",
    slug: "manasi-linen-saree",
    price: 6200,
    fabric: "Handwoven Linen",
    color: "Moss",
    tone: "olive",
    weave: "Plain weave with temple border",
    craftTags: ["Handwoven", "Temple border"],
    occasions: ["work", "everyday"],
    category: "cat-linen",
    collection: "col-everyday",
    stock: 7,
    isNew: true,
    blousePiece: "0.8m matching linen blouse piece",
    care: CARE.linen,
    short: "Moss green linen with a small woven temple border in undyed thread.",
    description:
      "A temple border on linen is unusual. It is normally a silk device, and it works here because the triangles are small enough to read as a texture rather than a statement.\n\nThe undyed border thread will lighten slightly with washing while the body holds its green.",
    story: "Bhoodan Pochampally, Telangana.",
    age: 6,
  },
  {
    name: "Nalini Cotton Saree",
    slug: "nalini-cotton-saree",
    price: 4200,
    fabric: "Handloom Cotton",
    color: "Dusty rose",
    tone: "rose",
    weave: "Plain weave, jamdani buti",
    craftTags: ["Handwoven", "Jamdani buti"],
    occasions: ["everyday", "work"],
    category: "cat-cotton",
    collection: "col-everyday",
    stock: 11,
    blousePiece: "0.8m matching cotton blouse piece",
    care: CARE.cotton,
    short: "Dusty rose cotton with small white jamdani butis worked into the body.",
    description:
      "Jamdani butis are inserted by hand, one at a time, on a loom that stops for each one. On a cotton saree at this price that is remarkable value and it is the reason we keep buying from this cluster.\n\nThe rose is muted rather than pink. It sits closer to old brick than to blossom.",
    story: "Woven in Kotpad, Odisha, over eight days.",
    age: 84,
  },
  {
    name: "Oorja Saffron Organza Saree",
    slug: "oorja-saffron-organza-saree",
    price: 10400,
    fabric: "Silk Organza",
    color: "Saffron",
    tone: "saffron",
    weave: "Plain woven with zari border",
    craftTags: ["Sheer", "Zari border"],
    occasions: ["festive", "ceremony"],
    category: "cat-organza",
    collection: "col-festive-edit",
    stock: 4,
    blousePiece: "0.8m raw silk blouse piece in saffron",
    care: CARE.organza,
    short: "Saffron organza with a narrow flat zari border and nothing else.",
    description:
      "One colour, one border, no motif. Organza is transparent enough that any pattern reads twice, so the plainest version is usually the best one.\n\nUnder lamplight the saffron goes almost amber.",
    story: "Woven in Bengaluru and finished in Chennai.",
    age: 38,
  },
  {
    name: "Prisha Printed Saree",
    slug: "prisha-printed-saree",
    price: 5100,
    fabric: "Mul Cotton",
    color: "Ink blue",
    tone: "indigo",
    weave: "Hand block print on mul",
    craftTags: ["Hand block print", "Dabu resist"],
    occasions: ["everyday", "work"],
    category: "cat-printed",
    collection: "col-everyday",
    stock: 1,
    isNew: true,
    blousePiece: "0.8m matching printed blouse piece",
    care: CARE.cotton,
    short: "Dabu resist print in ink blue, with the mud-resist crackle left in.",
    description:
      "Dabu is a mud resist. The clay is applied through a block, the cloth is dyed, and where the clay sat the fabric stays pale. The fine crackle through the pattern is where the mud broke as it dried.\n\nEvery piece cracks differently. This one has more of it than most, which is why we took it.",
    story: "Printed in Akola, Rajasthan, by the Chhipa community.",
    age: 11,
  },
  {
    name: "Rukmini Kanchipuram Saree",
    slug: "rukmini-kanchipuram-saree",
    price: 31000,
    fabric: "Pure Kanchipuram Silk",
    color: "Teal and gold",
    tone: "teal",
    weave: "Korvai with checked body",
    craftTags: ["Handwoven", "Korvai border", "Tested zari", "Zari check"],
    occasions: ["festive", "wedding", "ceremony"],
    category: "cat-kanchipuram",
    collection: "col-silk-stories",
    stock: 3,
    blousePiece: "0.8m contrast blouse piece in gold",
    care: CARE.silk,
    short: "Teal silk in a fine gold check with a plain contrast border.",
    description:
      "A zari check across the whole body, half an inch square, with the border left completely plain to balance it. The effect is far quieter than a checked saree sounds.\n\n720 grams and it drapes softly for a Kanchipuram of this weight.",
    story: "Vasanthi cooperative, Kanchipuram. Nineteen days.",
    age: 52,
  },
  {
    name: "Shakuntala Tissue Banarasi Saree",
    slug: "shakuntala-tissue-banarasi-saree",
    price: 44000,
    fabric: "Silk Tissue",
    color: "Champagne",
    tone: "ivory",
    weave: "Tissue with kadhwa buti",
    craftTags: ["Handwoven", "Tissue", "Kadhwa", "Real zari"],
    occasions: ["wedding", "ceremony"],
    category: "cat-banarasi",
    collection: "col-bridal",
    stock: 2,
    blousePiece: "0.8m matching tissue blouse piece",
    care: CARE.silk,
    short: "Champagne tissue shot through with gold, with widely spaced kadhwa butis.",
    description:
      "Tissue is silk woven with a zari weft, so the whole cloth carries a metallic ground rather than a metallic pattern. It changes colour completely depending on where you stand.\n\nWe have spaced the butis wide on purpose. On tissue, more would be too much.",
    story: "Lohta, Varanasi. Irshad's loom, seven months.",
    age: 26,
  },
  {
    name: "Devika Everyday Cotton Saree",
    slug: "devika-everyday-cotton-saree",
    price: 3500,
    fabric: "Handloom Cotton",
    color: "Sage",
    tone: "olive",
    weave: "Plain weave with contrast border",
    craftTags: ["Handwoven"],
    occasions: ["everyday", "work"],
    category: "cat-cotton",
    collection: "col-everyday",
    stock: 14,
    isNew: true,
    blousePiece: "0.8m contrast cotton blouse piece in rust",
    care: CARE.cotton,
    short: "Sage cotton with a rust border, which is the most useful colour pair we know.",
    description:
      "Sage and rust is a combination that goes with almost every blouse already in a wardrobe, which is the whole argument for this saree.\n\nSoft from the first wear rather than the tenth, because the yarn is loosely spun.",
    story: "Srikalahasti, Andhra Pradesh.",
    age: 4,
  },
  {
    name: "Sharada Chanderi Saree",
    slug: "sharada-chanderi-saree",
    price: 9400,
    fabric: "Chanderi Silk-Cotton",
    color: "Charcoal",
    tone: "charcoal",
    weave: "Plain with silver butis",
    craftTags: ["Handwoven", "Silver zari"],
    occasions: ["work", "ceremony", "festive"],
    category: "cat-chanderi",
    collection: "col-new-season",
    stock: 6,
    isNew: true,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.chanderi,
    short: "Charcoal chanderi with silver rather than gold butis and a plain silver edge.",
    description:
      "Silver zari on charcoal is a cooler register than chanderi usually works in, and it takes the saree out of the daytime and into an evening.\n\nThe transparency is still there. Chanderi at this count always needs a well-fitted petticoat.",
    story: "Chanderi town, Madhya Pradesh.",
    age: 8,
  },
  {
    name: "Yashodha Mustard Silk Saree",
    slug: "yashodha-mustard-silk-saree",
    price: 26700,
    fabric: "Pure Kanchipuram Silk",
    color: "Mustard",
    tone: "saffron",
    weave: "Korvai with thread border",
    craftTags: ["Handwoven", "Korvai border", "Thread border"],
    occasions: ["festive", "ceremony"],
    category: "cat-kanchipuram",
    collection: "col-new-season",
    stock: 4,
    isNew: true,
    blousePiece: "0.8m contrast blouse piece in bottle green",
    care: CARE.silk,
    short: "Mustard silk with a bottle green thread border and no zari at all.",
    description:
      "A thread border instead of a zari one, which halves the weight and changes the whole character of the saree. It reads as a daytime Kanchipuram, if such a thing exists.\n\n540 grams, the lightest silk we stock.",
    story:
      "Part of the narrower brief we took to Kanchipuram in March: fewer colours, thinner borders, nothing above nine hundred grams.",
    age: 10,
  },
  {
    name: "Uma Linen Saree",
    slug: "uma-linen-saree",
    price: 5800,
    fabric: "Handwoven Linen",
    color: "Brick",
    tone: "terracotta",
    weave: "Plain weave, 120 count",
    craftTags: ["Handwoven", "120 count linen"],
    occasions: ["work", "everyday"],
    category: "cat-linen",
    collection: "col-everyday",
    stock: 8,
    blousePiece: "0.8m matching linen blouse piece",
    care: CARE.linen,
    short: "Brick red linen in a fine 120 count, with a self-coloured border.",
    description:
      "120 count is as fine as handwoven linen gets before it stops behaving like linen. It drapes almost like a soft silk and still breathes.\n\nThe border is the same colour as the body, marked only by a change in the weave.",
    story: "Bhoodan Pochampally, Telangana.",
    age: 44,
  },
  {
    name: "Bhavani Festive Silk Saree",
    slug: "bhavani-festive-silk-saree",
    price: 13900,
    compareAtPrice: 15500,
    fabric: "Semi-Silk",
    color: "Deep plum",
    tone: "maroon",
    weave: "Jacquard with zari border",
    craftTags: ["Zari border", "Jacquard"],
    occasions: ["festive"],
    category: "cat-festive",
    collection: "col-festive-edit",
    stock: 7,
    featured: true,
    blousePiece: "0.8m matching blouse piece, unstitched",
    care: CARE.silk,
    short: "Plum semi-silk with a gold jacquard border, made to be worn often.",
    description:
      "Semi-silk gets a bad name and it should not. It is a silk warp with a cotton weft, which gives you the sheen and the drape at a third of the weight and a fraction of the price.\n\nThis is the saree for the third day of a wedding, when the good silk has already had its outing.",
    story: "Powerloom-woven in Salem, and we will not pretend otherwise. Good value, honestly made.",
    age: 19,
  },
  {
    name: "Malini Festive Saree",
    slug: "malini-festive-saree",
    price: 15600,
    fabric: "Semi-Silk",
    color: "Bottle green",
    tone: "olive",
    weave: "Jacquard with brocade pallu",
    craftTags: ["Zari border", "Brocade pallu"],
    occasions: ["festive", "ceremony"],
    category: "cat-festive",
    collection: "col-festive-edit",
    stock: 5,
    blousePiece: "0.8m contrast blouse piece in gold",
    care: CARE.silk,
    short: "Bottle green semi-silk with a gold brocade pallu and a narrow matching border.",
    description:
      "The pallu does all the work here. Two feet of gold brocade against a plain green body, so the saree is quiet from the front and considerable from behind.\n\nHolds a pleat well and packs small, which makes it the one we suggest for travel.",
    story: "Salem, Tamil Nadu.",
    age: 29,
  },
  {
    name: "Gauri Muhurtham Saree",
    slug: "gauri-muhurtham-saree",
    price: 68000,
    fabric: "Pure Kanchipuram Silk",
    color: "Kumkum red",
    tone: "maroon",
    weave: "Korvai with full brocade pallu",
    craftTags: ["Handwoven", "Korvai border", "Tested zari", "Brocade pallu", "Heirloom weight"],
    occasions: ["wedding"],
    category: "cat-wedding",
    collection: "col-bridal",
    stock: 1,
    featured: true,
    blousePiece: "0.9m contrast blouse piece in green, with woven border",
    care: CARE.silk,
    short: "Kumkum red with a green korvai border and a full annapakshi brocade pallu.",
    description:
      "Red and green is the oldest muhurtham pairing there is, and the annapakshi pallu is the oldest motif. There is nothing modern about this saree and there is not meant to be.\n\n1,280 grams. Woven to be worn once and then kept.",
    story:
      "Five months on Rathinam's own loom, the last full brocade pallu he plans to weave himself. Zari assayed at 63 per cent silver, certificate included.",
    age: 15,
  },
  {
    name: "Sanjana Bridal Saree",
    slug: "sanjana-bridal-saree",
    price: 51000,
    fabric: "Pure Kanchipuram Silk",
    color: "Rose gold",
    tone: "rose",
    weave: "Korvai with tissue pallu",
    craftTags: ["Handwoven", "Korvai border", "Tested zari", "Tissue pallu"],
    occasions: ["wedding", "ceremony"],
    category: "cat-wedding",
    collection: "col-bridal",
    stock: 2,
    blousePiece: "0.9m contrast blouse piece in deep rose",
    care: CARE.silk,
    short: "Rose gold silk with a deep rose korvai border and a tissue pallu.",
    description:
      "A bridal saree for someone who does not want red. Rose gold is difficult to weave evenly and easy to get wrong, and this one holds its tone from body to pallu.\n\nThe tissue pallu keeps the total weight at 890 grams, light for a wedding piece.",
    story: "Vasanthi cooperative, Kanchipuram. Eleven weeks.",
    age: 23,
  },
];

/* -------------------------------------------------------------------------
   Expansion
   ------------------------------------------------------------------------- */

/** Fixed epoch so `createdAt` ordering never shifts between renders. */
const EPOCH = Date.parse("2025-09-01T00:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(EPOCH - days * 86_400_000).toISOString();
}

export const products: Product[] = seeds.map((seed, index) => ({
  id: `prd-${String(index + 1).padStart(3, "0")}`,
  name: seed.name,
  slug: seed.slug,
  shortDescription: seed.short,
  description: seed.description,
  story: seed.story,
  price: seed.price,
  compareAtPrice: seed.compareAtPrice ?? null,
  fabric: seed.fabric,
  color: seed.color,
  tone: seed.tone,
  weave: seed.weave,
  craftTags: seed.craftTags,
  occasions: seed.occasions,
  lengthMetres: seed.length ?? 6.3,
  widthMetres: seed.width ?? 1.15,
  blousePiece: seed.blousePiece,
  care: [...seed.care],
  categoryId: seed.category,
  collectionId: seed.collection,
  stockQuantity: seed.stock,
  isFeatured: seed.featured ?? false,
  isNew: seed.isNew ?? false,
  isActive: true,
  images: gallery(seed.slug, seed.name, seed.fabric, seed.tone),
  createdAt: daysAgo(seed.age),
  updatedAt: daysAgo(Math.max(0, seed.age - 2)),
}));

/* -------------------------------------------------------------------------
   Search vocabulary, used by the search overlay before a query is typed
   ------------------------------------------------------------------------- */

export const popularSearches = [
  "Kanchipuram silk",
  "Wedding sarees",
  "Banarasi",
  "Under 10,000",
  "Linen",
  "Organza",
];
