/**
 * Product types, the category tree, attribute definitions and collections.
 *
 * The tree is vertical > category > subcategory. Attributes are declared at
 * the highest level they apply to and inherited downwards, so "Fabric" is
 * declared once on Sarees and every weave beneath it carries it.
 */

import type {
  AttributeDefinition,
  AttributeOption,
  Category,
  CategoryKind,
  Collection,
  ProductType,
  Tone,
} from "@/lib/types";

import { photo } from "./images";
import { SAREE_CATEGORY_COVERS } from "./saree-photos";

/* -------------------------------------------------------------------------
   Product types
   ------------------------------------------------------------------------- */

export const productTypes: ProductType[] = [
  {
    id: "pt-physical",
    key: "physical",
    name: "Physical goods",
    description: "Packed and shipped by courier. Stock is tracked per variant.",
    defaultFulfillment: ["shipping"],
    tracksInventory: true,
    requiresShipping: true,
    supportsVariants: true,
    supportsCustomization: false,
  },
  {
    id: "pt-perishable",
    key: "perishable",
    name: "Fresh & perishable",
    description: "Made in small batches and delivered locally or picked up the same day.",
    defaultFulfillment: ["local_delivery", "pickup"],
    tracksInventory: true,
    requiresShipping: false,
    supportsVariants: true,
    supportsCustomization: false,
  },
  {
    id: "pt-packaged-food",
    key: "packaged_food",
    name: "Packaged food",
    description: "Sealed, shelf-stable food that can ship nationwide or go out locally.",
    defaultFulfillment: ["shipping", "local_delivery"],
    tracksInventory: true,
    requiresShipping: true,
    supportsVariants: true,
    supportsCustomization: false,
  },
  {
    id: "pt-made-to-order",
    key: "made_to_order",
    name: "Made to order",
    description: "Produced after the order is placed, usually with the customer's own details.",
    defaultFulfillment: ["local_delivery", "pickup"],
    tracksInventory: false,
    requiresShipping: false,
    supportsVariants: true,
    supportsCustomization: true,
  },
  {
    id: "pt-digital",
    key: "digital",
    name: "Digital",
    description: "Delivered by email or download. Nothing ships.",
    defaultFulfillment: ["digital"],
    tracksInventory: false,
    requiresShipping: false,
    supportsVariants: true,
    supportsCustomization: true,
  },
];

/* -------------------------------------------------------------------------
   Categories
   ------------------------------------------------------------------------- */

interface CategorySeed {
  id: string;
  parent: string | null;
  kind?: CategoryKind;
  name: string;
  slug: string;
  icon: string;
  description: string;
  intro?: string;
  tone: Tone;
  /** Photo-library key for the cover. */
  cover: string;
  productType?: string;
}

const CATEGORY_SEEDS: CategorySeed[] = [
  /* --- Fashion --- */
  {
    id: "cat-fashion",
    parent: null,
    name: "Fashion",
    slug: "fashion",
    icon: "shirt",
    description: "Sarees, dresses, kurtis, footwear and bags from independent labels.",
    intro:
      "Handloom ateliers, small-batch labels and leather workshops, all in one place. Every piece here ships from the person who made or sourced it.",
    tone: "maroon",
    cover: "cover-fashion",
    productType: "pt-physical",
  },
  {
    id: "cat-sarees",
    parent: "cat-fashion",
    name: "Sarees",
    slug: "sarees",
    icon: "saree",
    description: "Handwoven silk, cotton, linen and organza, direct from the weave.",
    intro:
      "From a three-thousand-rupee handloom cotton to a wedding Kanchipuram. Filter by weave, colour or occasion.",
    tone: "maroon",
    cover: "cover-sarees",
    productType: "pt-physical",
  },
  {
    id: "cat-dresses",
    parent: "cat-fashion",
    name: "Dresses",
    slug: "dresses",
    icon: "dress",
    description: "Linen, cotton and printed dresses from small Indian labels.",
    tone: "sand",
    cover: "cover-dresses",
    productType: "pt-physical",
  },
  {
    id: "cat-kurtis",
    parent: "cat-fashion",
    name: "Kurtis & Kurtas",
    slug: "kurtis",
    icon: "kurta",
    description: "Everyday and occasion kurtis in block print, chikankari and silk blends.",
    tone: "indigo",
    cover: "cover-kurtis",
    productType: "pt-physical",
  },
  {
    id: "cat-footwear",
    parent: "cat-fashion",
    name: "Footwear",
    slug: "footwear",
    icon: "shoe",
    description: "Kolhapuris, juttis and everyday sneakers, made by hand where it counts.",
    tone: "terracotta",
    cover: "cover-footwear",
    productType: "pt-physical",
  },
  {
    id: "cat-handbags",
    parent: "cat-fashion",
    name: "Handbags",
    slug: "handbags",
    icon: "bag",
    description: "Leather totes, crossbodies and occasion potlis.",
    tone: "sand",
    cover: "cover-handbags",
    productType: "pt-physical",
  },
  {
    id: "cat-accessories",
    parent: "cat-fashion",
    name: "Accessories",
    slug: "accessories",
    icon: "watch",
    description: "Wallets, belts, stoles and the small things that finish an outfit.",
    tone: "charcoal",
    cover: "cover-accessories",
    productType: "pt-physical",
  },

  /* --- Jewellery --- */
  {
    id: "cat-jewellery",
    parent: null,
    name: "Jewellery",
    slug: "jewellery",
    icon: "gem",
    description: "Fine silver and gold-plated pieces, and statement imitation jewellery.",
    intro:
      "Temple gold, kundan, oxidised silver and everyday chains, from workshops in Madurai, Jaipur and Mumbai.",
    tone: "saffron",
    cover: "cover-jewellery",
    productType: "pt-physical",
  },
  {
    id: "cat-fine-jewellery",
    parent: "cat-jewellery",
    name: "Fine jewellery",
    slug: "fine-jewellery",
    icon: "gem",
    description: "925 silver, freshwater pearls and gold vermeil.",
    tone: "ivory",
    cover: "cover-fine-jewellery",
  },
  {
    id: "cat-imitation-jewellery",
    parent: "cat-jewellery",
    name: "Imitation jewellery",
    slug: "imitation-jewellery",
    icon: "sparkle",
    description: "Kundan, polki and temple styles at a price you can wear every week.",
    tone: "saffron",
    cover: "cover-imitation-jewellery",
  },

  /* --- Beauty --- */
  {
    id: "cat-beauty",
    parent: null,
    name: "Beauty & Wellness",
    slug: "beauty",
    icon: "droplet",
    description: "Small-batch skincare and haircare made with Ayurvedic botanicals.",
    tone: "rose",
    cover: "cover-beauty",
    productType: "pt-physical",
  },
  {
    id: "cat-skincare",
    parent: "cat-beauty",
    name: "Skincare",
    slug: "skincare",
    icon: "droplet",
    description: "Face oils, toners, masks and lip care.",
    tone: "rose",
    cover: "kumkumadi-face-oil",
  },
  {
    id: "cat-haircare",
    parent: "cat-beauty",
    name: "Haircare",
    slug: "haircare",
    icon: "leaf",
    description: "Cold-infused hair oils and herbal rinses.",
    tone: "olive",
    cover: "bhringraj-hair-oil",
  },

  /* --- Food & Grocery --- */
  {
    id: "cat-food",
    parent: null,
    name: "Food & Grocery",
    slug: "food-grocery",
    icon: "utensils",
    description: "Home kitchens, bakeries, restaurants and grocers near you.",
    intro:
      "Fresh food is delivered locally by the kitchen that made it, or ready for you to pick up. Packaged pantry staples ship across India.",
    tone: "saffron",
    cover: "cover-food",
    productType: "pt-perishable",
  },
  {
    id: "cat-bakery",
    parent: "cat-food",
    name: "Bakery",
    slug: "bakery",
    icon: "cake",
    description: "Cakes, sourdough, croissants and cookies, baked the morning they go out.",
    tone: "sand",
    cover: "cover-bakery",
    productType: "pt-perishable",
  },
  {
    id: "cat-homemade",
    parent: "cat-food",
    name: "Homemade food",
    slug: "homemade",
    icon: "home",
    description: "Pickles, podis and meals cooked in home kitchens.",
    tone: "terracotta",
    cover: "cover-homemade",
    productType: "pt-packaged-food",
  },
  {
    id: "cat-sweets-snacks",
    parent: "cat-food",
    name: "Sweets & snacks",
    slug: "sweets-snacks",
    icon: "cookie",
    description: "Mysore pak, murukku and festival boxes.",
    tone: "saffron",
    cover: "cover-sweets",
    productType: "pt-packaged-food",
  },
  {
    id: "cat-prepared-meals",
    parent: "cat-food",
    name: "Meals",
    slug: "prepared-meals",
    icon: "bowl",
    description: "Restaurant tiffin, biryani and meals boxes, delivered hot.",
    tone: "terracotta",
    cover: "cover-prepared-food",
    productType: "pt-perishable",
  },
  {
    id: "cat-groceries",
    parent: "cat-food",
    name: "Groceries",
    slug: "groceries",
    icon: "basket",
    description: "Cold-pressed oils, heirloom rice, millets and honey.",
    tone: "olive",
    cover: "cover-groceries",
    productType: "pt-packaged-food",
  },
  {
    id: "cat-beverages",
    parent: "cat-food",
    name: "Beverages",
    slug: "beverages",
    icon: "cup",
    description: "Estate coffee, orthodox tea and filter-coffee decoction.",
    tone: "charcoal",
    cover: "cover-beverages",
    productType: "pt-packaged-food",
  },

  /* --- Home --- */
  {
    id: "cat-home",
    parent: null,
    name: "Home & Living",
    slug: "home-living",
    icon: "lamp",
    description: "Furniture, decor and tableware from Indian workshops.",
    tone: "sand",
    cover: "cover-home",
    productType: "pt-physical",
  },
  {
    id: "cat-decor",
    parent: "cat-home",
    name: "Decor",
    slug: "decor",
    icon: "lamp",
    description: "Planters, lamps, rugs and baskets.",
    tone: "terracotta",
    cover: "cover-decor",
  },
  {
    id: "cat-furniture",
    parent: "cat-home",
    name: "Furniture",
    slug: "furniture",
    icon: "chair",
    description: "Solid sheesham, cane and teak, built to be handed down.",
    tone: "sand",
    cover: "cover-furniture",
  },
  {
    id: "cat-kitchen-dining",
    parent: "cat-home",
    name: "Kitchen & dining",
    slug: "kitchen-dining",
    icon: "bowl",
    description: "Serveware, pottery and table linen.",
    tone: "indigo",
    cover: "blue-pottery-bowls",
  },

  /* --- Electronics --- */
  {
    id: "cat-electronics",
    parent: null,
    name: "Electronics",
    slug: "electronics",
    icon: "headphones",
    description: "Audio, wearables, chargers and smart home, with seller warranty.",
    tone: "charcoal",
    cover: "cover-electronics",
    productType: "pt-physical",
  },
  {
    id: "cat-audio",
    parent: "cat-electronics",
    name: "Audio",
    slug: "audio",
    icon: "headphones",
    description: "Headphones, earbuds and speakers.",
    tone: "charcoal",
    cover: "cover-audio",
  },
  {
    id: "cat-wearables",
    parent: "cat-electronics",
    name: "Wearables",
    slug: "wearables",
    icon: "watch",
    description: "Smartwatches and fitness bands.",
    tone: "charcoal",
    cover: "amoled-smartwatch",
  },
  {
    id: "cat-tech-accessories",
    parent: "cat-electronics",
    name: "Mobile & laptop accessories",
    slug: "tech-accessories",
    icon: "plug",
    description: "Chargers, keyboards and cables.",
    tone: "indigo",
    cover: "mechanical-keyboard",
  },
  {
    id: "cat-smart-home",
    parent: "cat-electronics",
    name: "Smart home",
    slug: "smart-home",
    icon: "bulb",
    description: "Smart lighting and plugs.",
    tone: "saffron",
    cover: "smart-led-bulb-pack",
  },

  /* --- Gifts & crafts --- */
  {
    id: "cat-gifts",
    parent: null,
    name: "Gifts & Crafts",
    slug: "gifts-crafts",
    icon: "gift",
    description: "Flowers, hampers, handicrafts and personalised pieces.",
    tone: "rose",
    cover: "cover-gifts",
    productType: "pt-physical",
  },
  {
    id: "cat-flowers",
    parent: "cat-gifts",
    name: "Flowers",
    slug: "flowers",
    icon: "flower",
    description: "Bouquets and flower boxes, delivered same day.",
    tone: "rose",
    cover: "cover-flowers",
    productType: "pt-perishable",
  },
  {
    id: "cat-gift-hampers",
    parent: "cat-gifts",
    name: "Gift hampers",
    slug: "gift-hampers",
    icon: "gift",
    description: "Curated boxes for festivals, weddings and thank-yous.",
    tone: "saffron",
    cover: "festive-gift-hamper",
  },
  {
    id: "cat-handicrafts",
    parent: "cat-gifts",
    name: "Handicrafts",
    slug: "handicrafts",
    icon: "palette",
    description: "Brass, terracotta, blue pottery and dhurrie, made by hand.",
    tone: "terracotta",
    cover: "cover-handicrafts",
  },
  {
    id: "cat-personalised",
    parent: "cat-gifts",
    name: "Personalised & custom",
    slug: "personalised",
    icon: "pen",
    description: "Made to your name, your date, your words.",
    tone: "sand",
    cover: "personalised-name-plate",
    productType: "pt-made-to-order",
  },
  {
    id: "cat-digital",
    parent: "cat-gifts",
    name: "Digital",
    slug: "digital-goods",
    icon: "download",
    description: "E-invites, templates and downloads, delivered instantly.",
    tone: "ivory",
    cover: "digital-wedding-invite",
    productType: "pt-digital",
  },

  /* --- Pets --- */
  {
    id: "cat-pets",
    parent: null,
    name: "Pets",
    slug: "pets",
    icon: "paw",
    description: "Food, beds, toys and walking gear for dogs and cats.",
    tone: "olive",
    cover: "cover-pets",
    productType: "pt-physical",
  },
  {
    id: "cat-pet-food",
    parent: "cat-pets",
    name: "Pet food",
    slug: "pet-food",
    icon: "bowl",
    description: "Grain-free and fresh-cooked food.",
    tone: "sand",
    cover: "grain-free-dog-food",
  },
  {
    id: "cat-pet-accessories",
    parent: "cat-pets",
    name: "Beds & accessories",
    slug: "pet-accessories",
    icon: "paw",
    description: "Beds, harnesses and cat trees.",
    tone: "olive",
    cover: "orthopedic-dog-bed",
  },
  {
    id: "cat-pet-toys",
    parent: "cat-pets",
    name: "Toys",
    slug: "pet-toys",
    icon: "bone",
    description: "Rope toys, chews and puzzle feeders.",
    tone: "terracotta",
    cover: "rope-toy-set",
  },

  /* --- Services (a separate tree) --- */
  {
    id: "cat-svc-beauty",
    parent: null,
    kind: "service",
    name: "Beauty & salon",
    slug: "beauty-salon",
    icon: "brush",
    description: "Bridal makeup, draping, mehendi and salon care, at home or in studio.",
    tone: "rose",
    cover: "cover-beauty-salon",
  },
  {
    id: "cat-svc-photography",
    parent: null,
    kind: "service",
    name: "Photography",
    slug: "photography",
    icon: "camera",
    description: "Weddings, portraits and product shoots.",
    tone: "charcoal",
    cover: "cover-photography",
  },
  {
    id: "cat-svc-catering",
    parent: null,
    kind: "service",
    name: "Catering",
    slug: "catering",
    icon: "utensils",
    description: "Wedding feasts, birthday parties and office lunches.",
    tone: "saffron",
    cover: "cover-catering",
  },
  {
    id: "cat-svc-events",
    parent: null,
    kind: "service",
    name: "Events & decor",
    slug: "events",
    icon: "sparkle",
    description: "Stage decor, theme parties and ceremony styling.",
    tone: "saffron",
    cover: "cover-events",
  },
  {
    id: "cat-svc-cleaning",
    parent: null,
    kind: "service",
    name: "Cleaning",
    slug: "cleaning",
    icon: "spray",
    description: "Deep home cleaning, sofa and carpet shampoo.",
    tone: "teal",
    cover: "cover-home-services",
  },
  {
    id: "cat-svc-repairs",
    parent: null,
    kind: "service",
    name: "Repairs",
    slug: "repairs",
    icon: "wrench",
    description: "AC, washing machine and appliance repair.",
    tone: "indigo",
    cover: "ac-service-repair",
  },
  {
    id: "cat-svc-pet-care",
    parent: null,
    kind: "service",
    name: "Pet care",
    slug: "pet-care",
    icon: "paw",
    description: "Grooming and baths at your door.",
    tone: "olive",
    cover: "pet-grooming-at-home",
  },
  {
    id: "cat-svc-professional",
    parent: null,
    kind: "service",
    name: "Professional services",
    slug: "professional",
    icon: "briefcase",
    description: "GST, tax filing and bookkeeping for small businesses.",
    tone: "charcoal",
    cover: "cover-professional",
  },
];

/** The weaves under Sarees keep the slugs the original saree shop used. */
const SAREE_WEAVES: Array<{
  id: string;
  name: string;
  slug: string;
  description: string;
  intro: string;
  tone: Tone;
}> = [
  {
    id: "cat-kanchipuram",
    name: "Kanchipuram Silk",
    slug: "kanchipuram-silk",
    description: "Korvai borders, three-ply mulberry silk, woven in and around Kanchipuram.",
    intro:
      "The body and the border are woven separately and locked together by hand at the join. Hold a Kanchipuram up to the light and you can find that seam. It is the reason the border sits flat when the rest of the saree moves.",
    tone: "maroon",
  },
  {
    id: "cat-banarasi",
    name: "Banarasi",
    slug: "banarasi",
    description: "Brocade from the Varanasi looms, in katan silk and tissue.",
    intro:
      "Banaras weaves in metal. Kadhwa, cutwork, jangla, tissue: each is a different argument about how much gold a saree can carry before it stops being wearable.",
    tone: "ivory",
  },
  {
    id: "cat-organza",
    name: "Organza",
    slug: "organza",
    description: "Sheer, weightless, and sharper than it looks.",
    intro: "Organza holds its shape without any help. It photographs beautifully and it travels badly, so it ships rolled.",
    tone: "rose",
  },
  {
    id: "cat-linen",
    name: "Linen",
    slug: "linen",
    description: "Handwoven linen for the long working day.",
    intro: "Linen sarees crease within an hour of wearing them. They also breathe through a Chennai May, which nothing else can claim.",
    tone: "charcoal",
  },
  {
    id: "cat-cotton",
    name: "Cotton",
    slug: "cotton",
    description: "Everyday handloom cotton, mostly from Andhra and Bengal.",
    intro: "The kind of saree that gets worn twice a week and softens for years. Priced so that is possible.",
    tone: "indigo",
  },
  {
    id: "cat-chanderi",
    name: "Chanderi",
    slug: "chanderi",
    description: "Silk-cotton from Madhya Pradesh, with that particular glassy sheen.",
    intro: "Chanderi is not quite silk and not quite cotton, and it is the transparency that gives it away.",
    tone: "sand",
  },
  {
    id: "cat-printed",
    name: "Printed",
    slug: "printed",
    description: "Hand block and screen prints on soft grounds.",
    intro: "Block printing leaves a slightly uneven edge where the wooden block lifts. Look for that, not against it.",
    tone: "terracotta",
  },
  {
    id: "cat-festive",
    name: "Festive",
    slug: "festive",
    description: "Pieces built for a room full of people and low light.",
    intro: "Festive sarees have to work under tube light, under a lamp and in a phone camera flash. These do.",
    tone: "maroon",
  },
  {
    id: "cat-wedding",
    name: "Wedding",
    slug: "wedding",
    description: "The heavy pieces. Muhurtham silks and heirloom brocade.",
    intro: "A wedding saree is bought once and kept for forty years. Each one here is documented: weaver, loom, zari assay.",
    tone: "saffron",
  },
];

export const categories: Category[] = [
  ...CATEGORY_SEEDS.map((seed, index) => ({
    id: seed.id,
    parentId: seed.parent,
    kind: seed.kind ?? "product",
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    intro: seed.intro,
    icon: seed.icon,
    image:
      seed.cover === "cover-sarees"
        ? SAREE_CATEGORY_COVERS["cat-kanchipuram"]!
        : photo(seed.cover, seed.tone, `${seed.name} on Haat`),
    defaultProductTypeId: seed.productType ?? null,
    isActive: true,
    displayOrder: index + 1,
  })),
  ...SAREE_WEAVES.map((weave, index) => ({
    id: weave.id,
    parentId: "cat-sarees",
    kind: "product" as const,
    name: weave.name,
    slug: weave.slug,
    description: weave.description,
    intro: weave.intro,
    icon: "saree",
    image: SAREE_CATEGORY_COVERS[weave.id]!,
    defaultProductTypeId: "pt-physical",
    isActive: true,
    displayOrder: 100 + index,
  })),
];

/* -------------------------------------------------------------------------
   Attribute definitions
   ------------------------------------------------------------------------- */

type AttributeSeed = Omit<AttributeDefinition, "id" | "categoryId" | "displayOrder" | "options" | "unit" | "isRequired" | "isFilterable"> & {
  options?: string[] | AttributeOption[];
  unit?: string;
  required?: boolean;
  filterable?: boolean;
};

function opts(values: string[] | AttributeOption[] | undefined): AttributeOption[] | null {
  if (!values) return null;
  return values.map((value) =>
    typeof value === "string"
      ? { value: value.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: value }
      : value,
  );
}

const ATTRIBUTES_BY_CATEGORY: Record<string, AttributeSeed[]> = {
  "cat-sarees": [
    { key: "fabric", label: "Fabric", inputType: "text", required: true, filterable: true },
    { key: "weave", label: "Weave", inputType: "text" },
    { key: "pattern", label: "Pattern", inputType: "select", options: ["Solid", "Woven motif", "Printed", "Striped", "Checked"], filterable: true },
    { key: "length", label: "Length", inputType: "number", unit: "m" },
    { key: "width", label: "Width", inputType: "number", unit: "m" },
    { key: "blousePiece", label: "Blouse piece", inputType: "text" },
    { key: "care", label: "Care", inputType: "multiselect" },
  ],
  "cat-dresses": [
    { key: "fabric", label: "Fabric", inputType: "text", required: true, filterable: true },
    { key: "fit", label: "Fit", inputType: "select", options: ["Relaxed", "Regular", "Fitted"], filterable: true },
    { key: "length", label: "Length", inputType: "select", options: ["Mini", "Midi", "Maxi"], filterable: true },
    { key: "sleeve", label: "Sleeve", inputType: "text" },
    { key: "care", label: "Care", inputType: "multiselect" },
  ],
  "cat-kurtis": [
    { key: "fabric", label: "Fabric", inputType: "text", required: true, filterable: true },
    { key: "fit", label: "Fit", inputType: "select", options: ["Straight", "A-line", "Anarkali"], filterable: true },
    { key: "work", label: "Work", inputType: "select", options: ["Block print", "Chikankari", "Embroidered", "Plain"], filterable: true },
    { key: "sleeve", label: "Sleeve", inputType: "text" },
    { key: "care", label: "Care", inputType: "multiselect" },
  ],
  "cat-footwear": [
    { key: "material", label: "Upper", inputType: "text", required: true, filterable: true },
    { key: "sole", label: "Sole", inputType: "text" },
    { key: "style", label: "Style", inputType: "select", options: ["Sandals", "Juttis", "Sneakers", "Heels"], filterable: true },
    { key: "closure", label: "Closure", inputType: "text" },
  ],
  "cat-handbags": [
    { key: "material", label: "Material", inputType: "text", required: true, filterable: true },
    { key: "dimensions", label: "Dimensions", inputType: "text" },
    { key: "closure", label: "Closure", inputType: "text" },
    { key: "compartments", label: "Compartments", inputType: "number" },
  ],
  "cat-accessories": [
    { key: "material", label: "Material", inputType: "text", required: true, filterable: true },
    { key: "dimensions", label: "Dimensions", inputType: "text" },
  ],
  "cat-jewellery": [
    { key: "material", label: "Material", inputType: "text", required: true, filterable: true },
    { key: "jewelleryType", label: "Jewellery type", inputType: "select", options: ["Necklace", "Earrings", "Bangles", "Ring", "Set", "Chain"], required: true, filterable: true },
    { key: "stoneType", label: "Stone type", inputType: "text", filterable: true },
    { key: "finish", label: "Finish", inputType: "text" },
    { key: "weight", label: "Weight", inputType: "number", unit: "g" },
    { key: "care", label: "Care", inputType: "multiselect" },
  ],
  "cat-beauty": [
    { key: "concern", label: "Good for", inputType: "select", options: ["Dullness", "Dryness", "Hair fall", "Tan", "All skin types"], filterable: true },
    { key: "keyIngredients", label: "Key ingredients", inputType: "text" },
    { key: "volume", label: "Size", inputType: "text" },
    { key: "shelfLife", label: "Shelf life", inputType: "text" },
    { key: "crueltyFree", label: "Cruelty free", inputType: "boolean", filterable: true },
  ],
  "cat-food": [
    { key: "diet", label: "Diet", inputType: "select", options: ["Vegetarian", "Non vegetarian", "Vegan", "Contains egg"], required: true, filterable: true },
    { key: "ingredients", label: "Ingredients", inputType: "text" },
    { key: "shelfLife", label: "Shelf life", inputType: "text" },
    { key: "allergens", label: "Allergens", inputType: "text" },
  ],
  "cat-homemade": [
    { key: "cuisine", label: "Cuisine", inputType: "select", options: ["South Indian", "Chettinad", "North Indian", "Continental"], filterable: true },
    { key: "spiceLevel", label: "Spice level", inputType: "select", options: ["Mild", "Medium", "Hot"], filterable: true },
    { key: "servingSize", label: "Serving size", inputType: "text" },
  ],
  "cat-prepared-meals": [
    { key: "cuisine", label: "Cuisine", inputType: "select", options: ["South Indian", "Chettinad", "North Indian", "Continental"], filterable: true },
    { key: "spiceLevel", label: "Spice level", inputType: "select", options: ["Mild", "Medium", "Hot"], filterable: true },
    { key: "servingSize", label: "Serving size", inputType: "text" },
    { key: "preparationTime", label: "Preparation time", inputType: "number", unit: "min" },
  ],
  "cat-bakery": [
    { key: "eggless", label: "Eggless", inputType: "boolean", filterable: true },
    { key: "flavour", label: "Flavour", inputType: "text" },
    { key: "servingSize", label: "Serves", inputType: "text" },
  ],
  "cat-sweets-snacks": [
    { key: "region", label: "Style", inputType: "text" },
    { key: "sweetness", label: "Sweetness", inputType: "select", options: ["Light", "Classic", "Rich"] },
  ],
  "cat-groceries": [
    { key: "origin", label: "Origin", inputType: "text", filterable: true },
    { key: "organic", label: "Certified organic", inputType: "boolean", filterable: true },
  ],
  "cat-beverages": [
    { key: "origin", label: "Origin", inputType: "text", filterable: true },
    { key: "form", label: "Form", inputType: "select", options: ["Ground", "Whole bean", "Loose leaf", "Decoction"], filterable: true },
  ],
  "cat-home": [
    { key: "material", label: "Material", inputType: "text", required: true, filterable: true },
    { key: "dimensions", label: "Dimensions", inputType: "text" },
    { key: "origin", label: "Made in", inputType: "text", filterable: true },
    { key: "care", label: "Care", inputType: "multiselect" },
  ],
  "cat-furniture": [
    { key: "assembly", label: "Assembly required", inputType: "boolean" },
    { key: "weightCapacity", label: "Weight capacity", inputType: "number", unit: "kg" },
  ],
  "cat-electronics": [
    { key: "brand", label: "Brand", inputType: "text", required: true, filterable: true },
    { key: "model", label: "Model", inputType: "text", required: true },
    { key: "warranty", label: "Warranty", inputType: "number", unit: "months", required: true },
    { key: "connectivity", label: "Connectivity", inputType: "text", filterable: true },
    { key: "batteryLife", label: "Battery life", inputType: "text" },
    { key: "inTheBox", label: "In the box", inputType: "multiselect" },
  ],
  "cat-gifts": [
    { key: "occasionNote", label: "Good for", inputType: "text" },
    { key: "contents", label: "What's inside", inputType: "multiselect" },
  ],
  "cat-handicrafts": [
    { key: "craft", label: "Craft", inputType: "text", filterable: true },
    { key: "region", label: "Region", inputType: "text", filterable: true },
    { key: "material", label: "Material", inputType: "text" },
    { key: "dimensions", label: "Dimensions", inputType: "text" },
  ],
  "cat-digital": [
    { key: "format", label: "Format", inputType: "text" },
    { key: "delivery", label: "Delivery", inputType: "text" },
  ],
  "cat-pets": [
    { key: "petType", label: "For", inputType: "select", options: ["Dogs", "Cats", "Dogs & cats"], required: true, filterable: true },
    { key: "lifeStage", label: "Life stage", inputType: "select", options: ["Puppy / kitten", "Adult", "All ages"], filterable: true },
    { key: "material", label: "Material", inputType: "text" },
  ],
};

export const attributeDefinitions: AttributeDefinition[] = Object.entries(ATTRIBUTES_BY_CATEGORY).flatMap(
  ([categoryId, seeds]) =>
    seeds.map((seed, index) => ({
      id: `attr-${categoryId}-${seed.key}`,
      categoryId,
      key: seed.key,
      label: seed.label,
      inputType: seed.inputType,
      options: opts(seed.options),
      unit: seed.unit ?? null,
      isRequired: seed.required ?? false,
      isFilterable: seed.filterable ?? false,
      displayOrder: index + 1,
    })),
);

/* -------------------------------------------------------------------------
   Collections

   Marketplace edits (vendorId null) cut across sellers and can hold both
   products and services. Vendor collections live on that vendor's storefront.
   ------------------------------------------------------------------------- */

export const collections: Collection[] = [
  {
    id: "col-wedding-edit",
    vendorId: null,
    name: "The Wedding Edit",
    slug: "the-wedding-edit",
    description: "Silks, jewellery, flowers and the professionals who make the day run.",
    story:
      "A wedding is bought from twenty different people. This edit gathers the best of them in one place: muhurtham silks and temple jewellery, a bridal bouquet, the makeup artist, the photographer and the caterer, all from independent businesses with the reviews to prove it.",
    image: photo("cover-wedding", "maroon", "Bride in red silk and gold jewellery"),
    isFeatured: true,
    displayOrder: 1,
  },
  {
    id: "col-festive-gifting",
    vendorId: null,
    name: "Festive Gifting",
    slug: "festive-gifting",
    description: "Sweets, brass, hampers and small luxuries for the season.",
    story:
      "Things people are actually pleased to receive: a tin of ghee-rich Mysore pak, a pair of brass diyas, a hamper someone put together by hand. Most ship in two days.",
    image: photo("promo-sale", "saffron", "Wrapped festive gift boxes"),
    isFeatured: true,
    displayOrder: 2,
  },
  {
    id: "col-weekend-table",
    vendorId: null,
    name: "The Weekend Table",
    slug: "the-weekend-table",
    description: "Sourdough, filter coffee, tiffin and honey for a slow Sunday.",
    story:
      "Breakfast from four Chennai kitchens and a grocer: a loaf from Crumb & Co., decoction from Madras Tiffin House, honey from the Nilgiris. Delivered before ten.",
    image: photo("cover-bakery", "sand", "Breads and pastries on a bakery counter"),
    isFeatured: true,
    displayOrder: 3,
  },
  {
    id: "col-home-office",
    vendorId: null,
    name: "Desk & Home Office",
    slug: "desk-and-home-office",
    description: "A better keyboard, quieter headphones and a decent cup of coffee.",
    story: "Upgrades for the room you work in, chosen by people who work from home.",
    image: photo("cover-electronics", "charcoal", "A tidy desk with electronics"),
    isFeatured: false,
    displayOrder: 4,
  },
  {
    id: "col-made-in-chennai",
    vendorId: null,
    name: "Made in Chennai",
    slug: "made-in-chennai",
    description: "Weavers, bakers, cooks and studios from one city.",
    story:
      "Haat started in Chennai, and so did a third of its sellers. This is the city's shelf: Kanchipuram silk woven an hour away, tiffin from Mylapore, cakes from Besant Nagar.",
    image: photo("cover-local", "terracotta", "A neighbourhood shop front in Chennai"),
    isFeatured: false,
    displayOrder: 5,
  },
  /* Ananya Sarees' own collections, from its time as a standalone atelier. */
  {
    id: "col-new-season",
    vendorId: "vendor-ananya",
    name: "The New Season",
    slug: "the-new-season",
    description: "What came off the looms this quarter.",
    story:
      "Fewer colours, thinner borders, and nothing above nine hundred grams. What came back from Kanchipuram is quieter than last year and easier to wear twice in a week.",
    image: SAREE_CATEGORY_COVERS["col-new-season"]!,
    isFeatured: false,
    displayOrder: 10,
  },
  {
    id: "col-silk-stories",
    vendorId: "vendor-ananya",
    name: "Silk Stories",
    slug: "silk-stories",
    description: "From the looms of Kanchipuram and Banaras to your wardrobe.",
    story:
      "Six families weave for Ananya. Everything here is three-ply mulberry silk with tested zari, and every piece carries the weaver's name on its tag.",
    image: SAREE_CATEGORY_COVERS["col-silk-stories"]!,
    isFeatured: false,
    displayOrder: 11,
  },
  {
    id: "col-festive-edit",
    vendorId: "vendor-ananya",
    name: "The Festive Edit",
    slug: "the-festive-edit",
    description: "Deep grounds, restrained gold, built for lamplight.",
    story:
      "This edit keeps the colour deep and the zari sparing, so the saree reads rich from across a room without weighing on the shoulder by the end of the night.",
    image: SAREE_CATEGORY_COVERS["col-festive-edit"]!,
    isFeatured: false,
    displayOrder: 12,
  },
  {
    id: "col-everyday",
    vendorId: "vendor-ananya",
    name: "Everyday Drape",
    slug: "everyday-drape",
    description: "Cotton, linen and light chanderi for the working week.",
    story: "Soft enough to sit in all day, cheap enough to not think about, and good enough that people ask where they are from.",
    image: SAREE_CATEGORY_COVERS["col-everyday"]!,
    isFeatured: false,
    displayOrder: 13,
  },
  {
    id: "col-bridal",
    vendorId: "vendor-ananya",
    name: "Bridal Heirloom",
    slug: "bridal-heirloom",
    description: "A small, considered set of muhurtham silks.",
    story:
      "No more than eight bridal pieces at a time, each documented: weaver, loom, zari assay, weight in grams.",
    image: SAREE_CATEGORY_COVERS["col-bridal"]!,
    isFeatured: false,
    displayOrder: 14,
  },
];
