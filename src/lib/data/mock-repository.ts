import "server-only";

import * as seed from "@/lib/data/seed";
import {
  applyFilters,
  applyServiceFilters,
  applySort,
  applyVendorQuery,
  buildFacets,
  findRelated,
  paginate,
  productRelevance,
  serviceRelevance,
  sortServices,
  type VendorFacts,
} from "@/lib/data/filters";
import type {
  AttributeDefinitionInput,
  CategoryInput,
  CollectionInput,
  CommissionRuleInput,
  CreateBookingInput,
  CreateOrderInput,
  CreateReviewInput,
  ProductInput,
  PromotionInput,
  Repository,
  ServiceInput,
  VendorPatch,
} from "@/lib/data/repository";
import { buildTree, categoryTrail, inheritedAttributes, toRef } from "@/lib/marketplace/categories";
import { commissionOn, resolveCommission } from "@/lib/marketplace/commission";
import { aggregateOrderStatus } from "@/lib/marketplace/fulfillment";
import { cityName, commerce, site } from "@/lib/site";
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
  Customer,
  Dispute,
  DisputeStatus,
  FacetCounts,
  ListingStatus,
  Order,
  OrderItem,
  OrderStatus,
  Paginated,
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
  ServiceQuery,
  ServiceWithRelations,
  Transaction,
  UserProfile,
  Vendor,
  VendorApplicationInput,
  VendorOrder,
  VendorOrderStatus,
  VendorQuery,
  VendorSummary,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * The seed-data repository.
 *
 * Boots from `lib/data/seed` into a process-wide store, so every write a
 * dashboard makes (an approval, a stock change, a shipped order, a new
 * coupon) is visible to every later request until the process restarts.
 * That is exactly what you want while the real database is being
 * provisioned, and it lets the whole marketplace be demonstrated with no
 * environment at all.
 */

interface Store {
  productTypes: ProductType[];
  categories: Category[];
  attributeDefinitions: AttributeDefinition[];
  collections: Collection[];
  vendors: Vendor[];
  products: Product[];
  services: Service[];
  banners: Banner[];
  promotions: Promotion[];
  commissionRules: CommissionRule[];
  orders: Order[];
  bookings: Booking[];
  reviews: Review[];
  customers: Customer[];
  transactions: Transaction[];
  payouts: Payout[];
  refunds: Refund[];
  disputes: Dispute[];
  wishlists: Map<string, Set<string>>;
  addresses: Map<string, Address[]>;
  profiles: Map<string, UserProfile>;
  committedStock: Set<string>;
  orderSequence: number;
  bookingSequence: number;
}

function boot(): Store {
  const clone = <T>(value: T): T => structuredClone(value);
  return {
    productTypes: clone(seed.productTypes),
    categories: clone(seed.categories),
    attributeDefinitions: clone(seed.attributeDefinitions),
    collections: clone(seed.collections),
    vendors: clone(seed.vendors),
    products: clone(seed.products),
    services: clone(seed.services),
    banners: clone(seed.banners),
    promotions: clone(seed.promotions),
    commissionRules: clone(seed.commissionRules),
    orders: clone(seed.activity.orders),
    bookings: clone(seed.activity.bookings),
    reviews: clone(seed.activity.reviews),
    customers: clone(seed.activity.customers),
    transactions: clone(seed.activity.transactions),
    payouts: clone(seed.activity.payouts),
    refunds: clone(seed.activity.refunds),
    disputes: clone(seed.activity.disputes),
    wishlists: new Map(),
    addresses: new Map(),
    profiles: new Map(),
    // Seeded orders already shipped, so their stock is already gone.
    committedStock: new Set(seed.activity.orders.map((order) => order.id)),
    orderSequence: seed.activity.orderSequence,
    bookingSequence: seed.activity.bookingSequence,
  };
}

const globalStore = globalThis as unknown as { __haatStore?: Store };
const store: Store = (globalStore.__haatStore ??= boot());

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* -------------------------------------------------------------------------
   Joins
   ------------------------------------------------------------------------- */

function vendorById(id: string) {
  return store.vendors.find((vendor) => vendor.id === id);
}

function categoryById(id: string) {
  return store.categories.find((category) => category.id === id);
}

function summarise(vendor: Vendor): VendorSummary {
  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    city: vendor.city,
    cityName: cityName(vendor.city),
    isVerified: vendor.isVerified,
    rating: vendor.rating,
    ratingCount: vendor.ratingCount,
    logoUrl: vendor.logoUrl,
    brandColor: vendor.brandColor,
  };
}

function withRelations(product: Product): ProductWithRelations {
  const vendor = vendorById(product.vendorId);
  const category = categoryById(product.categoryId);
  if (!vendor) throw new Error(`Product ${product.slug} references unknown vendor ${product.vendorId}`);
  if (!category) throw new Error(`Product ${product.slug} references unknown category ${product.categoryId}`);

  const productType = store.productTypes.find((type) => type.id === product.productTypeId) ?? store.productTypes[0]!;
  const hasLocal = product.fulfillmentTypes.some((type) => type === "local_delivery" || type === "pickup");

  return {
    ...product,
    vendor: summarise(vendor),
    category: toRef(category),
    categoryTrail: categoryTrail(store.categories, category.id).map(toRef),
    collections: store.collections
      .filter((collection) => product.collectionIds.includes(collection.id))
      .map((collection) => ({ id: collection.id, name: collection.name, slug: collection.slug })),
    productType: { id: productType.id, key: productType.key, name: productType.name },
    shipsNationwide: product.fulfillmentTypes.some((type) => type === "shipping" || type === "digital"),
    localCities: hasLocal ? [...new Set([vendor.city, ...vendor.settings.deliveryZones])] : [],
  };
}

function serviceWithRelations(service: Service): ServiceWithRelations {
  const vendor = vendorById(service.vendorId);
  const category = categoryById(service.categoryId);
  if (!vendor) throw new Error(`Service ${service.slug} references unknown vendor ${service.vendorId}`);
  if (!category) throw new Error(`Service ${service.slug} references unknown category ${service.categoryId}`);
  return {
    ...service,
    vendor: summarise(vendor),
    category: toRef(category),
    categoryTrail: categoryTrail(store.categories, category.id).map(toRef),
  };
}

function isLive(listing: { status: ListingStatus; isActive: boolean; vendorId: string }) {
  return listing.status === "approved" && listing.isActive && vendorById(listing.vendorId)?.status === "approved";
}

function liveProducts(): ProductWithRelations[] {
  return store.products.filter(isLive).map(withRelations);
}

function liveServices(): ServiceWithRelations[] {
  return store.services.filter(isLive).map(serviceWithRelations);
}

function definitionsFor(categoryId: string) {
  return inheritedAttributes(store.categories, store.attributeDefinitions, categoryId);
}

/** Price, compare-at and stock always follow the variants. */
function deriveFromVariants(product: Product): Product {
  const active = product.variants.filter((variant) => variant.isActive);
  const cheapest = [...active].sort((a, b) => a.price - b.price)[0];
  return {
    ...product,
    price: cheapest?.price ?? product.price,
    compareAtPrice: cheapest?.compareAtPrice ?? null,
    stockQuantity: active.reduce((total, variant) => total + variant.stockQuantity, 0),
  };
}

function vendorFacts(vendor: Vendor): VendorFacts {
  const products = store.products.filter((product) => product.vendorId === vendor.id && isLive(product));
  const services = store.services.filter((service) => service.vendorId === vendor.id && isLive(service));
  const categoryIds = new Set<string>([vendor.primaryCategoryId]);
  for (const listing of [...products, ...services]) {
    for (const category of categoryTrail(store.categories, listing.categoryId)) categoryIds.add(category.id);
  }
  for (const category of categoryTrail(store.categories, vendor.primaryCategoryId)) categoryIds.add(category.id);
  return {
    categoryName: categoryById(vendor.primaryCategoryId)?.name ?? "",
    categoryIds,
    categorySlugs: new Set([...categoryIds].map((id) => categoryById(id)?.slug ?? "")),
    productCount: products.length,
    serviceCount: services.length,
  };
}

function commissionFor(product: Product, vendor: Vendor) {
  return resolveCommission({
    rules: store.commissionRules,
    productId: product.id,
    productRate: product.commissionRate,
    vendorId: vendor.id,
    vendorRate: vendor.commissionRate,
    vendorPlan: vendor.plan,
    categoryTrailIds: categoryTrail(store.categories, product.categoryId).map((category) => category.id),
  }).rate;
}

function sortByDate<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/* -------------------------------------------------------------------------
   Repository
   ------------------------------------------------------------------------- */

export class MockRepository implements Repository {
  /* --- Taxonomy --- */

  async listCategories(filter?: { kind?: CategoryKind; includeInactive?: boolean }): Promise<Category[]> {
    return store.categories
      .filter((category) => (filter?.includeInactive ? true : category.isActive))
      .filter((category) => (filter?.kind ? category.kind === filter.kind : true))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return store.categories.find((category) => category.slug === slug && category.isActive) ?? null;
  }

  async getCategoryTree(kind?: CategoryKind): Promise<CategoryNode[]> {
    const counts = new Map<string, number>();
    for (const listing of [...store.products.filter(isLive), ...store.services.filter(isLive)]) {
      counts.set(listing.categoryId, (counts.get(listing.categoryId) ?? 0) + 1);
    }
    const categories = await this.listCategories({ kind });
    return buildTree(categories, counts);
  }

  async saveCategory(input: CategoryInput, id?: string): Promise<Category> {
    if (id) {
      const index = store.categories.findIndex((category) => category.id === id);
      if (index === -1) throw new Error(`Unknown category ${id}`);
      store.categories[index] = { ...store.categories[index]!, ...input, id };
      return store.categories[index]!;
    }
    const category: Category = { ...input, id: `cat-${slugify(input.slug || input.name)}` };
    store.categories.push(category);
    return category;
  }

  async listProductTypes(): Promise<ProductType[]> {
    return store.productTypes;
  }

  async getAttributeDefinitions(categoryId: string): Promise<AttributeDefinition[]> {
    return definitionsFor(categoryId);
  }

  async listAttributeDefinitions(): Promise<AttributeDefinition[]> {
    return [...store.attributeDefinitions].sort(
      (a, b) => a.categoryId.localeCompare(b.categoryId) || a.displayOrder - b.displayOrder,
    );
  }

  async saveAttributeDefinition(input: AttributeDefinitionInput, id?: string): Promise<AttributeDefinition> {
    if (id) {
      const index = store.attributeDefinitions.findIndex((definition) => definition.id === id);
      if (index === -1) throw new Error(`Unknown attribute ${id}`);
      store.attributeDefinitions[index] = { ...input, id };
      return store.attributeDefinitions[index]!;
    }
    const definition: AttributeDefinition = { ...input, id: `attr-${input.categoryId}-${input.key}` };
    store.attributeDefinitions.push(definition);
    return definition;
  }

  async deleteAttributeDefinition(id: string): Promise<void> {
    store.attributeDefinitions = store.attributeDefinitions.filter((definition) => definition.id !== id);
  }

  async listCollections(filter?: { vendorId?: string | null; featuredOnly?: boolean }): Promise<Collection[]> {
    return store.collections
      .filter((collection) => (filter?.vendorId === undefined ? true : collection.vendorId === filter.vendorId))
      .filter((collection) => (filter?.featuredOnly ? collection.isFeatured : true))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    return store.collections.find((collection) => collection.slug === slug) ?? null;
  }

  async saveCollection(input: CollectionInput, id?: string): Promise<Collection> {
    if (id) {
      const index = store.collections.findIndex((collection) => collection.id === id);
      if (index === -1) throw new Error(`Unknown collection ${id}`);
      store.collections[index] = { ...input, id };
      return store.collections[index]!;
    }
    const collection: Collection = { ...input, id: `col-${slugify(input.slug || input.name)}` };
    store.collections.push(collection);
    return collection;
  }

  async listBanners(): Promise<Banner[]> {
    return store.banners.filter((banner) => banner.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /* --- Products --- */

  async queryProducts(query: ProductQuery): Promise<Paginated<ProductWithRelations>> {
    const filtered = applyFilters(liveProducts(), query);
    return paginate(applySort(filtered, query.sort, query.search), query.page, query.perPage);
  }

  async getFacets(query: ProductQuery): Promise<FacetCounts> {
    return buildFacets(liveProducts(), query, definitionsFor);
  }

  async getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
    const product = store.products.find((entry) => entry.slug === slug && isLive(entry));
    return product ? withRelations(product) : null;
  }

  async getProductsByIds(ids: string[]): Promise<ProductWithRelations[]> {
    const wanted = new Set(ids);
    return store.products.filter((product) => wanted.has(product.id)).map(withRelations);
  }

  async getRelatedProducts(slug: string, limit = 4): Promise<ProductWithRelations[]> {
    const product = await this.getProductBySlug(slug);
    if (!product) return [];
    return findRelated(liveProducts(), product, limit);
  }

  async listAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
    return store.products.filter(isLive).map((product) => ({ slug: product.slug, updatedAt: product.updatedAt }));
  }

  async listProductsForDashboard(filter?: { vendorId?: string; status?: ListingStatus; search?: string }) {
    const term = filter?.search?.toLowerCase().trim();
    return sortByDate(
      store.products
        .filter((product) => !filter?.vendorId || product.vendorId === filter.vendorId)
        .filter((product) => !filter?.status || product.status === filter.status)
        .map(withRelations)
        .filter((product) =>
          !term ||
          [product.name, product.vendor.name, product.category.name, ...product.variants.map((v) => v.sku)]
            .join(" ")
            .toLowerCase()
            .includes(term),
        ),
    );
  }

  async getProductById(id: string): Promise<ProductWithRelations | null> {
    const product = store.products.find((entry) => entry.id === id);
    return product ? withRelations(product) : null;
  }

  async saveProduct(input: ProductInput, id?: string): Promise<Product> {
    const timestamp = now();
    if (id) {
      const index = store.products.findIndex((product) => product.id === id);
      if (index === -1) throw new Error(`Unknown product ${id}`);
      const existing = store.products[index]!;
      store.products[index] = deriveFromVariants({ ...existing, ...input, id, updatedAt: timestamp });
      return store.products[index]!;
    }
    const productId = newId("prd");
    let slug = slugify(input.slug || input.name);
    if (store.products.some((product) => product.slug === slug)) slug = `${slug}-${productId.slice(-4)}`;
    const product = deriveFromVariants({
      ...input,
      id: productId,
      slug,
      variants: input.variants.map((variant, index) => ({ ...variant, id: variant.id || `${productId}-v${index + 1}` })),
      price: 0,
      compareAtPrice: null,
      stockQuantity: 0,
      rating: 0,
      ratingCount: 0,
      salesCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    store.products.unshift(product);
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    store.products = store.products.filter((product) => product.id !== id);
  }

  async setProductStatus(id: string, status: ListingStatus, note: string | null = null): Promise<void> {
    const product = store.products.find((entry) => entry.id === id);
    if (product) Object.assign(product, { status, moderationNote: note, updatedAt: now() });
  }

  /* --- Services --- */

  async queryServices(query: ServiceQuery): Promise<Paginated<ServiceWithRelations>> {
    const filtered = applyServiceFilters(liveServices(), query);
    return paginate(sortServices(filtered, query.sort, query.search), query.page, query.perPage ?? commerce.servicesPerPage);
  }

  async getServiceBySlug(slug: string): Promise<ServiceWithRelations | null> {
    const service = store.services.find((entry) => entry.slug === slug && isLive(entry));
    return service ? serviceWithRelations(service) : null;
  }

  async getServiceById(id: string): Promise<ServiceWithRelations | null> {
    const service = store.services.find((entry) => entry.id === id);
    return service ? serviceWithRelations(service) : null;
  }

  async listServicesForDashboard(filter?: { vendorId?: string; status?: ListingStatus; search?: string }) {
    const term = filter?.search?.toLowerCase().trim();
    return sortByDate(
      store.services
        .filter((service) => !filter?.vendorId || service.vendorId === filter.vendorId)
        .filter((service) => !filter?.status || service.status === filter.status)
        .map(serviceWithRelations)
        .filter((service) => !term || `${service.name} ${service.vendor.name} ${service.category.name}`.toLowerCase().includes(term)),
    );
  }

  async saveService(input: ServiceInput, id?: string): Promise<Service> {
    const timestamp = now();
    if (id) {
      const index = store.services.findIndex((service) => service.id === id);
      if (index === -1) throw new Error(`Unknown service ${id}`);
      store.services[index] = { ...store.services[index]!, ...input, id, updatedAt: timestamp };
      return store.services[index]!;
    }
    const serviceId = newId("svc");
    let slug = slugify(input.slug || input.name);
    if (store.services.some((service) => service.slug === slug)) slug = `${slug}-${serviceId.slice(-4)}`;
    const service: Service = {
      ...input,
      id: serviceId,
      slug,
      rating: 0,
      ratingCount: 0,
      bookingCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.services.unshift(service);
    return service;
  }

  async deleteService(id: string): Promise<void> {
    store.services = store.services.filter((service) => service.id !== id);
  }

  async setServiceStatus(id: string, status: ListingStatus, note: string | null = null): Promise<void> {
    const service = store.services.find((entry) => entry.id === id);
    if (service) Object.assign(service, { status, moderationNote: note, updatedAt: now() });
  }

  /* --- Vendors --- */

  async queryVendors(query: VendorQuery = {}): Promise<Vendor[]> {
    return applyVendorQuery(store.vendors, query, vendorFacts);
  }

  async getVendorBySlug(slug: string): Promise<Vendor | null> {
    return store.vendors.find((vendor) => vendor.slug === slug) ?? null;
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    return vendorById(id) ?? null;
  }

  async getVendorForEmail(email: string): Promise<Vendor | null> {
    const lowered = email.toLowerCase();
    return store.vendors.find((vendor) => vendor.ownerEmails.some((owner) => owner.toLowerCase() === lowered)) ?? null;
  }

  async updateVendor(id: string, patch: VendorPatch): Promise<Vendor | null> {
    const vendor = vendorById(id);
    if (!vendor) return null;
    Object.assign(vendor, patch, { updatedAt: now() });
    return vendor;
  }

  async createVendorApplication(input: VendorApplicationInput): Promise<Vendor> {
    const timestamp = now();
    const id = newId("vendor");
    let slug = slugify(input.businessName);
    if (store.vendors.some((vendor) => vendor.slug === slug)) slug = `${slug}-${id.slice(-4)}`;
    const template = store.vendors.find((vendor) => vendor.status === "pending") ?? store.vendors[0]!;
    const vendor: Vendor = {
      ...structuredClone(template),
      id,
      slug,
      name: input.businessName,
      tagline: input.description.split(".")[0]?.slice(0, 80) ?? "",
      description: input.description,
      story: "",
      ownerName: input.ownerName,
      ownerEmails: [input.email],
      logoUrl: null,
      brandColor: "#334155",
      city: input.city,
      locality: "",
      state: "",
      address: cityName(input.city),
      contactEmail: input.email,
      contactPhone: input.phone,
      website: input.website,
      instagram: null,
      primaryCategoryId: input.primaryCategoryId,
      status: "pending",
      statusNote: `Applied to sell ${input.offers === "both" ? "products and services" : input.offers}.`,
      isVerified: false,
      isFeatured: false,
      plan: "starter",
      commissionRate: null,
      rating: 0,
      ratingCount: 0,
      followerCount: 0,
      responseTime: "Newly joined",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    vendor.settings = { ...vendor.settings, deliveryZones: [input.city], gstin: null, pickupAddress: null };
    store.vendors.push(vendor);
    return vendor;
  }

  /* --- Search --- */

  async search(term: string, options: { city?: string; limit?: number } = {}): Promise<SearchResults> {
    const limit = options.limit ?? 24;
    const query = term.trim();
    const empty: SearchResults = {
      query,
      products: [],
      services: [],
      vendors: [],
      categories: [],
      collections: [],
      totals: { products: 0, services: 0, vendors: 0 },
    };
    if (query.length < 2) return empty;

    const products = applySort(applyFilters(liveProducts(), { search: query, city: options.city }), "featured", query);
    const services = sortServices(applyServiceFilters(liveServices(), { search: query, city: options.city }), "featured", query);
    const vendors = applyVendorQuery(store.vendors, { search: query }, vendorFacts);
    const lowered = query.toLowerCase();

    // Vendors whose listings match rank too: "bridal" should surface the
    // makeup studio even though its name says nothing about brides.
    const vendorScores = new Map<string, number>();
    for (const product of products.slice(0, 40)) {
      vendorScores.set(product.vendorId, (vendorScores.get(product.vendorId) ?? 0) + productRelevance(product, query));
    }
    for (const service of services.slice(0, 40)) {
      vendorScores.set(service.vendorId, (vendorScores.get(service.vendorId) ?? 0) + serviceRelevance(service, query));
    }
    const vendorIds = new Set(vendors.map((vendor) => vendor.id));
    const relatedVendors = [...vendorScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => vendorById(id))
      .filter((vendor): vendor is Vendor => Boolean(vendor) && !vendorIds.has(vendor!.id));

    return {
      query,
      products: products.slice(0, limit),
      services: services.slice(0, limit),
      vendors: [...vendors, ...relatedVendors].slice(0, 8),
      categories: store.categories
        .filter((category) => category.isActive && category.name.toLowerCase().includes(lowered))
        .slice(0, 6)
        .map((category) => ({ ...toRef(category), kind: category.kind, image: category.image })),
      collections: store.collections
        .filter((collection) => `${collection.name} ${collection.description}`.toLowerCase().includes(lowered))
        .slice(0, 4),
      totals: { products: products.length, services: services.length, vendors: vendors.length + relatedVendors.length },
    };
  }

  /* --- Orders --- */

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const timestamp = now();
    store.orderSequence += 1;
    const orderNumber = `${site.orderPrefix}-${store.orderSequence}`;
    const orderId = `ord-${store.orderSequence}`;

    const vendorOrders: VendorOrder[] = input.groups.map((group, groupIndex) => {
      const vendor = vendorById(group.vendorId);
      if (!vendor) throw new Error(`Unknown vendor ${group.vendorId} on order`);
      const vendorOrderId = `${orderId}-v${groupIndex + 1}`;

      const items: OrderItem[] = group.lines.map((line, index) => {
        const product = store.products.find((entry) => entry.id === line.productId);
        if (!product) throw new Error(`Unknown product ${line.productId} on order`);
        const variant = product.variants.find((entry) => entry.id === line.variantId) ?? product.variants[0]!;
        const lineTotal = line.unitPrice * line.quantity;
        const rate = commissionFor(product, vendor);
        return {
          id: `${vendorOrderId}-i${index + 1}`,
          vendorOrderId,
          productId: product.id,
          variantId: variant.id,
          variantTitle: variant.title,
          vendorId: vendor.id,
          name: product.name,
          slug: product.slug,
          subtitle: product.subtitle,
          color: product.color,
          image: product.images[0]!,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal,
          customization: line.customization,
          commissionRate: rate,
          commissionAmount: commissionOn(lineTotal, rate),
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const commissionAmount = items.reduce((sum, item) => sum + item.commissionAmount, 0);
      const total = subtotal + group.shippingAmount - group.discountAmount;

      return {
        id: vendorOrderId,
        orderId,
        orderNumber,
        number: `${orderNumber}-${groupIndex + 1}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorSlug: vendor.slug,
        status: "new",
        fulfillmentType: group.fulfillmentType,
        items,
        subtotal,
        shippingAmount: group.shippingAmount,
        discountAmount: group.discountAmount,
        total,
        commissionAmount,
        vendorEarnings: total - commissionAmount,
        trackingNumber: null,
        courier: null,
        customerName: input.customerName,
        customerEmail: input.email,
        city: input.shippingAddress.city,
        history: [{ status: "new", at: timestamp, note: null }],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });

    const subtotal = vendorOrders.reduce((sum, vo) => sum + vo.subtotal, 0);
    const shippingAmount = vendorOrders.reduce((sum, vo) => sum + vo.shippingAmount, 0);
    const discountAmount = vendorOrders.reduce((sum, vo) => sum + vo.discountAmount, 0);

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: input.userId,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      status: input.paymentStatus === "paid" ? "confirmed" : "pending",
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      subtotal,
      shippingAmount,
      discountAmount,
      couponCode: input.couponCode,
      totalAmount: subtotal + shippingAmount - discountAmount,
      commissionAmount: vendorOrders.reduce((sum, vo) => sum + vo.commissionAmount, 0),
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      items: vendorOrders.flatMap((vo) => vo.items),
      vendorOrders,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (input.couponCode) {
      const promotion = store.promotions.find((entry) => entry.code === input.couponCode);
      if (promotion) promotion.usageCount += 1;
    }

    store.orders.unshift(order);
    return order;
  }

  async getOrdersForUser(userId: string): Promise<Order[]> {
    return store.orders.filter((order) => order.userId === userId);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return store.orders.find((order) => order.id === id) ?? null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return store.orders.find((order) => order.orderNumber === orderNumber) ?? null;
  }

  async listOrders(filter?: { status?: OrderStatus; vendorId?: string; since?: string }): Promise<Order[]> {
    return store.orders
      .filter((order) => !filter?.status || order.status === filter.status)
      .filter((order) => !filter?.vendorId || order.vendorOrders.some((vo) => vo.vendorId === filter.vendorId))
      .filter((order) => !filter?.since || order.createdAt >= filter.since);
  }

  async updateOrder(id: string, patch: Partial<Pick<Order, "paymentStatus">> & { status?: OrderStatus }): Promise<Order | null> {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order) return null;
    const timestamp = now();
    if (patch.paymentStatus) order.paymentStatus = patch.paymentStatus;
    if (patch.status) {
      // An admin override applies to every vendor order that can still move.
      const map: Partial<Record<OrderStatus, VendorOrderStatus>> = {
        confirmed: "new",
        processing: "processing",
        shipped: "shipped",
        delivered: "delivered",
        cancelled: "cancelled",
        returned: "returned",
      };
      const next = map[patch.status];
      if (next) {
        for (const vo of order.vendorOrders) {
          if (vo.status === "cancelled" || vo.status === next) continue;
          vo.status = next;
          vo.history.push({ status: next, at: timestamp, note: "Updated by marketplace admin" });
          vo.updatedAt = timestamp;
        }
      }
      order.status = patch.status === "pending" || patch.status === "confirmed" ? patch.status : aggregateOrderStatus(order.vendorOrders.map((vo) => vo.status));
    }
    order.updatedAt = timestamp;
    return order;
  }

  async listVendorOrders(filter?: { vendorId?: string; status?: VendorOrderStatus; since?: string }): Promise<VendorOrder[]> {
    return store.orders
      .flatMap((order) => order.vendorOrders)
      .filter((vo) => !filter?.vendorId || vo.vendorId === filter.vendorId)
      .filter((vo) => !filter?.status || vo.status === filter.status)
      .filter((vo) => !filter?.since || vo.createdAt >= filter.since);
  }

  async getVendorOrder(id: string): Promise<{ order: Order; vendorOrder: VendorOrder } | null> {
    for (const order of store.orders) {
      const vendorOrder = order.vendorOrders.find((vo) => vo.id === id || vo.number === id);
      if (vendorOrder) return { order, vendorOrder };
    }
    return null;
  }

  async updateVendorOrder(
    id: string,
    patch: { status?: VendorOrderStatus; trackingNumber?: string | null; courier?: string | null; note?: string | null },
  ): Promise<VendorOrder | null> {
    const found = await this.getVendorOrder(id);
    if (!found) return null;
    const { order, vendorOrder } = found;
    const timestamp = now();

    if (patch.status && patch.status !== vendorOrder.status) {
      vendorOrder.status = patch.status;
      vendorOrder.history.push({ status: patch.status, at: timestamp, note: patch.note ?? null });
    }
    if (patch.trackingNumber !== undefined) vendorOrder.trackingNumber = patch.trackingNumber;
    if (patch.courier !== undefined) vendorOrder.courier = patch.courier;
    vendorOrder.updatedAt = timestamp;

    if (order.status !== "pending" || order.paymentMethod === "cod") {
      order.status = aggregateOrderStatus(order.vendorOrders.map((vo) => vo.status));
    }
    order.updatedAt = timestamp;
    return vendorOrder;
  }

  async commitStock(orderId: string): Promise<void> {
    // Idempotent: a webhook that fires twice must not decrement twice.
    if (store.committedStock.has(orderId)) return;
    const order = store.orders.find((entry) => entry.id === orderId);
    if (!order) return;

    for (const item of order.items) {
      const product = store.products.find((entry) => entry.id === item.productId);
      const variant = product?.variants.find((entry) => entry.id === item.variantId);
      if (!product || !variant || !product.trackInventory) continue;
      variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
      product.salesCount += item.quantity;
      Object.assign(product, deriveFromVariants(product));
    }
    store.committedStock.add(orderId);
  }

  /* --- Bookings --- */

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const service = store.services.find((entry) => entry.id === input.serviceId);
    if (!service) throw new Error(`Unknown service ${input.serviceId}`);
    const vendor = vendorById(service.vendorId)!;
    const rate = resolveCommission({
      rules: store.commissionRules,
      vendorId: vendor.id,
      vendorRate: service.commissionRate ?? vendor.commissionRate,
      vendorPlan: vendor.plan,
      categoryTrailIds: categoryTrail(store.categories, service.categoryId).map((category) => category.id),
    }).rate;

    const timestamp = now();
    store.bookingSequence += 1;
    const booking: Booking = {
      id: `bkg-${store.bookingSequence}`,
      bookingNumber: `${site.bookingPrefix}-${store.bookingSequence}`,
      serviceId: service.id,
      serviceName: service.name,
      serviceSlug: service.slug,
      vendorId: vendor.id,
      vendorName: vendor.name,
      userId: input.userId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      scheduledAt: input.scheduledAt,
      durationMinutes: service.durationMinutes,
      quantity: input.quantity,
      addons: input.addons,
      location: input.location,
      city: input.city,
      status: input.status,
      notes: input.notes,
      unitPrice: input.unitPrice,
      subtotal: input.subtotal,
      addonsTotal: input.addonsTotal,
      total: input.total,
      depositAmount: input.depositAmount,
      paymentStatus: "pending",
      commissionRate: rate,
      commissionAmount: commissionOn(input.total, rate),
      image: service.images[0]!,
      cancellationReason: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.bookings.unshift(booking);
    service.bookingCount += 1;
    return booking;
  }

  async getBookingByNumber(bookingNumber: string): Promise<Booking | null> {
    return store.bookings.find((booking) => booking.bookingNumber === bookingNumber) ?? null;
  }

  async getBookingsForUser(userId: string): Promise<Booking[]> {
    return store.bookings
      .filter((booking) => booking.userId === userId)
      .sort((a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt));
  }

  async listBookings(filter?: { vendorId?: string; serviceId?: string; status?: BookingStatus; from?: string; to?: string }) {
    return store.bookings
      .filter((booking) => !filter?.vendorId || booking.vendorId === filter.vendorId)
      .filter((booking) => !filter?.serviceId || booking.serviceId === filter.serviceId)
      .filter((booking) => !filter?.status || booking.status === filter.status)
      .filter((booking) => !filter?.from || booking.scheduledAt >= filter.from)
      .filter((booking) => !filter?.to || booking.scheduledAt < filter.to);
  }

  async updateBooking(id: string, patch: { status?: BookingStatus; cancellationReason?: string | null }) {
    const booking = store.bookings.find((entry) => entry.id === id || entry.bookingNumber === id);
    if (!booking) return null;
    Object.assign(booking, patch, { updatedAt: now() });
    if (patch.status === "cancelled" && booking.paymentStatus === "paid") booking.paymentStatus = "refunded";
    if (patch.status === "completed") booking.paymentStatus = "paid";
    return booking;
  }

  /* --- Customers --- */

  async listCustomers(filter?: { vendorId?: string; search?: string }): Promise<Customer[]> {
    const term = filter?.search?.toLowerCase().trim();
    let customers = store.customers;

    if (filter?.vendorId) {
      // A vendor sees only people who bought from or booked with them, with
      // totals for that relationship alone.
      const byEmail = new Map<string, Customer>();
      for (const vo of store.orders.flatMap((order) => order.vendorOrders)) {
        if (vo.vendorId !== filter.vendorId) continue;
        const base = store.customers.find((customer) => customer.email === vo.customerEmail);
        const entry = byEmail.get(vo.customerEmail) ?? {
          ...(base ?? { id: vo.customerEmail, name: vo.customerName, email: vo.customerEmail, phone: "", city: vo.city, status: "active" as const, createdAt: vo.createdAt }),
          orderCount: 0,
          bookingCount: 0,
          totalSpent: 0,
          lastActiveAt: null,
        };
        entry.orderCount += 1;
        if (vo.status !== "cancelled") entry.totalSpent += vo.total;
        if (!entry.lastActiveAt || entry.lastActiveAt < vo.createdAt) entry.lastActiveAt = vo.createdAt;
        byEmail.set(vo.customerEmail, entry);
      }
      for (const booking of store.bookings) {
        if (booking.vendorId !== filter.vendorId) continue;
        const base = store.customers.find((customer) => customer.email === booking.customerEmail);
        const entry = byEmail.get(booking.customerEmail) ?? {
          ...(base ?? { id: booking.customerEmail, name: booking.customerName, email: booking.customerEmail, phone: booking.customerPhone, city: booking.city, status: "active" as const, createdAt: booking.createdAt }),
          orderCount: 0,
          bookingCount: 0,
          totalSpent: 0,
          lastActiveAt: null,
        };
        entry.bookingCount += 1;
        if (booking.status !== "cancelled") entry.totalSpent += booking.total;
        if (!entry.lastActiveAt || entry.lastActiveAt < booking.createdAt) entry.lastActiveAt = booking.createdAt;
        byEmail.set(booking.customerEmail, entry);
      }
      customers = [...byEmail.values()];
    }

    return customers
      .filter((customer) => !term || `${customer.name} ${customer.email} ${customer.city}`.toLowerCase().includes(term))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async updateCustomer(id: string, patch: { status: Customer["status"] }): Promise<Customer | null> {
    const customer = store.customers.find((entry) => entry.id === id);
    if (!customer) return null;
    customer.status = patch.status;
    return customer;
  }

  /* --- Reviews --- */

  async listReviews(filter?: {
    subjectType?: ReviewSubjectType;
    subjectId?: string;
    vendorId?: string;
    status?: ReviewStatus | "all";
  }): Promise<Review[]> {
    const status = filter?.status ?? "published";
    return sortByDate(
      store.reviews
        .filter((review) => !filter?.subjectType || review.subjectType === filter.subjectType)
        .filter((review) => !filter?.subjectId || review.subjectId === filter.subjectId)
        .filter((review) => !filter?.vendorId || review.vendorId === filter.vendorId)
        .filter((review) => status === "all" || review.status === status),
    );
  }

  async createReview(input: CreateReviewInput): Promise<Review> {
    const subject =
      input.subjectType === "product"
        ? store.products.find((entry) => entry.id === input.subjectId)
        : input.subjectType === "service"
          ? store.services.find((entry) => entry.id === input.subjectId)
          : store.vendors.find((entry) => entry.id === input.subjectId);
    if (!subject) throw new Error(`Unknown review subject ${input.subjectId}`);

    const review: Review = {
      id: newId("rev"),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      subjectName: subject.name,
      vendorId: "vendorId" in subject ? subject.vendorId : subject.id,
      userId: input.userId,
      authorName: input.authorName,
      authorCity: input.authorCity,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      // New reviews wait for moderation.
      status: "pending",
      isVerifiedPurchase: false,
      helpfulCount: 0,
      vendorReply: null,
      createdAt: now(),
    };
    store.reviews.unshift(review);
    return review;
  }

  async updateReview(id: string, patch: { status?: ReviewStatus; vendorReply?: string | null }): Promise<Review | null> {
    const review = store.reviews.find((entry) => entry.id === id);
    if (!review) return null;
    Object.assign(review, patch);
    return review;
  }

  /* --- Promotions --- */

  async listPromotions(filter?: { vendorId?: string | null; activeOnly?: boolean }): Promise<Promotion[]> {
    const timestamp = now();
    return sortByDate(
      store.promotions
        .filter((promotion) => (filter?.vendorId === undefined ? true : promotion.vendorId === filter.vendorId))
        .filter((promotion) =>
          !filter?.activeOnly || (promotion.isActive && promotion.startsAt <= timestamp && promotion.endsAt > timestamp),
        ),
    );
  }

  async getPromotionByCode(code: string): Promise<Promotion | null> {
    const wanted = code.trim().toUpperCase();
    return store.promotions.find((promotion) => promotion.code === wanted) ?? null;
  }

  async savePromotion(input: PromotionInput, id?: string): Promise<Promotion> {
    const normalised = { ...input, code: input.code ? input.code.trim().toUpperCase() : null };
    if (id) {
      const promotion = store.promotions.find((entry) => entry.id === id);
      if (!promotion) throw new Error(`Unknown promotion ${id}`);
      Object.assign(promotion, normalised);
      return promotion;
    }
    const promotion: Promotion = { ...normalised, id: newId("promo"), usageCount: 0, createdAt: now() };
    store.promotions.unshift(promotion);
    return promotion;
  }

  async deletePromotion(id: string): Promise<void> {
    store.promotions = store.promotions.filter((promotion) => promotion.id !== id);
  }

  /* --- Commission --- */

  async listCommissionRules(): Promise<CommissionRule[]> {
    const order = { global: 0, category: 1, vendor: 2, product: 3 } as const;
    return [...store.commissionRules].sort((a, b) => order[a.scope] - order[b.scope]);
  }

  async saveCommissionRule(input: CommissionRuleInput, id?: string): Promise<CommissionRule> {
    const timestamp = now();
    const existing = id
      ? store.commissionRules.find((rule) => rule.id === id)
      : store.commissionRules.find((rule) => rule.scope === input.scope && rule.scopeId === input.scopeId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: timestamp });
      return existing;
    }
    const rule: CommissionRule = { ...input, id: newId("com"), createdAt: timestamp, updatedAt: timestamp };
    store.commissionRules.push(rule);
    return rule;
  }

  async deleteCommissionRule(id: string): Promise<void> {
    store.commissionRules = store.commissionRules.filter((rule) => rule.id !== id || rule.scope === "global");
  }

  async getCommissionRate(input: { categoryId?: string; vendorId?: string; productId?: string }): Promise<number> {
    const product = input.productId ? store.products.find((entry) => entry.id === input.productId) : undefined;
    const vendor = vendorById(input.vendorId ?? product?.vendorId ?? "");
    const categoryId = input.categoryId ?? product?.categoryId;
    return resolveCommission({
      rules: store.commissionRules,
      productId: product?.id,
      productRate: product?.commissionRate,
      vendorId: vendor?.id,
      vendorRate: vendor?.commissionRate,
      vendorPlan: vendor?.plan,
      categoryTrailIds: categoryId ? categoryTrail(store.categories, categoryId).map((category) => category.id) : [],
    }).rate;
  }

  /* --- Money --- */

  async listTransactions(filter?: { status?: Transaction["status"]; since?: string }): Promise<Transaction[]> {
    return store.transactions
      .filter((transaction) => !filter?.status || transaction.status === filter.status)
      .filter((transaction) => !filter?.since || transaction.createdAt >= filter.since);
  }

  async listPayouts(filter?: { vendorId?: string; status?: PayoutStatus }): Promise<Payout[]> {
    return store.payouts
      .filter((payout) => !filter?.vendorId || payout.vendorId === filter.vendorId)
      .filter((payout) => !filter?.status || payout.status === filter.status);
  }

  async updatePayout(id: string, patch: { status: PayoutStatus }): Promise<Payout | null> {
    const payout = store.payouts.find((entry) => entry.id === id);
    if (!payout) return null;
    payout.status = patch.status;
    if (patch.status === "paid") {
      payout.paidAt = now();
      payout.reference ??= `UTR${Date.now()}`;
    }
    return payout;
  }

  async listRefunds(filter?: { vendorId?: string; status?: RefundStatus }): Promise<Refund[]> {
    return store.refunds
      .filter((refund) => !filter?.vendorId || refund.vendorId === filter.vendorId)
      .filter((refund) => !filter?.status || refund.status === filter.status);
  }

  async updateRefund(id: string, patch: { status: RefundStatus }): Promise<Refund | null> {
    const refund = store.refunds.find((entry) => entry.id === id);
    if (!refund) return null;
    refund.status = patch.status;
    return refund;
  }

  async listDisputes(filter?: { vendorId?: string; status?: DisputeStatus }): Promise<Dispute[]> {
    return sortByDate(
      store.disputes
        .filter((dispute) => !filter?.vendorId || dispute.vendorId === filter.vendorId)
        .filter((dispute) => !filter?.status || dispute.status === filter.status),
    );
  }

  async updateDispute(id: string, patch: { status?: DisputeStatus; resolution?: string | null }): Promise<Dispute | null> {
    const dispute = store.disputes.find((entry) => entry.id === id);
    if (!dispute) return null;
    Object.assign(dispute, patch, { updatedAt: now() });
    return dispute;
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
    return [...(store.addresses.get(userId) ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }

  async createAddress(userId: string, input: Omit<Address, "id" | "userId">): Promise<Address> {
    const existing = store.addresses.get(userId) ?? [];
    const address: Address = {
      ...input,
      id: newId("adr"),
      userId,
      // The first address a customer saves is their default, whatever they ticked.
      isDefault: input.isDefault || existing.length === 0,
    };
    const next = address.isDefault ? existing.map((entry) => ({ ...entry, isDefault: false })) : [...existing];
    next.push(address);
    store.addresses.set(userId, next);
    return address;
  }

  async updateAddress(userId: string, id: string, input: Partial<Omit<Address, "id" | "userId">>): Promise<Address | null> {
    const existing = store.addresses.get(userId) ?? [];
    const index = existing.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    const updated: Address = { ...existing[index]!, ...input };
    const next = input.isDefault ? existing.map((entry) => ({ ...entry, isDefault: false })) : [...existing];
    next[index] = updated;
    store.addresses.set(userId, next);
    return updated;
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    store.addresses.set(
      userId,
      (store.addresses.get(userId) ?? []).filter((entry) => entry.id !== id),
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
      createdAt: existing?.createdAt ?? now(),
    };
    store.profiles.set(firebaseUid, profile);
    return profile;
  }
}
