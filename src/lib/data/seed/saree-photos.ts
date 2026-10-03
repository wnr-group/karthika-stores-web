/**
 * Ananya Sarees' photography, carried over from the original saree catalogue:
 * licensed Pexels/Pixabay stock, hand-sorted per weave and keyed by the weave's
 * category id so sibling sarees do not all wear the same photograph.
 */

import type { ImageKind, ProductImage, Tone } from "@/lib/types";

interface StockImage {
  url: string;
  alt: string;
}

interface ImagePool {
  cover: StockImage;
  primary: StockImage[];
  closeup: StockImage[];
  lifestyle: StockImage[];
}

const PX = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

/**
 * Licensed stock photography, sourced from Pexels and Pixabay and hand-sorted
 * per fabric category, keyed the same as `categories[].id`. `gallery()` draws
 * from a category's pool by product index so sibling products in the same
 * category don't all wear the same photograph.
 */
const IMAGE_LIBRARY: Record<string, ImagePool> = {
  "cat-kanchipuram": {
    cover: { url: PX(1937336), alt: "Neatly folded stack of warm-toned silk textiles" },
    primary: [
      { url: PX(2723623), alt: "Woman in a rich silk saree, studio portrait" },
      { url: PX(20158866), alt: "Woman in a golden silk saree seated indoors" },
      { url: PX(8229217), alt: "Woman wearing a traditional draped silk saree" },
      { url: PX(7850255), alt: "Portrait of a woman in a maroon silk saree" },
    ],
    closeup: [
      { url: PX(7232413), alt: "Close-up of gold-toned silk with rich folds" },
      { url: PX(11438526), alt: "Close crop of a red silk saree border" },
      { url: PX(2395961), alt: "Close detail of a woven silk saree" },
    ],
    lifestyle: [
      { url: PX(7516956), alt: "Woman in a silk saree standing amid greenery" },
      { url: PX(17893411), alt: "Woman in a red saree seated by a forest creek" },
    ],
  },
  "cat-banarasi": {
    cover: { url: PX(14380626), alt: "Close-up of ivory silk fabric with soft folds" },
    primary: [
      { url: PX(32244572), alt: "Woman in an ivory Banarasi-style silk saree, studio portrait" },
      { url: PX(19586661), alt: "Woman in a golden-yellow brocade saree" },
      { url: PX(5858761), alt: "Back view of a woman in a red silk saree showing the pallu drape" },
      { url: PX(30371667), alt: "Elegant woman in a traditional silk saree" },
    ],
    closeup: [
      { url: PX(36726420), alt: "Close-up of ivory silk fabric texture" },
      { url: PX(14380623), alt: "Rippled ivory silk fabric, close crop" },
      { url: "https://cdn.pixabay.com/photo/2015/08/25/09/13/fabric-906405_1280.jpg", alt: "Close-up of golden woven brocade texture" },
    ],
    lifestyle: [
      { url: PX(31081832), alt: "Woman in a silk saree outdoors, editorial" },
      { url: PX(16916681), alt: "Young woman in traditional silk dress seated outdoors" },
    ],
  },
  "cat-wedding": {
    cover: { url: PX(6045295), alt: "Rich red fabric with ornate traditional motifs" },
    primary: [
      { url: PX(35820392), alt: "Bride in a deep red bridal silk saree with gold jewelry" },
      { url: PX(2119095), alt: "Woman wearing a red and gold bridal saree" },
      { url: PX(27212066), alt: "Indian bride in bridal silk, solo portrait" },
      { url: PX(730056), alt: "Bride in a red and white traditional silk saree" },
      { url: PX(19869152), alt: "Bride in bridal silk standing by a mirror" },
    ],
    closeup: [
      { url: PX(5376556), alt: "Close-up of a bride adorned in gold jewelry and red silk" },
      { url: PX(28496968), alt: "Intricate mehndi design on a bride's hands with bangles" },
      { url: PX(34260692), alt: "Hands adorned with henna and gold bangles" },
    ],
    lifestyle: [
      { url: PX(33195531), alt: "Traditional Indian wedding ceremony at a temple" },
      { url: PX(12762494), alt: "Women in red and gold bridal attire seated outdoors" },
    ],
  },
  "cat-organza": {
    cover: { url: PX(24781661), alt: "Woman seated outdoors in a translucent sheer saree, fabric catching the light" },
    primary: [
      { url: PX(20158863), alt: "Woman seated in a saffron sheer saree in a stone archway" },
      { url: PX(13679117), alt: "Woman in a blush sheer saree posing on a garden bridge" },
      { url: PX(11213166), alt: "Woman in a flowing saffron sheer saree seated on a beach at dusk" },
      { url: PX(12707152), alt: "Lightweight sheer saree fabric flying in the wind on a bridge" },
    ],
    closeup: [
      { url: PX(7956629), alt: "Close-up of blush sheer fabric with soft lustrous folds" },
      { url: PX(17325397), alt: "Close-up of smooth sheer silk fabric surface" },
      { url: PX(7988399), alt: "Close-up of smooth rippled sheer fabric texture" },
    ],
    lifestyle: [
      { url: PX(36194199), alt: "Woman in a sheer saree looking out a sunlit window" },
      { url: PX(35007881), alt: "Women in sheer sarees at a candlelit ceremony" },
    ],
  },
  "cat-chanderi": {
    cover: { url: PX(14765912), alt: "Woman in an ivory and gold saree with pearl necklace, golden bokeh background" },
    primary: [
      { url: PX(33157064), alt: "Portrait of a woman in a fine charcoal-print saree" },
      { url: PX(31450193), alt: "Thoughtful woman in a deep red saree beside rustic wooden shutters" },
      { url: PX(38537324), alt: "Portrait of a woman in a saree beside a carved wooden pillar" },
    ],
    closeup: [
      { url: PX(4938326), alt: "Close-up of pleated wheat-beige fabric with delicate texture" },
      { url: PX(37054344), alt: "Close-up of an ivory and gold woven saree border draped over the head" },
      { url: PX(8465944), alt: "Close-up of smooth cream textile with graceful draped folds" },
    ],
    lifestyle: [
      { url: PX(14245887), alt: "Woman in an ivory saree walking beside a river at sunset" },
      { url: PX(15298623), alt: "Woman in an ivory and gold saree on a sunlit street" },
    ],
  },
  "cat-printed": {
    cover: { url: PX(37619027), alt: "Close-up of traditional hand block printing process on fabric" },
    primary: [
      { url: PX(8750030), alt: "Woman wearing a vibrant brown and red block-print saree indoors" },
      { url: PX(27918896), alt: "Smiling woman in a colorful printed saree on a sunny street" },
      { url: PX(27918894), alt: "Young woman in a floral block-print saree smiling on a city street" },
      { url: PX(20812441), alt: "Young woman in a printed saree seated outdoors holding flowers" },
    ],
    closeup: [
      { url: PX(4566670), alt: "Close-up of colorful Indian block-printed textile with floral motifs" },
      { url: PX(5865305), alt: "Close-up of blue and white block-print floral textile pattern" },
      { url: PX(8751695), alt: "Close-up of vibrant red floral block-print pattern on fabric" },
    ],
    lifestyle: [{ url: PX(15321885), alt: "Woman in a printed saree posing on a city street" }],
  },
  "cat-festive": {
    cover: { url: PX(28943466), alt: "Close portrait of a woman in a copper-gold zari-bordered saree lit by warm evening lamplight" },
    primary: [
      { url: PX(27575174), alt: "Woman in a rich orange and gold silk saree seated on a swing under string lights" },
      { url: PX(17040929), alt: "Woman in a deep maroon silk saree with a gold zari pallu border at sunset" },
      { url: PX(34060709), alt: "Woman in a jewel-toned jacquard-border saree seated in a dance pose" },
      { url: PX(29105322), alt: "Woman in a jewel-toned festive saree with flowers in her hair and statement jewelry" },
      { url: PX(28943572), alt: "Woman in a festive silk saree with a jacquard border at a market" },
    ],
    closeup: [
      { url: PX(5439054), alt: "Close-up of maroon and green fabric with a gold paisley jacquard border" },
      { url: PX(8710793), alt: "Close-up of fuchsia saree fabric with a gold sequin embroidered border" },
    ],
    lifestyle: [
      { url: PX(28943520), alt: "Woman in a coral silk saree with a heavy gold zari border in a market" },
      { url: PX(17113983), alt: "Woman in a festive sequinned saree holding a flower outdoors" },
    ],
  },
  "cat-cotton": {
    cover: { url: PX(10992768), alt: "Close-up of beige woven cotton textile stacked in folds" },
    primary: [
      { url: PX(13454130), alt: "Woman in a traditional handloom cotton saree, outdoor portrait" },
      { url: PX(37708266), alt: "Indian woman displaying a draped cotton saree outdoors" },
      { url: PX(29172765), alt: "Woman wearing an elegant cotton saree with a woven pattern" },
      { url: PX(14664844), alt: "Indian woman modeling a traditional handloom cotton saree outdoors" },
    ],
    closeup: [
      { url: PX(7533973), alt: "Close-up of natural cotton fabric weave texture" },
      { url: PX(7640925), alt: "Macro shot of woven cotton textile with a striped pattern" },
    ],
    lifestyle: [
      { url: PX(38156563), alt: "Woman in a cotton saree relaxing on a park bench" },
      { url: PX(10482813), alt: "Woman sitting and smiling in a cotton saree outdoors" },
    ],
  },
  "cat-linen": {
    cover: { url: PX(10919577), alt: "Abstract close-up visualization of natural linen fabric texture" },
    primary: [
      { url: PX(27918889), alt: "Woman in a linen saree sitting outdoors on a bench, smiling" },
      { url: PX(36981632), alt: "Woman in a pale linen saree seated against a rustic wall in soft daylight" },
      { url: PX(36747133), alt: "Woman in a linen saree standing beneath a tree in sunlit outdoor setting" },
      { url: PX(26078981), alt: "Portrait of a woman in a linen saree standing gracefully at a beach at sunset" },
    ],
    closeup: [
      { url: PX(7794365), alt: "Macro close-up of neutral-toned linen fabric weave" },
      { url: PX(7794364), alt: "Close-up texture of rough natural linen fabric" },
      { url: PX(8774406), alt: "Close-up of woven linen fabric surface and texture" },
    ],
    lifestyle: [
      { url: PX(34368216), alt: "Woman in a linen saree standing gracefully in a field, editorial shot" },
      { url: PX(35007888), alt: "Woman in traditional linen attire seated outdoors, editorial setting" },
    ],
  },
};

function pick(pool: StockImage[], index: number): StockImage {
  return pool[((index % pool.length) + pool.length) % pool.length]!;
}


const GALLERY_ORDER: ImageKind[] = ["primary", "draped", "detail", "border", "fabric", "lifestyle"];

const ALT_BY_KIND: Record<ImageKind, (name: string, fabric: string) => string> = {
  primary: (name) => `${name} draped on a model, front view`,
  draped: (name) => `${name} shown in full drape from the side`,
  detail: (name, fabric) => `Close crop of the ${fabric.toLowerCase()} weave on the ${name}`,
  border: (name) => `The border and pallu of the ${name}`,
  fabric: (name, fabric) => `Flat ${fabric.toLowerCase()} texture from the ${name}`,
  lifestyle: (name) => `${name} worn indoors in daylight`,
  gallery: (name) => `${name}, further view`,
};

export function sareeGallery(
  slug: string,
  name: string,
  fabric: string,
  tone: Tone,
  categoryId: string,
  seedIndex: number,
): ProductImage[] {
  const lib = IMAGE_LIBRARY[categoryId];
  const urlByKind: Partial<Record<ImageKind, string | null>> = lib
    ? {
        primary: pick(lib.primary, seedIndex).url,
        draped: pick(lib.primary, seedIndex + 1).url,
        detail: pick(lib.closeup, seedIndex).url,
        border: pick(lib.closeup, seedIndex + 1).url,
        fabric: pick(lib.closeup, seedIndex + 2).url,
        lifestyle: pick(lib.lifestyle, seedIndex).url,
      }
    : {};

  return GALLERY_ORDER.map((kind, index) => ({
    id: `${slug}-${kind}`,
    url: urlByKind[kind] ?? null,
    alt: ALT_BY_KIND[kind](name, fabric),
    kind,
    tone,
    displayOrder: index,
  }));
}

function cover(id: string, alt: string, tone: Tone, url: string | null): ProductImage {
  return { id, url, alt, kind: "lifestyle", tone, displayOrder: 0 };
}

const COVER_TONES: Record<string, Tone> = {
  "cat-kanchipuram": "maroon",
  "cat-banarasi": "ivory",
  "cat-wedding": "saffron",
  "cat-organza": "rose",
  "cat-chanderi": "sand",
  "cat-printed": "terracotta",
  "cat-festive": "maroon",
  "cat-cotton": "indigo",
  "cat-linen": "charcoal",
};

/** Weave covers by category id, and Ananya's collection covers by collection id. */
export const SAREE_CATEGORY_COVERS: Record<string, ProductImage> = {
  ...Object.fromEntries(
    Object.entries(IMAGE_LIBRARY).map(([categoryId, pool]) => [
      categoryId,
      cover(`${categoryId}-img`, pool.cover.alt, COVER_TONES[categoryId] ?? "sand", pool.cover.url),
    ]),
  ),
  "col-new-season": cover("col-new-season-img", "New season sarees folded and stacked in daylight", "olive", PX(10317106)),
  "col-silk-stories": cover("col-silk-stories-img", "A weaver's hands passing a shuttle across a silk warp", "maroon", PX(33925037)),
  "col-festive-edit": cover("col-festive-edit-img", "Festive sarees in maroon and saffron beside an oil lamp", "saffron", PX(10211234)),
  "col-everyday": cover("col-everyday-img", "Cotton and linen sarees hanging on a rail", "indigo", PX(33433875)),
  "col-bridal": cover("col-bridal-img", "A bridal silk saree in arakku maroon with a wide gold border", "saffron", PX(39070874)),
  hero: cover("banner-drape-img", "A woman in a handwoven silk saree in a courtyard doorway", "maroon", PX(8140820)),
};
