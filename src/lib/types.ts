/**
 * Domain types for the Karthika catalogue and storefront.
 *
 * These mirror the Supabase schema in `supabase/schema.sql` one-for-one, in
 * camelCase. The repository layer is the only place that translates between
 * the two, so nothing in the UI ever sees a snake_case database row.
 */

/* -------------------------------------------------------------------------
   Imagery
   ------------------------------------------------------------------------- */

/**
 * Which view of the garment an image shows. The product gallery orders and
 * labels itself from this, so a photographer can drop files in later and the
 * page composes itself correctly.
 */
export type ImageKind =
  | "primary" // the hero shot, draped on a model
  | "detail" // close crop of the weave or motif
  | "draped" // full-length drape, second angle
  | "fabric" // flat fabric texture
  | "border" // border or pallu
  | "lifestyle"; // environmental / editorial

/**
 * The fabric tone a placeholder renders in. Real photography ignores this,
 * but until the shoot lands it keeps every well on the page in the same
 * warm family rather than a wall of grey boxes.
 */
export type Tone =
  | "ivory"
  | "sand"
  | "terracotta"
  | "maroon"
  | "olive"
  | "indigo"
  | "saffron"
  | "rose"
  | "charcoal"
  | "teal";

export interface ProductImage {
  id: string;
  /** Null until real photography is uploaded; the woven placeholder stands in. */
  url: string | null;
  alt: string;
  kind: ImageKind;
  tone: Tone;
  displayOrder: number;
}

/* -------------------------------------------------------------------------
   Taxonomy
   ------------------------------------------------------------------------- */

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** One line, shown under the category heading on the listing page. */
  description: string;
  /** Longer editorial paragraph for the top of the listing page. */
  intro?: string;
  image: ProductImage;
  displayOrder: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** The story block that opens the collection page. */
  story: string;
  image: ProductImage;
  displayOrder: number;
}

/* -------------------------------------------------------------------------
   Product
   ------------------------------------------------------------------------- */

export type Occasion = "everyday" | "festive" | "wedding" | "ceremony" | "work";

export interface Product {
  id: string;
  name: string;
  slug: string;

  /** One sentence. Used on cards, meta descriptions and the cart. */
  shortDescription: string;
  /** Two or three paragraphs for the product page. */
  description: string;
  /** The provenance note behind the "The Story" accordion. */
  story: string;

  /** Paise-free rupees. Always an integer; never a float. */
  price: number;
  /** The struck-through was-price, when there is one. */
  compareAtPrice: number | null;

  fabric: string;
  /** Human colour name, e.g. "Deep madder". */
  color: string;
  /** The tone family used for placeholder rendering and colour filtering. */
  tone: Tone;
  weave: string;
  /** Short badges: "Handwoven", "Zari", "Korvai". */
  craftTags: string[];
  occasions: Occasion[];

  /** Loom-side facts shown in the details accordion. */
  lengthMetres: number;
  widthMetres: number;
  blousePiece: string;
  care: string[];

  categoryId: string;
  collectionId: string | null;

  stockQuantity: number;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;

  images: ProductImage[];

  createdAt: string;
  updatedAt: string;
}

/** A product with its taxonomy resolved, which is what pages actually render. */
export interface ProductWithRelations extends Product {
  category: Pick<Category, "id" | "name" | "slug">;
  collection: Pick<Collection, "id" | "name" | "slug"> | null;
}

/* -------------------------------------------------------------------------
   Catalogue queries
   ------------------------------------------------------------------------- */

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export interface ProductQuery {
  categorySlugs?: string[];
  collectionSlugs?: string[];
  fabrics?: string[];
  tones?: Tone[];
  occasions?: Occasion[];
  minPrice?: number;
  maxPrice?: number;
  /** When true, drops anything with stockQuantity === 0. */
  inStockOnly?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  search?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/** The counts that drive the filter sidebar, derived from the full result set. */
export interface FacetCounts {
  categories: Array<{ slug: string; name: string; count: number }>;
  fabrics: Array<{ value: string; count: number }>;
  tones: Array<{ value: Tone; count: number }>;
  occasions: Array<{ value: Occasion; count: number }>;
  collections: Array<{ slug: string; name: string; count: number }>;
  priceRange: { min: number; max: number };
}

/* -------------------------------------------------------------------------
   Cart
   ------------------------------------------------------------------------- */

/** What the browser stores. Deliberately just an id and a quantity. */
export interface CartLineInput {
  productId: string;
  quantity: number;
}

/** What the server returns after re-reading prices from the database. */
export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  fabric: string;
  color: string;
  image: ProductImage;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Stock at the moment the cart was priced. */
  available: number;
  inStock: boolean;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  /** Amount still to spend to clear the free-shipping threshold, or 0. */
  freeShippingRemaining: number;
  total: number;
}

export interface PricedCart {
  lines: CartLine[];
  totals: CartTotals;
  /** Lines dropped because the product went inactive or out of stock. */
  removed: Array<{ productId: string; name: string; reason: string }>;
}

/* -------------------------------------------------------------------------
   Orders & account
   ------------------------------------------------------------------------- */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "razorpay" | "cod";

export interface Address {
  id: string;
  userId: string;
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

/** The address as frozen onto an order. Never a foreign key: addresses change. */
export type ShippingAddress = Omit<Address, "id" | "userId" | "isDefault" | "label">;

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  fabric: string;
  color: string;
  image: ProductImage;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  /** The customer-facing reference, e.g. KAR-24081. */
  orderNumber: string;
  userId: string | null;
  email: string;
  phone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  trackingNumber: string | null;
  courier: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistEntry {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  /** Firebase UID. The join key between Firebase Auth and Supabase. */
  firebaseUid: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  /** Opt-in for the letter. */
  marketingOptIn: boolean;
  createdAt: string;
}

/* -------------------------------------------------------------------------
   Homepage banners (admin-managed)
   ------------------------------------------------------------------------- */

export interface Banner {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string | null;
  secondaryHref: string | null;
  image: ProductImage;
  isActive: boolean;
  displayOrder: number;
}
