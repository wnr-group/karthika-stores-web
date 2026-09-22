/**
 * Generates supabase/seed.sql from the same catalogue the storefront runs on.
 *
 *   npm run db:seed
 *
 * Keeping one source of truth means the seed data and the seed repository can
 * never drift apart, and it means the first Supabase import produces exactly
 * the shop you have been looking at in development.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { banners, categories, collections, products } from "../src/lib/data/catalog";

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

function textArray(values: readonly string[]): string {
  if (values.length === 0) return "'{}'";
  const inner = values.map((value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `'{${inner.join(",")}}'`;
}

function enumArray(values: readonly string[], type: string): string {
  if (values.length === 0) return `'{}'::${type}[]`;
  return `'{${values.join(",")}}'::${type}[]`;
}

/* -------------------------------------------------------------------------
   Statements
   ------------------------------------------------------------------------- */

const lines: string[] = [
  "-- =============================================================================",
  "-- Karthika - seed data",
  "--",
  "-- GENERATED FILE. Do not edit by hand: run `npm run db:seed` instead, which",
  "-- regenerates it from src/lib/data/catalog.ts.",
  "--",
  "-- Run after schema.sql and policies.sql. Safe to re-run: every insert is an",
  "-- upsert on the primary key.",
  "--",
  "-- Image URLs are null throughout. Upload photography to the product-images",
  "-- and category-images buckets, then update the matching image_url column and",
  "-- it renders immediately; until then the storefront draws its woven",
  "-- placeholder in image_tone.",
  "-- =============================================================================",
  "",
  "begin;",
  "",
];

lines.push("-- Categories -----------------------------------------------------------------");
for (const category of categories) {
  lines.push(
    `insert into categories (id, name, slug, description, intro, image_url, image_alt, image_tone, display_order) values (` +
      [
        text(category.id),
        text(category.name),
        text(category.slug),
        text(category.description),
        text(category.intro ?? null),
        text(category.image.url),
        text(category.image.alt),
        `'${category.image.tone}'`,
        String(category.displayOrder),
      ].join(", ") +
      `)\non conflict (id) do update set name = excluded.name, slug = excluded.slug, description = excluded.description, intro = excluded.intro, image_alt = excluded.image_alt, image_tone = excluded.image_tone, display_order = excluded.display_order;`,
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
    `insert into products (id, name, slug, short_description, description, story, price, compare_at_price, fabric, color, tone, weave, craft_tags, occasions, length_metres, width_metres, blouse_piece, care, category_id, collection_id, stock_quantity, is_featured, is_new, is_active, created_at, updated_at) values (` +
      [
        text(product.id),
        text(product.name),
        text(product.slug),
        text(product.shortDescription),
        text(product.description),
        text(product.story),
        String(product.price),
        product.compareAtPrice === null ? "null" : String(product.compareAtPrice),
        text(product.fabric),
        text(product.color),
        `'${product.tone}'`,
        text(product.weave),
        textArray(product.craftTags),
        enumArray(product.occasions, "occasion"),
        String(product.lengthMetres),
        String(product.widthMetres),
        text(product.blousePiece),
        textArray(product.care),
        text(product.categoryId),
        text(product.collectionId),
        String(product.stockQuantity),
        bool(product.isFeatured),
        bool(product.isNew),
        bool(product.isActive),
        text(product.createdAt),
        text(product.updatedAt),
      ].join(", ") +
      `)\non conflict (id) do update set name = excluded.name, slug = excluded.slug, short_description = excluded.short_description, description = excluded.description, story = excluded.story, price = excluded.price, compare_at_price = excluded.compare_at_price, fabric = excluded.fabric, color = excluded.color, tone = excluded.tone, weave = excluded.weave, craft_tags = excluded.craft_tags, occasions = excluded.occasions, blouse_piece = excluded.blouse_piece, care = excluded.care, category_id = excluded.category_id, collection_id = excluded.collection_id, stock_quantity = excluded.stock_quantity, is_featured = excluded.is_featured, is_new = excluded.is_new, is_active = excluded.is_active;`,
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
  `Wrote supabase/seed.sql: ${categories.length} categories, ${collections.length} collections, ` +
    `${products.length} products, ${products.reduce((total, product) => total + product.images.length, 0)} images, ` +
    `${banners.length} banners.`,
);
