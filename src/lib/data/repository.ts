import "server-only";

import type {
  Address,
  AttributeDefinition,
  Banner,
  Booking,
  BookingStatus,
  Category,
  CategoryKind,
  CategoryNode,
  Collection,
  CommissionRule,
  CommissionScope,
  Customer,
  Dispute,
  DisputeStatus,
  FacetCounts,
  FulfillmentType,
  ListingStatus,
  Order,
  OrderStatus,
  Paginated,
  PaymentMethod,
  PaymentStatus,
  Payout,
  PayoutStatus,
  Product,
  ProductQuery,
  ProductType,
  ProductWithRelations,
  Promotion,
  Refund,
  RefundStatus,
  Review,
  ReviewStatus,
  ReviewSubjectType,
  SearchResults,
  Service,
  ServiceAddon,
  ServiceQuery,
  ServiceWithRelations,
  ShippingAddress,
  Transaction,
  UserProfile,
  Vendor,
  VendorApplicationInput,
  VendorOrder,
  VendorOrderStatus,
  VendorQuery,
} from "@/lib/types";

/**
 * The one seam between the application and its data.
 *
 * Every page, route handler and server action talks to this interface and
 * nothing else, so moving from the seed catalogue to Supabase is a matter of
 * which object `getRepository()` hands back. No component changes.
 *
 * Business rules that are not storage (commission resolution, fulfilment
 * fees, filtering, faceting, analytics) live as pure functions in
 * `lib/marketplace` and `lib/data/filters.ts`, shared by both
 * implementations, so they cannot drift.
 */
export interface Repository {
  /* ---------------------------------------------------------------- Taxonomy */
  listCategories(filter?: { kind?: CategoryKind; includeInactive?: boolean }): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  getCategoryTree(kind?: CategoryKind): Promise<CategoryNode[]>;
  saveCategory(input: CategoryInput, id?: string): Promise<Category>;

  listProductTypes(): Promise<ProductType[]>;

  /** A category's attributes, including everything inherited from its ancestors. */
  getAttributeDefinitions(categoryId: string): Promise<AttributeDefinition[]>;
  /** Every definition, as declared (not inherited). For the admin. */
  listAttributeDefinitions(): Promise<AttributeDefinition[]>;
  saveAttributeDefinition(input: AttributeDefinitionInput, id?: string): Promise<AttributeDefinition>;
  deleteAttributeDefinition(id: string): Promise<void>;

  listCollections(filter?: { vendorId?: string | null; featuredOnly?: boolean }): Promise<Collection[]>;
  getCollectionBySlug(slug: string): Promise<Collection | null>;
  saveCollection(input: CollectionInput, id?: string): Promise<Collection>;

  listBanners(): Promise<Banner[]>;

  /* ---------------------------------------------------------------- Products */
  /** Storefront query: approved, active listings from approved vendors only. */
  queryProducts(query: ProductQuery): Promise<Paginated<ProductWithRelations>>;
  getFacets(query: ProductQuery): Promise<FacetCounts>;
  getProductBySlug(slug: string): Promise<ProductWithRelations | null>;
  getProductsByIds(ids: string[]): Promise<ProductWithRelations[]>;
  getRelatedProducts(slug: string, limit?: number): Promise<ProductWithRelations[]>;
  listAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: string }>>;

  /** Every product whatever its status, for the dashboards. */
  listProductsForDashboard(filter?: { vendorId?: string; status?: ListingStatus; search?: string }): Promise<ProductWithRelations[]>;
  getProductById(id: string): Promise<ProductWithRelations | null>;
  saveProduct(input: ProductInput, id?: string): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  setProductStatus(id: string, status: ListingStatus, note?: string | null): Promise<void>;

  /* ---------------------------------------------------------------- Services */
  queryServices(query: ServiceQuery): Promise<Paginated<ServiceWithRelations>>;
  getServiceBySlug(slug: string): Promise<ServiceWithRelations | null>;
  getServiceById(id: string): Promise<ServiceWithRelations | null>;
  listServicesForDashboard(filter?: { vendorId?: string; status?: ListingStatus; search?: string }): Promise<ServiceWithRelations[]>;
  saveService(input: ServiceInput, id?: string): Promise<Service>;
  deleteService(id: string): Promise<void>;
  setServiceStatus(id: string, status: ListingStatus, note?: string | null): Promise<void>;

  /* ---------------------------------------------------------------- Vendors */
  queryVendors(query?: VendorQuery): Promise<Vendor[]>;
  getVendorBySlug(slug: string): Promise<Vendor | null>;
  getVendorById(id: string): Promise<Vendor | null>;
  /** The vendor whose dashboard this email may open. */
  getVendorForEmail(email: string): Promise<Vendor | null>;
  updateVendor(id: string, patch: VendorPatch): Promise<Vendor | null>;
  createVendorApplication(input: VendorApplicationInput): Promise<Vendor>;

  /* ---------------------------------------------------------------- Search */
  search(term: string, options?: { city?: string; limit?: number }): Promise<SearchResults>;

  /* ---------------------------------------------------------------- Orders */
  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrdersForUser(userId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  listOrders(filter?: { status?: OrderStatus; vendorId?: string; since?: string }): Promise<Order[]>;
  /** Payment-side updates. Fulfilment status belongs to each vendor order. */
  updateOrder(id: string, patch: Partial<Pick<Order, "paymentStatus">> & { status?: OrderStatus }): Promise<Order | null>;
  listVendorOrders(filter?: { vendorId?: string; status?: VendorOrderStatus; since?: string }): Promise<VendorOrder[]>;
  getVendorOrder(id: string): Promise<{ order: Order; vendorOrder: VendorOrder } | null>;
  updateVendorOrder(
    id: string,
    patch: { status?: VendorOrderStatus; trackingNumber?: string | null; courier?: string | null; note?: string | null },
  ): Promise<VendorOrder | null>;
  /** Decrements variant stock for an order. Must be safe to call twice. */
  commitStock(orderId: string): Promise<void>;

  /* ---------------------------------------------------------------- Bookings */
  createBooking(input: CreateBookingInput): Promise<Booking>;
  getBookingByNumber(bookingNumber: string): Promise<Booking | null>;
  getBookingsForUser(userId: string): Promise<Booking[]>;
  listBookings(filter?: { vendorId?: string; serviceId?: string; status?: BookingStatus; from?: string; to?: string }): Promise<Booking[]>;
  updateBooking(id: string, patch: { status?: BookingStatus; cancellationReason?: string | null }): Promise<Booking | null>;

  /* ---------------------------------------------------------------- Customers */
  listCustomers(filter?: { vendorId?: string; search?: string }): Promise<Customer[]>;
  updateCustomer(id: string, patch: { status: Customer["status"] }): Promise<Customer | null>;

  /* ---------------------------------------------------------------- Reviews */
  listReviews(filter?: {
    subjectType?: ReviewSubjectType;
    subjectId?: string;
    vendorId?: string;
    /** Defaults to "published"; pass "all" for moderation. */
    status?: ReviewStatus | "all";
  }): Promise<Review[]>;
  createReview(input: CreateReviewInput): Promise<Review>;
  updateReview(id: string, patch: { status?: ReviewStatus; vendorReply?: string | null }): Promise<Review | null>;

  /* ---------------------------------------------------------------- Promotions */
  listPromotions(filter?: { vendorId?: string | null; activeOnly?: boolean }): Promise<Promotion[]>;
  getPromotionByCode(code: string): Promise<Promotion | null>;
  savePromotion(input: PromotionInput, id?: string): Promise<Promotion>;
  deletePromotion(id: string): Promise<void>;

  /* ---------------------------------------------------------------- Commission */
  listCommissionRules(): Promise<CommissionRule[]>;
  saveCommissionRule(input: CommissionRuleInput, id?: string): Promise<CommissionRule>;
  deleteCommissionRule(id: string): Promise<void>;
  /** Resolves the narrowest rule: product > vendor > category > global. */
  getCommissionRate(input: { categoryId?: string; vendorId?: string; productId?: string }): Promise<number>;

  /* ---------------------------------------------------------------- Money */
  listTransactions(filter?: { status?: Transaction["status"]; since?: string }): Promise<Transaction[]>;
  listPayouts(filter?: { vendorId?: string; status?: PayoutStatus }): Promise<Payout[]>;
  updatePayout(id: string, patch: { status: PayoutStatus }): Promise<Payout | null>;
  listRefunds(filter?: { vendorId?: string; status?: RefundStatus }): Promise<Refund[]>;
  updateRefund(id: string, patch: { status: RefundStatus }): Promise<Refund | null>;
  listDisputes(filter?: { vendorId?: string; status?: DisputeStatus }): Promise<Dispute[]>;
  updateDispute(id: string, patch: { status?: DisputeStatus; resolution?: string | null }): Promise<Dispute | null>;

  /* ---------------------------------------------------------------- Wishlist */
  listWishlistProductIds(userId: string): Promise<string[]>;
  addToWishlist(userId: string, productId: string): Promise<void>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

  /* ---------------------------------------------------------------- Addresses */
  listAddresses(userId: string): Promise<Address[]>;
  createAddress(userId: string, input: Omit<Address, "id" | "userId">): Promise<Address>;
  updateAddress(userId: string, id: string, input: Partial<Omit<Address, "id" | "userId">>): Promise<Address | null>;
  deleteAddress(userId: string, id: string): Promise<void>;

  /* ---------------------------------------------------------------- Profile */
  getProfile(firebaseUid: string): Promise<UserProfile | null>;
  upsertProfile(
    firebaseUid: string,
    input: { email: string; displayName?: string | null; phone?: string | null },
  ): Promise<UserProfile>;
}

/* -------------------------------------------------------------------------
   Inputs
   ------------------------------------------------------------------------- */

export type CategoryInput = Omit<Category, "id">;
export type AttributeDefinitionInput = Omit<AttributeDefinition, "id">;
export type CollectionInput = Omit<Collection, "id">;

/** Price, compare-at and stock are derived from the variants on save. */
export type ProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "price" | "compareAtPrice" | "stockQuantity" | "rating" | "ratingCount" | "salesCount"
>;

export type ServiceInput = Omit<Service, "id" | "createdAt" | "updatedAt" | "rating" | "ratingCount" | "bookingCount">;

export type VendorPatch = Partial<Omit<Vendor, "id" | "createdAt" | "updatedAt">>;

export type PromotionInput = Omit<Promotion, "id" | "createdAt" | "usageCount">;

export interface CommissionRuleInput {
  scope: CommissionScope;
  scopeId: string | null;
  rate: number;
  note: string | null;
}

export interface CreateReviewInput {
  subjectType: ReviewSubjectType;
  subjectId: string;
  userId: string | null;
  authorName: string;
  authorCity: string;
  rating: number;
  title?: string | null;
  body: string;
}

/**
 * An order as checkout hands it over: already priced and split by vendor.
 * Commission is resolved by the repository, never sent by the caller.
 */
export interface CreateOrderInput {
  userId: string | null;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  couponCode: string | null;
  notes: string | null;
  groups: Array<{
    vendorId: string;
    fulfillmentType: FulfillmentType;
    shippingAmount: number;
    discountAmount: number;
    lines: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      customization: string | null;
    }>;
  }>;
}

export interface CreateBookingInput {
  serviceId: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  scheduledAt: string;
  quantity: number;
  addons: ServiceAddon[];
  location: string;
  city: string;
  notes: string;
  /** Priced server-side by `lib/marketplace/booking.ts`. */
  unitPrice: number;
  subtotal: number;
  addonsTotal: number;
  total: number;
  depositAmount: number;
  status: BookingStatus;
}

export type { BookingStatus };

/* -------------------------------------------------------------------------
   Selection
   ------------------------------------------------------------------------- */

let cached: Repository | null = null;

/**
 * Returns the Supabase repository when the project is configured, and the
 * seed repository otherwise, so the marketplace runs with no environment at
 * all on a fresh clone.
 */
export async function getRepository(): Promise<Repository> {
  if (cached) return cached;

  // The Supabase adapter has not been ported to the marketplace interface
  // yet (see the note at the top of supabase-repository.ts), so the seed
  // repository serves every request for now, even when Supabase is set.
  if (!isUsingSeedData()) {
    console.warn("[haat] Supabase is configured but its repository is not yet ported; using seed data.");
  }
  const { MockRepository } = await import("./mock-repository");
  const repository: Repository = new MockRepository();
  cached = repository;
  return repository;
}

/** True when the app is running on seed data rather than a database. */
export function isUsingSeedData(): boolean {
  return !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
