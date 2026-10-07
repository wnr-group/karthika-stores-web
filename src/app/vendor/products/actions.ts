"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertVendor, ForbiddenError } from "@/lib/auth/access";
import type { ProductInput } from "@/lib/data/repository";
import { getRepository } from "@/lib/data/repository";
import { categoryTrail, inheritedAttributes } from "@/lib/marketplace/categories";
import { ImageUploadError, uploadProductImage, validateImage } from "@/lib/supabase/storage";
import type { AttributeValue, Product, ProductImage, ProductType, ProductVariant, Vendor } from "@/lib/types";
import {
  comboKey,
  formErrors,
  missingRequiredAttributes,
  productFormSchema,
  type ProductFormState,
} from "@/lib/vendor/product-form";

/**
 * A seller's own product changes. Every action resolves the seller from the
 * session (`assertVendor`), never from the form, and refuses products that
 * belong to anyone else.
 *
 * There is no approval step: a saved product is live in the shop unless the
 * seller switches "Show in shop" off or archives it.
 */

const FALLBACK_PRODUCT_TYPE = "pt-physical";

async function ownProduct(vendor: Vendor, id: string): Promise<Product> {
  const product = await (await getRepository()).getProductById(id);
  if (!product || product.vendorId !== vendor.id) throw new ForbiddenError();
  return product;
}

/** Create (no `productId`) or update (with `productId`) a product. */
export async function saveVendorProduct(_previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const vendor = await assertVendor();
  const repository = await getRepository();

  const productId = String(formData.get("productId") ?? "") || null;
  const existing = productId ? await ownProduct(vendor, productId) : null;

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("product") ?? ""));
  } catch {
    return { message: "The form could not be read. Reload the page and try again.", errors: {} };
  }

  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { message: "Please check the highlighted fields.", errors: formErrors(parsed.error) };
  }
  const form = parsed.data;

  /* --- Category, product type and category-specific details --- */
  const [categories, productTypes, definitions] = await Promise.all([
    repository.listCategories({ kind: "product" }),
    repository.listProductTypes(),
    repository.listAttributeDefinitions(),
  ]);
  const category = categories.find((entry) => entry.id === form.categoryId);
  if (!category) return { message: "Please check the highlighted fields.", errors: { categoryId: "Choose a category" } };

  const productType = productTypeFor(category.id, categories, productTypes);
  const allowedAttributes = inheritedAttributes(categories, definitions, category.id);
  const attributes: Record<string, AttributeValue> = {};
  for (const definition of allowedAttributes) {
    const value = form.attributes[definition.key];
    if (value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
      attributes[definition.key] = value;
    }
  }
  const missing = missingRequiredAttributes(allowedAttributes, attributes);
  if (missing.length) {
    return {
      message: "Please check the highlighted fields.",
      errors: Object.fromEntries(missing.map((definition) => [`attributes.${definition.key}`, `Enter the ${definition.label.toLowerCase()}`])),
    };
  }

  /* --- Images: validate every new file before uploading any --- */
  const files = formData.getAll("newImages").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  for (const file of files) {
    const problem = validateImage(file);
    if (problem) return { message: problem, errors: { images: problem } };
  }
  if (form.images.some((image) => image.source === "new" && !files[image.file])) {
    return { message: "Some images did not arrive. Choose them again and save.", errors: { images: "Choose the images again" } };
  }

  const uploaded = new Map<number, string>();
  try {
    for (const [index, file] of files.entries()) {
      if (form.images.some((image) => image.source === "new" && image.file === index)) {
        uploaded.set(index, await uploadProductImage(file, vendor.id));
      }
    }
  } catch (error) {
    const message = error instanceof ImageUploadError ? error.message : "The images could not be uploaded. Try again.";
    return { message, errors: { images: message } };
  }

  const previousImages = new Map((existing?.images ?? []).map((image) => [image.id, image]));
  const images: ProductImage[] = form.images.flatMap((image, index) => {
    const url = image.source === "new" ? uploaded.get(image.file) : previousImages.get(image.id)?.url;
    if (!url) return [];
    return [
      {
        id: image.source === "existing" ? image.id : `img-${randomUUID().slice(0, 8)}`,
        url,
        alt: image.alt || form.name,
        kind: index === 0 ? "primary" : "gallery",
        tone: form.tone,
        displayOrder: index,
      },
    ];
  });
  // A product always has one image; with none, the tonal placeholder draws.
  if (images.length === 0) {
    images.push({ id: `img-${randomUUID().slice(0, 8)}`, url: null, alt: form.name, kind: "primary", tone: form.tone, displayOrder: 0 });
  }

  /* --- Variants: keep ids for unchanged combinations, so past orders still match --- */
  const oldVariants = new Map((existing?.variants ?? []).map((variant) => [comboKey(variant.options), variant]));
  let nextIndex = (existing?.variants.length ?? 0) + 1;
  const skuPrefix = vendor.slug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "KS";
  const skuStem = `${skuPrefix}-${Date.now().toString(36).toUpperCase()}`;

  const variants: ProductVariant[] = form.variants.map((variant, index) => {
    const previous = oldVariants.get(comboKey(variant.options));
    const values = Object.values(variant.options);
    return {
      // New products get ids from the repository; edits need them here.
      id: previous?.id ?? (existing ? `${existing.id}-v${nextIndex++}` : ""),
      sku: previous?.sku ?? `${skuStem}-${index + 1}`,
      title: values.length ? values.join(" / ") : "Default",
      options: variant.options,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      // A made-to-order or digital product does not count stock.
      stockQuantity: productType.tracksInventory ? variant.stockQuantity : 999,
      isActive: variant.isActive,
    };
  });

  const input: ProductInput = {
    vendorId: vendor.id,
    productTypeId: productType.id,
    categoryId: category.id,
    collectionIds: existing?.collectionIds ?? [],
    name: form.name,
    slug: existing?.slug ?? "",
    subtitle: form.subtitle,
    shortDescription: form.shortDescription,
    description: form.description,
    story: form.story,
    highlights: form.highlights,
    color: form.color,
    tone: form.tone,
    tags: form.tags,
    occasions: form.occasions,
    attributes,
    options: form.options,
    variants,
    customization: existing?.customization ?? null,
    fulfillmentTypes: existing?.fulfillmentTypes.length ? existing.fulfillmentTypes : productType.defaultFulfillment,
    shipping: { weightGrams: form.weightGrams, processingDays: form.processingDays },
    taxRate: form.taxRate,
    trackInventory: productType.tracksInventory,
    lowStockThreshold: existing?.lowStockThreshold ?? 2,
    // No approval step: saving publishes, but an archived product stays archived.
    status: existing?.status === "archived" ? "archived" : "approved",
    moderationNote: existing?.moderationNote ?? null,
    isFeatured: existing?.isFeatured ?? false,
    isNew: existing?.isNew ?? true,
    isActive: form.isActive,
    commissionRate: existing?.commissionRate ?? null,
    images,
    metadata: existing?.metadata ?? {},
  };

  const saved = await repository.saveProduct(input, existing?.id);

  revalidatePath("/", "layout");
  redirect(`/vendor/products?saved=${encodeURIComponent(saved.name)}`);
}

/** Takes a product out of the shop without deleting it or its order history. */
export async function archiveVendorProduct(formData: FormData) {
  const vendor = await assertVendor();
  const product = await ownProduct(vendor, String(formData.get("productId") ?? ""));
  await (await getRepository()).setProductStatus(product.id, "archived", "Archived by the seller");
  revalidatePath("/", "layout");
}

/** Puts an archived product back in the shop. */
export async function restoreVendorProduct(formData: FormData) {
  const vendor = await assertVendor();
  const product = await ownProduct(vendor, String(formData.get("productId") ?? ""));
  if (product.status !== "archived") return;
  await (await getRepository()).setProductStatus(product.id, "approved", null);
  revalidatePath("/", "layout");
}

/** The category's own default product type, else the nearest ancestor's. */
function productTypeFor(
  categoryId: string,
  categories: Parameters<typeof categoryTrail>[0],
  productTypes: ProductType[],
): ProductType {
  const trail = categoryTrail(categories, categoryId).reverse();
  const typeId = trail.find((category) => category.defaultProductTypeId)?.defaultProductTypeId ?? FALLBACK_PRODUCT_TYPE;
  return (
    productTypes.find((type) => type.id === typeId) ??
    productTypes.find((type) => type.id === FALLBACK_PRODUCT_TYPE) ??
    productTypes[0]!
  );
}
