import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
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
  ImageKind,
  Order,
  OrderStatus,
  Paginated,
  ProductImage,
  ProductQuery,
  ProductWithRelations,
  Tone,
  UserProfile,
} from "@/lib/types";

/**
 * The Supabase implementation of `Repository`.
 *
 * Selected automatically once NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set. Row shapes are translated to the domain
 * types here and nowhere else.
 *
 * Filtering, sorting and faceting reuse the same pure functions as the seed
 * repository. The catalogue is small (hundreds of pieces, not millions) and
 * the facet counts need the whole result set anyway, so one indexed read
 * beats six round trips. If the catalogue ever outgrows that, `queryProducts`
 * is the single method to push down into SQL.
 */

/* -------------------------------------------------------------------------
   Row types
   ------------------------------------------------------------------------- */

interface ProductImageRow {
  id: string;
  image_url: string | null;
  alt_text: string;
  image_type: ImageKind;
  image_tone: Tone;
  display_order: number;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  story: string;
  price: number;
  compare_at_price: number | null;
  fabric: string;
  color: string;
  tone: Tone;
  weave: string;
  craft_tags: string[];
  occasions: ProductWithRelations["occasions"];
  length_metres: number | string;
  width_metres: number | string;
  blouse_piece: string;
  care: string[];
  category_id: string;
  collection_id: string | null;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: { id: string; name: string; slug: string } | null;
  collections: { id: string; name: string; slug: string } | null;
  product_images: ProductImageRow[] | null;
}

const PRODUCT_SELECT = `
  id, name, slug, short_description, description, story, price, compare_at_price,
  fabric, color, tone, weave, craft_tags, occasions, length_metres, width_metres,
  blouse_piece, care, category_id, collection_id, stock_quantity, is_featured,
  is_new, is_active, created_at, updated_at,
  categories ( id, name, slug ),
  collections ( id, name, slug ),
  product_images ( id, image_url, alt_text, image_type, image_tone, display_order )
`;

/* -------------------------------------------------------------------------
   Mappers
   ------------------------------------------------------------------------- */

function toImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    url: row.image_url,
    alt: row.alt_text,
    kind: row.image_type,
    tone: row.image_tone,
    displayOrder: row.display_order,
  };
}

function placeholderImage(id: string, alt: string, tone: Tone): ProductImage {
  return { id, url: null, alt, kind: "primary", tone, displayOrder: 0 };
}

function toProduct(row: ProductRow): ProductWithRelations {
  const images = (row.product_images ?? [])
    .map(toImage)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    story: row.story,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    fabric: row.fabric,
    color: row.color,
    tone: row.tone,
    weave: row.weave,
    craftTags: row.craft_tags ?? [],
    occasions: row.occasions ?? [],
    lengthMetres: Number(row.length_metres),
    widthMetres: Number(row.width_metres),
    blousePiece: row.blouse_piece,
    care: row.care ?? [],
    categoryId: row.category_id,
    collectionId: row.collection_id,
    stockQuantity: row.stock_quantity,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isActive: row.is_active,
    // A product with no image rows still needs one well to render into.
    images: images.length
      ? images
      : [placeholderImage(`${row.id}-primary`, row.name, row.tone)],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.categories ?? { id: row.category_id, name: "Sarees", slug: "sarees" },
    collection: row.collections,
  };
}

interface TaxonomyRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  intro?: string | null;
  story?: string | null;
  image_url: string | null;
  image_alt: string;
  image_tone: Tone;
  display_order: number;
}

function toCategory(row: TaxonomyRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    intro: row.intro ?? undefined,
    image: {
      id: `${row.id}-img`,
      url: row.image_url,
      alt: row.image_alt || row.name,
      kind: "lifestyle",
      tone: row.image_tone,
      displayOrder: 0,
    },
    displayOrder: row.display_order,
  };
}

function toCollection(row: TaxonomyRow): Collection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    story: row.story ?? "",
    image: {
      id: `${row.id}-img`,
      url: row.image_url,
      alt: row.image_alt || row.name,
      kind: "lifestyle",
      tone: row.image_tone,
      displayOrder: 0,
    },
    displayOrder: row.display_order,
  };
}

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string;
  status: Order["status"];
  payment_status: Order["paymentStatus"];
  payment_method: Order["paymentMethod"];
  subtotal: number;
  shipping_amount: number;
  total_amount: number;
  shipping_address: Order["shippingAddress"];
  tracking_number: string | null;
  courier: string | null;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    product_id: string | null;
    name: string;
    slug: string;
    fabric: string;
    color: string;
    image_url: string | null;
    image_alt: string;
    image_tone: Tone;
    quantity: number;
    unit_price: number;
  }> | null;
}

const ORDER_SELECT = `
  id, order_number, user_id, email, phone, status, payment_status, payment_method,
  subtotal, shipping_amount, total_amount, shipping_address, tracking_number,
  courier, created_at, updated_at,
  order_items ( id, product_id, name, slug, fabric, color, image_url, image_alt,
                image_tone, quantity, unit_price )
`;

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    email: row.email,
    phone: row.phone,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    shippingAmount: row.shipping_amount,
    totalAmount: row.total_amount,
    shippingAddress: row.shipping_address,
    trackingNumber: row.tracking_number,
    courier: row.courier,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id ?? "",
      name: item.name,
      slug: item.slug,
      fabric: item.fabric,
      color: item.color,
      image: {
        id: `${item.id}-img`,
        url: item.image_url,
        alt: item.image_alt || item.name,
        kind: "primary" as const,
        tone: item.image_tone,
        displayOrder: 0,
      },
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.unit_price * item.quantity,
    })),
  };
}

interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
  };
}

/* -------------------------------------------------------------------------
   Repository
   ------------------------------------------------------------------------- */

export class SupabaseRepository implements Repository {
  private get db() {
    return getServiceClient();
  }

  /** Every active product, joined. Cached per request by React's `cache`. */
  private async allProducts(): Promise<ProductWithRelations[]> {
    const { data, error } = await this.db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true);

    if (error) throw new Error(`Failed to load products: ${error.message}`);
    return (data as unknown as ProductRow[]).map(toProduct);
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.db
      .from("categories")
      .select("*")
      .order("display_order");

    if (error) throw new Error(`Failed to load categories: ${error.message}`);
    return (data as TaxonomyRow[]).map(toCategory);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.db
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(`Failed to load category ${slug}: ${error.message}`);
    return data ? toCategory(data as TaxonomyRow) : null;
  }

  async listCollections(): Promise<Collection[]> {
    const { data, error } = await this.db
      .from("collections")
      .select("*")
      .order("display_order");

    if (error) throw new Error(`Failed to load collections: ${error.message}`);
    return (data as TaxonomyRow[]).map(toCollection);
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const { data, error } = await this.db
      .from("collections")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(`Failed to load collection ${slug}: ${error.message}`);
    return data ? toCollection(data as TaxonomyRow) : null;
  }

  async listBanners(): Promise<Banner[]> {
    const { data, error } = await this.db
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) throw new Error(`Failed to load banners: ${error.message}`);

    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      eyebrow: row.eyebrow as string,
      headline: row.headline as string,
      body: row.body as string,
      ctaLabel: row.cta_label as string,
      ctaHref: row.cta_href as string,
      secondaryLabel: (row.secondary_label as string | null) ?? null,
      secondaryHref: (row.secondary_href as string | null) ?? null,
      image: {
        id: `${row.id as string}-img`,
        url: (row.image_url as string | null) ?? null,
        alt: (row.image_alt as string) || (row.headline as string),
        kind: "primary",
        tone: row.image_tone as Tone,
        displayOrder: 0,
      },
      isActive: row.is_active as boolean,
      displayOrder: row.display_order as number,
    }));
  }

  async queryProducts(query: ProductQuery): Promise<Paginated<ProductWithRelations>> {
    const filtered = applyFilters(await this.allProducts(), query);
    return paginate(applySort(filtered, query.sort), query.page, query.perPage);
  }

  async getFacets(query: ProductQuery): Promise<FacetCounts> {
    return buildFacets(await this.allProducts(), query);
  }

  async getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
    const { data, error } = await this.db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(`Failed to load product ${slug}: ${error.message}`);
    return data ? toProduct(data as unknown as ProductRow) : null;
  }

  async getProductsByIds(ids: string[]): Promise<ProductWithRelations[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.db
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", ids);

    if (error) throw new Error(`Failed to load products: ${error.message}`);
    return (data as unknown as ProductRow[]).map(toProduct);
  }

  async getRelatedProducts(slug: string, limit = 4): Promise<ProductWithRelations[]> {
    const all = await this.allProducts();
    const product = all.find((entry) => entry.slug === slug);
    return product ? findRelated(all, product, limit) : [];
  }

  async listAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
    const { data, error } = await this.db
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true);

    if (error) throw new Error(`Failed to load slugs: ${error.message}`);
    return (data as Array<{ slug: string; updated_at: string }>).map((row) => ({
      slug: row.slug,
      updatedAt: row.updated_at,
    }));
  }

  /* --- Orders --- */

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const products = await this.getProductsByIds(input.lines.map((line) => line.productId));
    const byId = new Map(products.map((product) => [product.id, product]));

    const { data: orderRow, error: orderError } = await this.db
      .from("orders")
      .insert({
        order_number: `KAR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        user_id: input.userId,
        email: input.email,
        phone: input.phone,
        status: input.paymentStatus === "paid" ? "confirmed" : "pending",
        payment_status: input.paymentStatus,
        payment_method: input.paymentMethod,
        subtotal: input.subtotal,
        shipping_amount: input.shippingAmount,
        total_amount: input.totalAmount,
        shipping_address: input.shippingAddress,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

    const orderId = (orderRow as { id: string }).id;

    const items = input.lines.map((line) => {
      const product = byId.get(line.productId);
      if (!product) throw new Error(`Unknown product ${line.productId} on order`);
      const image = product.images[0];
      return {
        order_id: orderId,
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        fabric: product.fabric,
        color: product.color,
        image_url: image?.url ?? null,
        image_alt: image?.alt ?? product.name,
        image_tone: image?.tone ?? product.tone,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      };
    });

    const { error: itemsError } = await this.db.from("order_items").insert(items);
    if (itemsError) {
      // Never leave a headless order behind.
      await this.db.from("orders").delete().eq("id", orderId);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Order vanished immediately after creation");
    return order;
  }

  async getOrdersForUser(userId: string): Promise<Order[]> {
    const { data, error } = await this.db
      .from("orders")
      .select(ORDER_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load orders: ${error.message}`);
    return (data as unknown as OrderRow[]).map(toOrder);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Failed to load order: ${error.message}`);
    return data ? toOrder(data as unknown as OrderRow) : null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .select(ORDER_SELECT)
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error) throw new Error(`Failed to load order: ${error.message}`);
    return data ? toOrder(data as unknown as OrderRow) : null;
  }

  async updateOrder(
    id: string,
    patch: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "courier">>,
  ): Promise<Order | null> {
    const row: Record<string, unknown> = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus;
    if (patch.trackingNumber !== undefined) row.tracking_number = patch.trackingNumber;
    if (patch.courier !== undefined) row.courier = patch.courier;

    const { error } = await this.db.from("orders").update(row).eq("id", id);
    if (error) throw new Error(`Failed to update order: ${error.message}`);

    return this.getOrderById(id);
  }

  async listOrders(filter?: { status?: OrderStatus }): Promise<Order[]> {
    let request = this.db
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);

    if (filter?.status) request = request.eq("status", filter.status);

    const { data, error } = await request;
    if (error) throw new Error(`Failed to list orders: ${error.message}`);
    return (data as unknown as OrderRow[]).map(toOrder);
  }

  async commitStock(orderId: string): Promise<void> {
    // Row-locked and idempotent inside Postgres; see commit_order_stock in
    // schema.sql. A duplicate webhook returns false and changes nothing.
    const { error } = await this.db.rpc("commit_order_stock", { p_order_id: orderId });
    if (error) throw new Error(`Failed to commit stock: ${error.message}`);
  }

  /* --- Wishlist --- */

  async listWishlistProductIds(userId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load wishlist: ${error.message}`);
    return (data as Array<{ product_id: string }>).map((row) => row.product_id);
  }

  async addToWishlist(userId: string, productId: string): Promise<void> {
    const { error } = await this.db
      .from("wishlists")
      .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });

    if (error) throw new Error(`Failed to add to wishlist: ${error.message}`);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const { error } = await this.db
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) throw new Error(`Failed to remove from wishlist: ${error.message}`);
  }

  /* --- Addresses --- */

  async listAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await this.db
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load addresses: ${error.message}`);
    return (data as AddressRow[]).map(toAddress);
  }

  async createAddress(
    userId: string,
    input: Omit<Address, "id" | "userId">,
  ): Promise<Address> {
    const existing = await this.listAddresses(userId);
    const isDefault = input.isDefault || existing.length === 0;

    if (isDefault) await this.clearDefault(userId);

    const { data, error } = await this.db
      .from("addresses")
      .insert({
        user_id: userId,
        label: input.label,
        name: input.name,
        phone: input.phone,
        address_line_1: input.addressLine1,
        address_line_2: input.addressLine2,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        country: input.country,
        is_default: isDefault,
      })
      .select("*")
      .single();

    if (error) throw new Error(`Failed to save address: ${error.message}`);
    return toAddress(data as AddressRow);
  }

  async updateAddress(
    userId: string,
    id: string,
    input: Partial<Omit<Address, "id" | "userId">>,
  ): Promise<Address | null> {
    if (input.isDefault) await this.clearDefault(userId);

    const row: Record<string, unknown> = {};
    if (input.label !== undefined) row.label = input.label;
    if (input.name !== undefined) row.name = input.name;
    if (input.phone !== undefined) row.phone = input.phone;
    if (input.addressLine1 !== undefined) row.address_line_1 = input.addressLine1;
    if (input.addressLine2 !== undefined) row.address_line_2 = input.addressLine2;
    if (input.city !== undefined) row.city = input.city;
    if (input.state !== undefined) row.state = input.state;
    if (input.postalCode !== undefined) row.postal_code = input.postalCode;
    if (input.country !== undefined) row.country = input.country;
    if (input.isDefault !== undefined) row.is_default = input.isDefault;

    const { data, error } = await this.db
      .from("addresses")
      .update(row)
      .eq("id", id)
      // Scoped to the owner, so a forged id cannot touch someone else's row.
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`Failed to update address: ${error.message}`);
    return data ? toAddress(data as AddressRow) : null;
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    const { error } = await this.db
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete address: ${error.message}`);
  }

  private async clearDefault(userId: string): Promise<void> {
    await this.db
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);
  }

  /* --- Profile --- */

  async getProfile(firebaseUid: string): Promise<UserProfile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle();

    if (error) throw new Error(`Failed to load profile: ${error.message}`);
    if (!data) return null;

    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      firebaseUid: row.firebase_uid as string,
      email: row.email as string,
      displayName: (row.display_name as string | null) ?? null,
      phone: (row.phone as string | null) ?? null,
      marketingOptIn: row.marketing_opt_in as boolean,
      createdAt: row.created_at as string,
    };
  }

  async upsertProfile(
    firebaseUid: string,
    input: { email: string; displayName?: string | null; phone?: string | null },
  ): Promise<UserProfile> {
    const { error } = await this.db.from("profiles").upsert(
      {
        firebase_uid: firebaseUid,
        email: input.email,
        display_name: input.displayName ?? null,
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
      { onConflict: "firebase_uid" },
    );

    if (error) throw new Error(`Failed to save profile: ${error.message}`);

    const profile = await this.getProfile(firebaseUid);
    if (!profile) throw new Error("Profile vanished immediately after upsert");
    return profile;
  }
}
