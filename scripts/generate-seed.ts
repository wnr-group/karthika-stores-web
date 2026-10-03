// @ts-nocheck -- NOT YET PORTED: writes the pre-marketplace Supabase seed shape.
// Update together with supabase/schema.sql and supabase-repository.ts.
/**
 * Generates supabase/seed.sql from the same catalogue the storefront runs on.
 *
 *   npm run db:seed
 *
 * Keeping one source of truth means the seed data and the seed repository can
 * never drift apart, and it means the first Supabase import produces exactly
 * the marketplace you have been looking at in development.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  attributeDefinitions,
  banners,
  categories,
  collections,
  products,
  serviceCategories,
  services,
  vendors,
} from "../src/lib/data/catalog";

/* -------------------------------------------------------------------------
   SQL literals
   ------------------------------------------------------------------------- */

function text(value: string | null | undefined): string {
  if (value === null || value === undefined) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function bool(value: boolean): string {
  return value ? "true" : "false";
}

function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "null" : String(value);
}

function textArray(values: readonly string[]): string {
  if (values.length === 0) return "'{}'";
  const inner = values.map((value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `'{${inner.join(",")}}'`;
}

function enumArray(values: readonly string[], type: string): string {
  if (values.length === 0) return `'{}'::${type}[]`;
  return `'{${values.join(",")}}'::${type}[]`;
}

function jsonb(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

/* -------------------------------------------------------------------------
   Statements
   ------------------------------------------------------------------------- */

const lines: string[] = [
  "-- =============================================================================",
  "-- Karthika marketplace - seed data",
  "--",
  "-- GENERATED FILE. Do not edit by hand: run `npm run db:seed` instead, which",
  "-- regenerates it from src/lib/data/catalog.ts.",
  "--",
  "-- Run after schema.sql and policies.sql. Safe to re-run: every insert is an",
  "-- upsert on the primary key.",
  "--",
  "-- Image URLs are null throughout for the demo jewellery listing and every",
  "-- service; the storefront draws its woven placeholder in image_tone until",
  "-- photography is uploaded to the product-images / category-images buckets.",
  "-- =============================================================================",
  "",
  "begin;",
  "",
];

lines.push("-- Vendors ----------------------------------------------------------------------");
for (const vendor of vendors) {
  lines.push(
    `insert into vendors (id, slug, name, tagline, description, logo_url, cover_image_url, location_city, location_state, contact_email, contact_phone, status, commission_rate, rating, rating_count, is_featured, created_at, updated_at) values (` +
      [
        text(vendor.id),
        text(vendor.slug),
        text(vendor.name),
        text(vendor.tagline),
        text(vendor.description),
        text(vendor.logoUrl),
        text(vendor.coverImageUrl),
        text(vendor.locationCity),
        text(vendor.locationState),
        text(vendor.contactEmail),
        text(vendor.contactPhone),
        `'${vendor.status}'`,
        num(vendor.commissionRate),
        String(vendor.rating),
        String(vendor.ratingCount),
        bool(vendor.isFeatured),
        text(vendor.createdAt),
        text(vendor.updatedAt),
      ].join(", ") +
      `)\non conflict (id) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description, status = excluded.status, commission_rate = excluded.commission_rate, rating = excluded.rating, rating_count = excluded.rating_count, is_featured = excluded.is_featured, updated_at = excluded.updated_at;`,
  );
}
lines.push("");

lines.push("-- Categories (product and service trees share one table) -----------------------");
for (const category of [...categories, ...serviceCategories]) {
  lines.push(
    `insert into categories (id, parent_id, kind, name, slug, description, intro, image_url, image_alt, image_tone, display_order) values (` +
      [
        text(category.id),
        text(category.parentId),
        `'${category.kind}'`,
        text(category.name),
        text(category.slug),
        text(category.description),
        text(category.intro ?? null),
        text(category.image.url),
        text(category.image.alt),
        `'${category.image.tone}'`,
        String(category.displayOrder),
      ].join(", ") +
      `)\non conflict (id) do update set parent_id = excluded.parent_id, kind = excluded.kind, name = excluded.name, slug = excluded.slug, description = excluded.description, intro = excluded.intro, image_alt = excluded.image_alt, image_tone = excluded.image_tone, display_order = excluded.display_order;`,
  );
}
lines.push("");

lines.push("-- Attribute definitions ----------------------------------------------------------");
for (const attribute of attributeDefinitions) {
  lines.push(
    `insert into attribute_definitions (id, category_id, key, label, input_type, options, unit, is_required, is_filterable, display_order) values (` +
      [
        text(attribute.id),
        text(attribute.categoryId),
        text(attribute.key),
        text(attribute.label),
        `'${attribute.inputType}'`,
        attribute.options ? jsonb(attribute.options) : "null",
        text(attribute.unit),
        bool(attribute.isRequired),
        bool(attribute.isFilterable),
        String(attribute.displayOrder),
      ].join(", ") +
      `)\non conflict (id) do update set label = excluded.label, input_type = excluded.input_type, options = excluded.options, unit = excluded.unit, is_required = excluded.is_required, is_filterable = excluded.is_filterable, display_order = excluded.display_order;`,
  );
}
lines.push("");

lines.push("-- Collections ----------------------------------------------------------------");
for (const collection of collections) {
  lines.push(
    `insert into collections (id, name, slug, description, story, image_url, image_alt, image_tone, display_order) values (` +
      [
        text(collection.id),
        text(collection.name),
        text(collection.slug),
        text(collection.description),
        text(collection.story),
        text(collection.image.url),
        text(collection.image.alt),
        `'${collection.image.tone}'`,
        String(collection.displayOrder),
      ].join(", ") +
      `)\non conflict (id) do update set name = excluded.name, slug = excluded.slug, description = excluded.description, story = excluded.story, image_alt = excluded.image_alt, image_tone = excluded.image_tone, display_order = excluded.display_order;`,
  );
}
lines.push("");

lines.push("-- Products -------------------------------------------------------------------");
for (const product of products) {
  lines.push(
    `insert into products (id, vendor_id, name, slug, short_description, subtitle, description, story, price, compare_at_price, color, tone, tags, occasions, attributes, fulfillment_type, category_id, collection_id, stock_quantity, is_featured, is_new, is_active, commission_rate, created_at, updated_at) values (` +
      [
        text(product.id),
        text(product.vendorId),
        text(product.name),
        text(product.slug),
        text(product.shortDescription),
        text(product.subtitle),
        text(product.description),
        text(product.story),
        String(product.price),
        product.compareAtPrice === null ? "null" : String(product.compareAtPrice),
        text(product.color),
        `'${product.tone}'`,
        textArray(product.tags),
        enumArray(product.occasions, "occasion"),
        jsonb(product.attributes),
        `'${product.fulfillmentType}'`,
        text(product.categoryId),
        text(product.collectionId),
        String(product.stockQuantity),
        bool(product.isFeatured),
        bool(product.isNew),
        bool(product.isActive),
        num(product.commissionRate),
        text(product.createdAt),
        text(product.updatedAt),
      ].join(", ") +
      `)\non conflict (id) do update set vendor_id = excluded.vendor_id, name = excluded.name, slug = excluded.slug, short_description = excluded.short_description, subtitle = excluded.subtitle, description = excluded.description, story = excluded.story, price = excluded.price, compare_at_price = excluded.compare_at_price, color = excluded.color, tone = excluded.tone, tags = excluded.tags, occasions = excluded.occasions, attributes = excluded.attributes, fulfillment_type = excluded.fulfillment_type, category_id = excluded.category_id, collection_id = excluded.collection_id, stock_quantity = excluded.stock_quantity, is_featured = excluded.is_featured, is_new = excluded.is_new, is_active = excluded.is_active, commission_rate = excluded.commission_rate;`,
  );
}
lines.push("");

lines.push("-- Product images -------------------------------------------------------------");
for (const product of products) {
  for (const image of product.images) {
    lines.push(
      `insert into product_images (id, product_id, image_url, alt_text, image_type, image_tone, display_order) values (` +
        [
          text(image.id),
          text(product.id),
          text(image.url),
          text(image.alt),
          `'${image.kind}'`,
          `'${image.tone}'`,
          String(image.displayOrder),
        ].join(", ") +
        `)\non conflict (id) do update set alt_text = excluded.alt_text, image_type = excluded.image_type, image_tone = excluded.image_tone, display_order = excluded.display_order;`,
    );
  }
}
lines.push("");

lines.push("-- Services ---------------------------------------------------------------------");
for (const service of services) {
  lines.push(
    `insert into services (id, vendor_id, category_id, name, slug, description, price, price_unit, duration_minutes, location_city, service_area, booking_rules, addons, cancellation_policy, is_active, created_at, updated_at) values (` +
      [
        text(service.id),
        text(service.vendorId),
        text(service.categoryId),
        text(service.name),
        text(service.slug),
        text(service.description),
        String(service.price),
        `'${service.priceUnit}'`,
        num(service.durationMinutes),
        text(service.locationCity),
        textArray(service.serviceArea),
        jsonb(service.bookingRules),
        jsonb(service.addons),
        text(service.cancellationPolicy),
        bool(service.isActive),
        text(service.createdAt),
        text(service.updatedAt),
      ].join(", ") +
      `)\non conflict (id) do update set name = excluded.name, description = excluded.description, price = excluded.price, price_unit = excluded.price_unit, duration_minutes = excluded.duration_minutes, location_city = excluded.location_city, service_area = excluded.service_area, booking_rules = excluded.booking_rules, addons = excluded.addons, cancellation_policy = excluded.cancellation_policy, is_active = excluded.is_active;`,
  );
}
lines.push("");

lines.push("-- Service images -----------------------------------------------------------------");
for (const service of services) {
  for (const image of service.images) {
    lines.push(
      `insert into service_images (id, service_id, image_url, alt_text, image_type, image_tone, display_order) values (` +
        [
          text(image.id),
          text(service.id),
          text(image.url),
          text(image.alt),
          `'${image.kind}'`,
          `'${image.tone}'`,
          String(image.displayOrder),
        ].join(", ") +
        `)\non conflict (id) do update set alt_text = excluded.alt_text, image_type = excluded.image_type, image_tone = excluded.image_tone, display_order = excluded.display_order;`,
    );
  }
}
lines.push("");

lines.push("-- Banners --------------------------------------------------------------------");
for (const banner of banners) {
  lines.push(
    `insert into banners (id, eyebrow, headline, body, cta_label, cta_href, secondary_label, secondary_href, image_url, image_alt, image_tone, is_active, display_order) values (` +
      [
        text(banner.id),
        text(banner.eyebrow),
        text(banner.headline),
        text(banner.body),
        text(banner.ctaLabel),
        text(banner.ctaHref),
        text(banner.secondaryLabel),
        text(banner.secondaryHref),
        text(banner.image.url),
        text(banner.image.alt),
        `'${banner.image.tone}'`,
        bool(banner.isActive),
        String(banner.displayOrder),
      ].join(", ") +
      `)\non conflict (id) do update set eyebrow = excluded.eyebrow, headline = excluded.headline, body = excluded.body, cta_label = excluded.cta_label, cta_href = excluded.cta_href, secondary_label = excluded.secondary_label, secondary_href = excluded.secondary_href, image_alt = excluded.image_alt, image_tone = excluded.image_tone, is_active = excluded.is_active, display_order = excluded.display_order;`,
  );
}

lines.push("");
lines.push("commit;");
lines.push("");

const target = resolve(process.cwd(), "supabase/seed.sql");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, lines.join("\n"), "utf8");

console.log(
  `Wrote supabase/seed.sql: ${vendors.length} vendors, ${categories.length + serviceCategories.length} categories, ` +
    `${attributeDefinitions.length} attribute definitions, ${collections.length} collections, ` +
    `${products.length} products, ${products.reduce((total, product) => total + product.images.length, 0)} product images, ` +
    `${services.length} services, ${banners.length} banners.`,
);
