import "server-only";

import type {
  Address,
  Banner,
  Category,
  Collection,
  FacetCounts,
  Order,
  OrderStatus,
  Paginated,
  PaymentStatus,
  ProductQuery,
  ProductWithRelations,
  ShippingAddress,
  UserProfile,
} from "@/lib/types";

/**
 * The one seam between the storefront and its data.
 *
 * Every page and route handler talks to this interface and nothing else, so
 * moving from the seed catalogue to Supabase is a matter of which object
 * `getRepository()` hands back. No component changes.
 */
export interface Repository {
  /* Catalogue */
  listCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  listCollections(): Promise<Collection[]>;
  getCollectionBySlug(slug: string): Promise<Collection | null>;
  listBanners(): Promise<Banner[]>;

  queryProducts(query: ProductQuery): Promise<Paginated<ProductWithRelations>>;
  getFacets(query: ProductQuery): Promise<FacetCounts>;
  getProductBySlug(slug: string): Promise<ProductWithRelations | null>;
  getProductsByIds(ids: string[]): Promise<ProductWithRelations[]>;
  getRelatedProducts(slug: string, limit?: number): Promise<ProductWithRelations[]>;
  /** Slugs for the sitemap. */
  listAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: string }>>;

  /* Orders */
  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrdersForUser(userId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  updateOrder(
    id: string,
    patch: Partial<
      Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "courier">
    >,
  ): Promise<Order | null>;
  listOrders(filter?: { status?: OrderStatus }): Promise<Order[]>;
  /** Decrements stock for a paid order. Must be safe to call twice. */
  commitStock(orderId: string): Promise<void>;

  /* Wishlist */
  listWishlistProductIds(userId: string): Promise<string[]>;
  addToWishlist(userId: string, productId: string): Promise<void>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

  /* Addresses */
  listAddresses(userId: string): Promise<Address[]>;
  createAddress(userId: string, input: Omit<Address, "id" | "userId">): Promise<Address>;
  updateAddress(
    userId: string,
    id: string,
    input: Partial<Omit<Address, "id" | "userId">>,
  ): Promise<Address | null>;
  deleteAddress(userId: string, id: string): Promise<void>;

  /* Profile */
  getProfile(firebaseUid: string): Promise<UserProfile | null>;
  upsertProfile(
    firebaseUid: string,
    input: { email: string; displayName?: string | null; phone?: string | null },
  ): Promise<UserProfile>;
}

export interface CreateOrderInput {
  userId: string | null;
  email: string;
  phone: string;
  shippingAddress: ShippingAddress;
  paymentMethod: Order["paymentMethod"];
  paymentStatus: PaymentStatus;
  lines: Array<{ productId: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
}

/* -------------------------------------------------------------------------
   Selection
   ------------------------------------------------------------------------- */

let cached: Repository | null = null;

/**
 * Returns the Supabase repository when the project is configured, and the
 * seed-catalogue repository otherwise, so the site runs with no environment
 * at all on a fresh clone.
 */
export async function getRepository(): Promise<Repository> {
  if (cached) return cached;

  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (configured) {
    const { SupabaseRepository } = await import("./supabase-repository");
    cached = new SupabaseRepository();
  } else {
    const { MockRepository } = await import("./mock-repository");
    cached = new MockRepository();
  }

  return cached;
}

/** True when the storefront is running on seed data rather than a database. */
export function isUsingSeedData(): boolean {
  return !(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
