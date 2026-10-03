/**
 * Domain types for the marketplace.
 *
 * These mirror the Supabase schema in `supabase/schema.sql` one-for-one, in
 * camelCase. The repository layer is the only place that translates between
 * the two, so nothing in the UI ever sees a snake_case database row.
 *
 * The platform is generic on purpose: a `Product` does not know whether it is
 * a saree, a necklace, a cake or a pair of headphones, and a `Vendor` can sell
 * any mix of products and services. Category-specific facts (fabric, stone
 * type, spice level, warranty, ...) live in `Product.attributes`, shaped per
 * category by `AttributeDefinition`, and inherited down the category tree.
 *
 *   Marketplace
 *    ├── Vendor ──┬── Product ── ProductType, Category, Variants, Attributes
 *    │            └── Service ── Category, Availability, BookingRules, Add-ons
 *    ├── Order ── VendorOrder (one per vendor + fulfilment) ── OrderItem
 *    ├── Booking
 *    ├── Promotion, CommissionRule, Payout, Transaction, Refund, Dispute
 *    └── Review (product | service | vendor)
 */

/* -------------------------------------------------------------------------
   Imagery
   ------------------------------------------------------------------------- */

/**
 * Which view of the item an image shows. The product gallery orders and
 * labels itself from this. The textile-specific kinds (`draped`, `border`,
 * `fabric`) exist for the saree catalogue; every other category uses only
 * `primary`, `detail`, `lifestyle` and `gallery`.
 */
export type ImageKind =
  | "primary" // the hero shot
  | "draped" // full-length drape, second angle (textile)
  | "detail" // close crop of a finish, motif, texture or feature
  | "border" // border or pallu (textile)
  | "fabric" // flat fabric texture (textile)
  | "lifestyle" // environmental / in use
  | "gallery"; // any further shot

/**
 * The colour family a placeholder renders in, and the colour facet a shopper
 * can filter by. Real photography ignores this; it only paints the ground
 * behind an image that has not loaded or has no URL.
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
  /** Null renders the tonal placeholder. */
  url: string | null;
  alt: string;
  kind: ImageKind;
  tone: Tone;
  displayOrder: number;
}

/* -------------------------------------------------------------------------
   Location
   ------------------------------------------------------------------------- */

export interface City {
  slug: string;
  name: string;
  state: string;
}

/* -------------------------------------------------------------------------
   Listing lifecycle (shared by products and services)
   ------------------------------------------------------------------------- */

/**
 * Moderation state. Only `approved` listings reach the storefront, and only
 * while `isActive` (the vendor's own on/off switch) is also true and the
 * vendor itself is approved.
 */
export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "archived";

/* -------------------------------------------------------------------------
   Vendors
   ------------------------------------------------------------------------- */

export type VendorStatus = "pending" | "approved" | "suspended" | "rejected";

/** Subscription tier. Groundwork for plans; today it only changes the badge. */
export type VendorPlan = "starter" | "growth" | "pro";

export type PayoutSchedule = "weekly" | "biweekly" | "monthly";

export interface VendorPolicies {
  shipping: string;
  returns: string;
  cancellation: string;
}

export interface VendorSettings {
  /* Shipping */
  shippingFee: number;
  /** Orders from this vendor at or above this ship free. Null: never free. */
  freeShippingThreshold: number | null;
  processingDays: number;
  /* Local delivery & pickup */
  localDeliveryFee: number;
  deliveryRadiusKm: number | null;
  /** City slugs this vendor delivers to locally or serves in person. */
  deliveryZones: string[];
  pickupAddress: string | null;
  /* Tax */
  gstin: string | null;
  pricesIncludeTax: boolean;
  defaultTaxRate: number;
  /* Payouts */
  payout: {
    accountName: string;
    bankName: string;
    accountLast4: string;
    ifsc: string;
    schedule: PayoutSchedule;
  };
  /* Notifications */
  notifications: {
    newOrder: boolean;
    newBooking: boolean;
    lowStock: boolean;
    reviews: boolean;
    email: boolean;
    whatsapp: boolean;
  };
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** A longer "about" paragraph for the storefront. */
  story: string;
  ownerName: string;
  /** Emails allowed into this vendor's dashboard. */
  ownerEmails: string[];
  logoUrl: string | null;
  /** Monogram colour, used when there is no logo. */
  brandColor: string;
  cover: ProductImage;
  /** City slug, see `City`. */
  city: string;
  locality: string;
  state: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  instagram: string | null;
  /** The category a directory lists this vendor under first. */
  primaryCategoryId: string;
  status: VendorStatus;
  statusNote: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  plan: VendorPlan;
  /** Overrides the category/global commission for every listing this vendor owns. */
  commissionRate: number | null;
  rating: number;
  ratingCount: number;
  followerCount: number;
  /** Shown on the storefront, e.g. "Usually replies within an hour". */
  responseTime: string;
  policies: VendorPolicies;
  settings: VendorSettings;
  createdAt: string;
  updatedAt: string;
}

/** The slice of a vendor a card, a product page or a cart line needs. */
export interface VendorSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  cityName: string;
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  logoUrl: string | null;
  brandColor: string;
}

/* -------------------------------------------------------------------------
   Taxonomy
   ------------------------------------------------------------------------- */

/** Product categories and service categories share one table but never mix. */
export type CategoryKind = "product" | "service";

export interface Category {
  id: string;
  /** Self-reference for a vertical > category > subcategory tree. Null at the top. */
  parentId: string | null;
  kind: CategoryKind;
  name: string;
  slug: string;
  /** One line, shown under the category heading on the listing page. */
  description: string;
  /** Longer editorial paragraph for the top of the listing page. */
  intro?: string;
  /** Key into the category icon set, for the category explorer. */
  icon: string;
  image: ProductImage;
  /** The product type new listings in this category default to. */
  defaultProductTypeId: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** A category with its children resolved, for menus and the explorer. */
export interface CategoryNode extends Category {
  children: CategoryNode[];
  /** Live listings in this category and every descendant. */
  listingCount: number;
}

export interface Collection {
  id: string;
  /** Null for a marketplace-curated edit; set for a vendor's own collection. */
  vendorId: string | null;
  name: string;
  slug: string;
  description: string;
  /** The story block that opens the collection page. */
  story: string;
  image: ProductImage;
  isFeatured: boolean;
  displayOrder: number;
}

export interface CollectionRef {
  id: string;
  name: string;
  slug: string;
}

/* -------------------------------------------------------------------------
   Product types

   How a kind of goods behaves in fulfilment, independent of what it is: a
   saree and a pair of headphones are both "physical"; a cake and a tiffin box
   are both "perishable". Categories pick a default; a listing can override.
   ------------------------------------------------------------------------- */

export type FulfillmentType = "shipping" | "local_delivery" | "pickup" | "digital" | "service_booking";

export interface ProductType {
  id: string;
  key: string;
  name: string;
  description: string;
  defaultFulfillment: FulfillmentType[];
  tracksInventory: boolean;
  requiresShipping: boolean;
  supportsVariants: boolean;
  supportsCustomization: boolean;
}

/* -------------------------------------------------------------------------
   Dynamic attributes
   ------------------------------------------------------------------------- */

export type AttributeInputType = "text" | "number" | "boolean" | "select" | "multiselect";

/** One allowed value, for a `select` or `multiselect` attribute. */
export interface AttributeOption {
  value: string;
  label: string;
}

/**
 * Declares one field a category's products carry, e.g. "Fabric" for Sarees
 * or "Stone type" for Jewellery. Definitions are inherited: a product in
 * "Kanchipuram Silk" carries every attribute declared on "Sarees" and on
 * "Fashion" above it. The vendor's listing form, the product page's details
 * panel and the listing filters all render themselves from these.
 */
export interface AttributeDefinition {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  inputType: AttributeInputType;
  options: AttributeOption[] | null;
  /** e.g. "m", "g", "cm", shown after the value. */
  unit: string | null;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
}

/** The value shape a product's `attributes` bag can hold per key. */
export type AttributeValue = string | number | boolean | string[];

/* -------------------------------------------------------------------------
   Product
   ------------------------------------------------------------------------- */

export type Occasion = "everyday" | "festive" | "wedding" | "ceremony" | "work" | "gifting" | "party";

/** One axis a product varies on, e.g. Size: S, M, L. */
export interface ProductOption {
  name: string;
  values: string[];
}

/**
 * The thing that is actually bought. Every product has at least one: a
 * product without options carries a single variant titled "Default", so cart,
 * stock and order code never branch on "has variants or not".
 */
export interface ProductVariant {
  id: string;
  sku: string;
  /** "M / Indigo", or "Default". */
  title: string;
  options: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

/** A free-text field the customer fills in, e.g. the message on a cake. */
export interface ProductCustomization {
  label: string;
  placeholder: string;
  maxLength: number;
  required: boolean;
}

export interface Product {
  id: string;
  vendorId: string;
  productTypeId: string;
  categoryId: string;
  collectionIds: string[];

  name: string;
  slug: string;
  /** The one thing worth saying about this item at a glance, under the name. */
  subtitle: string;
  /** One sentence. Used on cards, meta descriptions and the cart. */
  shortDescription: string;
  /** Two or three paragraphs for the product page. */
  description: string;
  /** The maker's note behind the "About the maker" panel. May be empty. */
  story: string;
  highlights: string[];

  /** Lowest active variant price, in whole rupees. */
  price: number;
  compareAtPrice: number | null;

  /** Human colour name, when the category has one. */
  color: string;
  tone: Tone;
  tags: string[];
  occasions: Occasion[];

  /** Keyed by `AttributeDefinition.key` for this product's category and its ancestors. */
  attributes: Record<string, AttributeValue>;

  options: ProductOption[];
  variants: ProductVariant[];
  customization: ProductCustomization | null;

  fulfillmentTypes: FulfillmentType[];
  shipping: {
    weightGrams: number | null;
    processingDays: number;
  };
  /** GST rate in percent. Prices are tax-inclusive. */
  taxRate: number;

  /** Sum of active variant stock. */
  stockQuantity: number;
  trackInventory: boolean;
  lowStockThreshold: number;

  status: ListingStatus;
  moderationNote: string | null;
  isFeatured: boolean;
  isNew: boolean;
  /** The vendor's own visibility switch. */
  isActive: boolean;

  /** Overrides the vendor/category/global commission for this one listing. */
  commissionRate: number | null;

  rating: number;
  ratingCount: number;
  salesCount: number;

  images: ProductImage[];
  metadata: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

/** A product with its relations resolved, which is what pages actually render. */
export interface ProductWithRelations extends Product {
  vendor: VendorSummary;
  category: CategoryRef;
  /** Root first, ending with `category`. */
  categoryTrail: CategoryRef[];
  collections: CollectionRef[];
  productType: Pick<ProductType, "id" | "key" | "name">;
  /** True when the product can reach any city (by courier or email). */
  shipsNationwide: boolean;
  /** City slugs where local delivery or pickup is available. */
  localCities: string[];
}

/* -------------------------------------------------------------------------
   Services
   ------------------------------------------------------------------------- */

export type ServicePriceUnit = "flat" | "per_hour" | "per_person" | "per_unit";

/** Where the service happens. */
export type ServiceMode = "at_customer" | "at_vendor" | "online";

export interface ServiceAddon {
  id: string;
  name: string;
  price: number;
}

export interface ServiceAvailability {
  /** 0 = Sunday ... 6 = Saturday. */
  days: number[];
  /** "09:00", 24-hour, local time. */
  startTime: string;
  endTime: string;
  slotMinutes: number;
  /** ISO dates (yyyy-mm-dd) the vendor is closed. */
  blackoutDates: string[];
}

export interface BookingRules {
  advanceNoticeHours: number;
  maxAdvanceDays: number;
  /** When true a booking waits for the vendor; otherwise it confirms instantly. */
  requiresConfirmation: boolean;
  minQuantity: number;
  maxQuantity: number;
  /** "guests", "rooms", "units". Shown beside the quantity stepper. */
  quantityLabel: string;
  /** Percentage taken at booking; the rest is settled with the vendor. */
  depositPercent: number;
  maxBookingsPerSlot: number;
}

/**
 * A bookable offering. Kept entirely separate from `Product`: a service has
 * no stock, ships nowhere, and is bought by reserving a slot, not adding to a
 * bag. See `Booking`.
 */
export interface Service {
  id: string;
  vendorId: string;
  categoryId: string;
  collectionIds: string[];
  name: string;
  slug: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  /** What the price covers, as a checklist. */
  includes: string[];
  price: number;
  compareAtPrice: number | null;
  priceUnit: ServicePriceUnit;
  /** "per AC", "per product". Overrides the generic unit label. */
  unitLabel: string | null;
  durationMinutes: number | null;
  modes: ServiceMode[];
  /** City slug the vendor is based in. */
  city: string;
  /** City slugs this service is available in. */
  serviceArea: string[];
  availability: ServiceAvailability;
  bookingRules: BookingRules;
  addons: ServiceAddon[];
  cancellationPolicy: string;
  tags: string[];
  images: ProductImage[];
  status: ListingStatus;
  moderationNote: string | null;
  isActive: boolean;
  isFeatured: boolean;
  commissionRate: number | null;
  rating: number;
  ratingCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithRelations extends Service {
  vendor: VendorSummary;
  category: CategoryRef;
  categoryTrail: CategoryRef[];
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  /** Customer-facing reference, e.g. BK-10422. */
  bookingNumber: string;
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  vendorId: string;
  vendorName: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  scheduledAt: string;
  durationMinutes: number | null;
  quantity: number;
  addons: ServiceAddon[];
  /** Venue or address for at-customer services; the studio otherwise. */
  location: string;
  city: string;
  status: BookingStatus;
  notes: string;
  /** Frozen at booking time, like an order line's unit price. */
  unitPrice: number;
  subtotal: number;
  addonsTotal: number;
  total: number;
  depositAmount: number;
  paymentStatus: PaymentStatus;
  commissionRate: number;
  commissionAmount: number;
  image: ProductImage;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------
   Commission & fees
   ------------------------------------------------------------------------- */

export type CommissionScope = "global" | "category" | "vendor" | "product";

/**
 * One row of the override chain product > vendor > category (nearest
 * ancestor wins) > global. See `lib/marketplace/commission.ts`.
 */
export interface CommissionRule {
  id: string;
  scope: CommissionScope;
  /** The category/vendor/product id this rule narrows to. Null for "global". */
  scopeId: string | null;
  /** A percentage, e.g. 10 for 10%. */
  rate: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: VendorPlan;
  name: string;
  monthlyFee: number;
  /** Percentage points taken off the resolved commission rate. */
  commissionDiscount: number;
  features: string[];
}

/* -------------------------------------------------------------------------
   Reviews
   ------------------------------------------------------------------------- */

export type ReviewSubjectType = "product" | "service" | "vendor";

export type ReviewStatus = "published" | "pending" | "flagged" | "hidden";

export interface Review {
  id: string;
  subjectType: ReviewSubjectType;
  subjectId: string;
  /** Denormalised for moderation tables. */
  subjectName: string;
  vendorId: string;
  userId: string | null;
  authorName: string;
  authorCity: string;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  vendorReply: string | null;
  createdAt: string;
}

/* -------------------------------------------------------------------------
   Promotions
   ------------------------------------------------------------------------- */

export type PromotionType = "coupon" | "automatic" | "flash_sale";

export type DiscountType = "percent" | "fixed" | "free_shipping";

export interface Promotion {
  id: string;
  /** Null for a marketplace-wide promotion, funded by the platform. */
  vendorId: string | null;
  type: PromotionType;
  title: string;
  description: string;
  /** Required for coupons, null otherwise. Stored upper-case. */
  code: string | null;
  discountType: DiscountType;
  /** Percent or rupees, per `discountType`. Ignored for free shipping. */
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  /** Empty means "everything this promotion's owner sells". */
  categoryIds: string[];
  productIds: string[];
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  image: ProductImage | null;
  createdAt: string;
}

/* -------------------------------------------------------------------------
   Catalogue queries
   ------------------------------------------------------------------------- */

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "popular";

export interface ProductQuery {
  /** Matches the category or any of its descendants. */
  categorySlugs?: string[];
  collectionSlugs?: string[];
  vendorSlugs?: string[];
  /** Generic attribute filters, keyed by `AttributeDefinition.key`. */
  attributes?: Record<string, string[]>;
  tones?: Tone[];
  occasions?: Occasion[];
  fulfillment?: FulfillmentType[];
  /** City slug. Keeps products that ship nationwide or deliver to this city. */
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  /** When true, drops anything with stockQuantity === 0. */
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  ids?: string[];
  search?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface ServiceQuery {
  categorySlugs?: string[];
  vendorSlugs?: string[];
  collectionSlugs?: string[];
  city?: string;
  modes?: ServiceMode[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFeatured?: boolean;
  search?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface VendorQuery {
  categorySlugs?: string[];
  city?: string;
  /** "products", "services" or both. */
  offers?: "products" | "services";
  minRating?: number;
  verifiedOnly?: boolean;
  isFeatured?: boolean;
  search?: string;
  sort?: "featured" | "rating" | "newest" | "name";
  /** Includes non-approved vendors. Admin only. */
  includeAllStatuses?: boolean;
  statuses?: VendorStatus[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface AttributeFacet {
  key: string;
  label: string;
  values: FacetValue[];
}

/** The counts that drive the filter sidebar, derived from the full result set. */
export interface FacetCounts {
  categories: Array<{ slug: string; name: string; count: number }>;
  vendors: Array<{ slug: string; name: string; count: number }>;
  attributes: AttributeFacet[];
  tones: Array<{ value: Tone; count: number }>;
  occasions: Array<{ value: Occasion; count: number }>;
  fulfillment: Array<{ value: FulfillmentType; count: number }>;
  collections: Array<{ slug: string; name: string; count: number }>;
  priceRange: { min: number; max: number };
}

/** Marketplace-wide search: one query, every kind of thing. */
export interface SearchResults {
  query: string;
  products: ProductWithRelations[];
  services: ServiceWithRelations[];
  vendors: Vendor[];
  categories: Array<CategoryRef & { kind: CategoryKind; image: ProductImage }>;
  collections: Collection[];
  totals: { products: number; services: number; vendors: number };
}

/* -------------------------------------------------------------------------
   Cart
   ------------------------------------------------------------------------- */

/** What the browser stores and sends. Never a price. */
export interface CartLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
  customization?: string;
}

/** What the server returns after re-reading prices from the database. */
export interface CartLine {
  /** productId + variantId + customization; unique within a cart. */
  key: string;
  productId: string;
  variantId: string;
  variantTitle: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  slug: string;
  name: string;
  subtitle: string;
  color: string;
  image: ProductImage;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  /** Stock at the moment the cart was priced. */
  available: number;
  inStock: boolean;
  fulfillmentTypes: FulfillmentType[];
  customization: string | null;
}

/**
 * One vendor's share of the cart, which becomes one `VendorOrder`. Digital
 * goods form their own group, since they never wait on a courier.
 */
export interface CartVendorGroup {
  key: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorCity: string;
  lineKeys: string[];
  /** Fulfilment types every line in the group supports. */
  options: FulfillmentType[];
  fulfillmentType: FulfillmentType;
  subtotal: number;
  shipping: number;
  discount: number;
  /** Spend still needed for free shipping from this vendor, or 0. */
  freeShippingRemaining: number;
  /** e.g. "Ships in 2-3 days", "Ready for pickup in 4 hours". */
  estimate: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  /** Kept for single-vendor UI: spend to clear the smallest outstanding free-shipping threshold. */
  freeShippingRemaining: number;
  total: number;
}

export interface AppliedCoupon {
  code: string;
  title: string;
  vendorId: string | null;
  discount: number;
}

export interface PricedCart {
  lines: CartLine[];
  groups: CartVendorGroup[];
  totals: CartTotals;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  /** Lines dropped because the product went inactive or out of stock. */
  removed: Array<{ productId: string; name: string; reason: string }>;
}

/* -------------------------------------------------------------------------
   Orders & account
   ------------------------------------------------------------------------- */

/** The customer-facing state of the whole marketplace order. */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

/** One vendor's fulfilment state, managed independently from the dashboard. */
export type VendorOrderStatus =
  | "new"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

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
  vendorOrderId: string;
  productId: string;
  variantId: string;
  variantTitle: string;
  vendorId: string;
  name: string;
  slug: string;
  subtitle: string;
  color: string;
  image: ProductImage;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customization: string | null;
  commissionRate: number;
  commissionAmount: number;
}

export interface StatusEvent {
  status: VendorOrderStatus;
  at: string;
  note: string | null;
}

/** One vendor's part of a marketplace order. Each vendor fulfils its own. */
export interface VendorOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  /** e.g. HT-24081-2: the order number plus this vendor's position. */
  number: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  status: VendorOrderStatus;
  fulfillmentType: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  commissionAmount: number;
  /** What the vendor is paid: total less commission. */
  vendorEarnings: number;
  trackingNumber: string | null;
  courier: string | null;
  customerName: string;
  customerEmail: string;
  city: string;
  history: StatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  /** The customer-facing reference, e.g. HT-24081. */
  orderNumber: string;
  userId: string | null;
  customerName: string;
  email: string;
  phone: string;
  /** Derived from the vendor orders; see `aggregateOrderStatus`. */
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  couponCode: string | null;
  totalAmount: number;
  commissionAmount: number;
  shippingAddress: ShippingAddress;
  /** Every line across every vendor, for simple order summaries. */
  items: OrderItem[];
  vendorOrders: VendorOrder[];
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
  marketingOptIn: boolean;
  createdAt: string;
}

/** A buyer as the admin and vendor dashboards see one. */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "blocked";
  orderCount: number;
  bookingCount: number;
  totalSpent: number;
  lastActiveAt: string | null;
  createdAt: string;
}

/* -------------------------------------------------------------------------
   Money movement
   ------------------------------------------------------------------------- */

export type TransactionStatus = "succeeded" | "pending" | "failed" | "refunded";

export interface Transaction {
  id: string;
  /** Order or booking number. */
  reference: string;
  kind: "order" | "booking";
  customerName: string;
  method: PaymentMethod | "upi" | "card";
  amount: number;
  status: TransactionStatus;
  gatewayRef: string | null;
  failureReason: string | null;
  createdAt: string;
}

export type PayoutStatus = "scheduled" | "processing" | "paid" | "on_hold";

export interface Payout {
  id: string;
  vendorId: string;
  vendorName: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  commission: number;
  /** Refunds and adjustments netted off this payout. */
  adjustments: number;
  netAmount: number;
  status: PayoutStatus;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
}

export type RefundStatus = "requested" | "approved" | "processed" | "rejected";

export interface Refund {
  id: string;
  reference: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

export interface Dispute {
  id: string;
  reference: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  reason: string;
  amount: number;
  status: DisputeStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
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

/* -------------------------------------------------------------------------
   Vendor onboarding
   ------------------------------------------------------------------------- */

export interface VendorApplicationInput {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  primaryCategoryId: string;
  offers: "products" | "services" | "both";
  description: string;
  website: string | null;
}
