import "server-only";

import { banners, categories, collections, products } from "@/lib/data/catalog";
import {
  applyFilters,
  applySort,
  buildFacets,
  findRelated,
  paginate,
} from "@/lib/data/filters";
import type { CreateOrderInput, Repository } from "@/lib/data/repository";
import type {
  Address,
  Banner,
  Category,
  Collection,
  FacetCounts,
  Order,
  OrderItem,
  OrderStatus,
  Paginated,
  ProductQuery,
  ProductWithRelations,
  UserProfile,
} from "@/lib/types";

/**
 * The seed-data repository.
 *
 * Reads come from `catalog.ts`. Writes (orders, wishlists, addresses) live in
 * a module-level store that survives hot reloads but not a restart, which is
 * exactly what you want while the real database is still being provisioned.
 */

interface MutableStore {
  orders: Map<string, Order>;
  wishlists: Map<string, Set<string>>;
  addresses: Map<string, Address[]>;
  profiles: Map<string, UserProfile>;
  orderSequence: number;
  committedStock: Set<string>;
  stockAdjustments: Map<string, number>;
}

const globalStore = globalThis as unknown as { __karthikaStore?: MutableStore };

const store: MutableStore = (globalStore.__karthikaStore ??= {
  orders: new Map(),
  wishlists: new Map(),
  addresses: new Map(),
  profiles: new Map(),
  orderSequence: 24080,
  committedStock: new Set(),
  stockAdjustments: new Map(),
});

/* -------------------------------------------------------------------------
   Joins
   ------------------------------------------------------------------------- */

const categoryById = new Map(categories.map((category) => [category.id, category]));
const collectionById = new Map(collections.map((collection) => [collection.id, collection]));

function withRelations(product: (typeof products)[number]): ProductWithRelations {
  const category = categoryById.get(product.categoryId);
  const collection = product.collectionId
    ? collectionById.get(product.collectionId)
    : undefined;

  if (!category) {
    throw new Error(`Product ${product.slug} references unknown category ${product.categoryId}`);
  }

  return {
    ...product,
    // Stock moves as orders are placed, so read through the adjustment map.
    stockQuantity: Math.max(
      0,
      product.stockQuantity - (store.stockAdjustments.get(product.id) ?? 0),
    ),
    category: { id: category.id, name: category.name, slug: category.slug },
    collection: collection
      ? { id: collection.id, name: collection.name, slug: collection.slug }
      : null,
  };
}

function allProducts(): ProductWithRelations[] {
  return products.map(withRelations);
}

function nextOrderNumber(): string {
  store.orderSequence += 1;
  return `KAR-${store.orderSequence}`;
}

/* -------------------------------------------------------------------------
   Repository
   ------------------------------------------------------------------------- */

export class MockRepository implements Repository {
  async listCategories(): Promise<Category[]> {
    return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return categories.find((category) => category.slug === slug) ?? null;
  }

  async listCollections(): Promise<Collection[]> {
    return [...collections].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    return collections.find((collection) => collection.slug === slug) ?? null;
  }

  async listBanners(): Promise<Banner[]> {
    return banners
      .filter((banner) => banner.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async queryProducts(query: ProductQuery): Promise<Paginated<ProductWithRelations>> {
    const filtered = applyFilters(allProducts(), query);
    const sorted = applySort(filtered, query.sort);
    return paginate(sorted, query.page, query.perPage);
  }

  async getFacets(query: ProductQuery): Promise<FacetCounts> {
    return buildFacets(allProducts(), query);
  }

  async getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
    const product = products.find((entry) => entry.slug === slug && entry.isActive);
    return product ? withRelations(product) : null;
  }

  async getProductsByIds(ids: string[]): Promise<ProductWithRelations[]> {
    const wanted = new Set(ids);
    return products.filter((product) => wanted.has(product.id)).map(withRelations);
  }

  async getRelatedProducts(slug: string, limit = 4): Promise<ProductWithRelations[]> {
    const product = await this.getProductBySlug(slug);
    if (!product) return [];
    return findRelated(allProducts(), product, limit);
  }

  async listAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
    return products
      .filter((product) => product.isActive)
      .map((product) => ({ slug: product.slug, updatedAt: product.updatedAt }));
  }

  /* --- Orders --- */

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const now = new Date().toISOString();
    const catalogue = await this.getProductsByIds(input.lines.map((line) => line.productId));
    const byId = new Map(catalogue.map((product) => [product.id, product]));

    const items: OrderItem[] = input.lines.map((line, index) => {
      const product = byId.get(line.productId);
      if (!product) throw new Error(`Unknown product ${line.productId} on order`);
      return {
        id: `oi-${Date.now()}-${index}`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        fabric: product.fabric,
        color: product.color,
        image: product.images[0]!,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.unitPrice * line.quantity,
      };
    });

    const order: Order = {
      id: `ord-${Date.now().toString(36)}`,
      orderNumber: nextOrderNumber(),
      userId: input.userId,
      email: input.email,
      phone: input.phone,
      status: input.paymentStatus === "paid" ? "confirmed" : "pending",
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      subtotal: input.subtotal,
      shippingAmount: input.shippingAmount,
      totalAmount: input.totalAmount,
      shippingAddress: input.shippingAddress,
      items,
      trackingNumber: null,
      courier: null,
      createdAt: now,
      updatedAt: now,
    };

    store.orders.set(order.id, order);
    return order;
  }

  async getOrdersForUser(userId: string): Promise<Order[]> {
    return [...store.orders.values()]
      .filter((order) => order.userId === userId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async getOrderById(id: string): Promise<Order | null> {
    return store.orders.get(id) ?? null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return (
      [...store.orders.values()].find((order) => order.orderNumber === orderNumber) ?? null
    );
  }

  async updateOrder(
    id: string,
    patch: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "courier">>,
  ): Promise<Order | null> {
    const order = store.orders.get(id);
    if (!order) return null;
    const updated: Order = { ...order, ...patch, updatedAt: new Date().toISOString() };
    store.orders.set(id, updated);
    return updated;
  }

  async listOrders(filter?: { status?: OrderStatus }): Promise<Order[]> {
    return [...store.orders.values()]
      .filter((order) => !filter?.status || order.status === filter.status)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async commitStock(orderId: string): Promise<void> {
    // Idempotent: a webhook that fires twice must not decrement twice.
    if (store.committedStock.has(orderId)) return;
    const order = store.orders.get(orderId);
    if (!order) return;

    for (const item of order.items) {
      store.stockAdjustments.set(
        item.productId,
        (store.stockAdjustments.get(item.productId) ?? 0) + item.quantity,
      );
    }
    store.committedStock.add(orderId);
  }

  /* --- Wishlist --- */

  async listWishlistProductIds(userId: string): Promise<string[]> {
    return [...(store.wishlists.get(userId) ?? [])];
  }

  async addToWishlist(userId: string, productId: string): Promise<void> {
    const set = store.wishlists.get(userId) ?? new Set<string>();
    set.add(productId);
    store.wishlists.set(userId, set);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    store.wishlists.get(userId)?.delete(productId);
  }

  /* --- Addresses --- */

  async listAddresses(userId: string): Promise<Address[]> {
    return [...(store.addresses.get(userId) ?? [])].sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault),
    );
  }

  async createAddress(
    userId: string,
    input: Omit<Address, "id" | "userId">,
  ): Promise<Address> {
    const existing = store.addresses.get(userId) ?? [];
    const address: Address = {
      ...input,
      id: `adr-${Date.now().toString(36)}`,
      userId,
      // The first address a customer saves is their default, whatever they ticked.
      isDefault: input.isDefault || existing.length === 0,
    };

    const next = address.isDefault
      ? existing.map((entry) => ({ ...entry, isDefault: false }))
      : [...existing];

    next.push(address);
    store.addresses.set(userId, next);
    return address;
  }

  async updateAddress(
    userId: string,
    id: string,
    input: Partial<Omit<Address, "id" | "userId">>,
  ): Promise<Address | null> {
    const existing = store.addresses.get(userId) ?? [];
    const index = existing.findIndex((entry) => entry.id === id);
    if (index === -1) return null;

    const updated: Address = { ...existing[index]!, ...input };
    const next = input.isDefault
      ? existing.map((entry) => ({ ...entry, isDefault: false }))
      : [...existing];

    next[index] = updated;
    store.addresses.set(userId, next);
    return updated;
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    const existing = store.addresses.get(userId) ?? [];
    store.addresses.set(
      userId,
      existing.filter((entry) => entry.id !== id),
    );
  }

  /* --- Profile --- */

  async getProfile(firebaseUid: string): Promise<UserProfile | null> {
    return store.profiles.get(firebaseUid) ?? null;
  }

  async upsertProfile(
    firebaseUid: string,
    input: { email: string; displayName?: string | null; phone?: string | null },
  ): Promise<UserProfile> {
    const existing = store.profiles.get(firebaseUid);
    const profile: UserProfile = {
      id: existing?.id ?? `usr-${firebaseUid.slice(0, 8)}`,
      firebaseUid,
      email: input.email,
      displayName: input.displayName ?? existing?.displayName ?? null,
      phone: input.phone ?? existing?.phone ?? null,
      marketingOptIn: existing?.marketingOptIn ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    store.profiles.set(firebaseUid, profile);
    return profile;
  }
}
