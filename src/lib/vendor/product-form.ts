import { z } from "zod";

import type { AttributeDefinition, Occasion, ProductImage, Tone } from "@/lib/types";

/**
 * The seller's product form: what the browser sends and what the server
 * accepts. Shared, so the form can pre-check what the server will check.
 *
 * The form posts one JSON field (`product`) plus the new image files in the
 * order the `images` entries with `source: "new"` refer to them.
 */

export const TONES: Tone[] = ["ivory", "sand", "terracotta", "maroon", "olive", "indigo", "saffron", "rose", "charcoal", "teal"];
export const OCCASIONS: Occasion[] = ["everyday", "work", "festive", "ceremony", "wedding", "gifting", "party"];
export const TAX_RATES = [0, 3, 5, 12, 18] as const;

export const MAX_IMAGES = 10;
/** Per save, so one request stays well under the server action body limit. */
export const MAX_NEW_IMAGES_PER_SAVE = 6;
export const MAX_OPTIONS = 2;
export const MAX_VARIANTS = 60;

// `error` covers an empty box, which arrives as NaN.
const money = z
  .number({ error: "Enter a price" })
  .int("Whole rupees only")
  .min(1, "Enter a price")
  .max(10_000_000, "That price is too high");

const attributeValue = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);

const imageEntry = z.discriminatedUnion("source", [
  z.object({ source: z.literal("existing"), id: z.string().min(1), url: z.string().url().nullable(), alt: z.string().trim().max(160) }),
  z.object({ source: z.literal("new"), file: z.number().int().min(0), alt: z.string().trim().max(160) }),
]);

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Give the product a name").max(120),
    subtitle: z.string().trim().max(160),
    categoryId: z.string().min(1, "Choose a category"),
    shortDescription: z
      .string()
      .trim()
      .min(10, "Write a sentence about the product (10 characters or more)")
      .max(240, "Keep this to one sentence (240 characters)"),
    description: z.string().trim().max(5000),
    story: z.string().trim().max(2000),
    highlights: z.array(z.string().trim().min(1).max(160)).max(8, "Up to 8 highlights"),
    color: z.string().trim().max(60),
    tone: z.enum(TONES as [Tone, ...Tone[]]),
    tags: z.array(z.string().trim().min(1).max(40)).max(12, "Up to 12 tags"),
    occasions: z.array(z.enum(OCCASIONS as [Occasion, ...Occasion[]])),
    attributes: z.record(z.string(), attributeValue),
    options: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Name this option, e.g. Size").max(30),
          values: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one value").max(20),
        }),
      )
      .max(MAX_OPTIONS, `Up to ${MAX_OPTIONS} options`),
    variants: z
      .array(
        z.object({
          options: z.record(z.string(), z.string()),
          price: money,
          compareAtPrice: z.number({ error: "Enter a number" }).int().positive().nullable(),
          stockQuantity: z
            .number({ error: "Enter the stock" })
            .int("Whole numbers only")
            .min(0, "Stock cannot be negative")
            .max(100_000),
          isActive: z.boolean(),
        }),
      )
      .min(1)
      .max(MAX_VARIANTS, `Up to ${MAX_VARIANTS} combinations`),
    weightGrams: z.number({ error: "Enter a weight" }).int().positive("Enter a weight above zero").max(100_000).nullable(),
    processingDays: z.number({ error: "Enter the days to dispatch" }).int().min(0).max(60, "60 days at most"),
    taxRate: z.number().refine((rate) => (TAX_RATES as readonly number[]).includes(rate), "Choose a GST rate"),
    isActive: z.boolean(),
    images: z.array(imageEntry).max(MAX_IMAGES, `Up to ${MAX_IMAGES} images`),
  })
  .superRefine((product, context) => {
    const names = product.options.map((option) => option.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      context.addIssue({ code: "custom", path: ["options"], message: "Each option needs a different name" });
    }
    product.options.forEach((option, index) => {
      const values = option.values.map((value) => value.toLowerCase());
      if (new Set(values).size !== values.length) {
        context.addIssue({ code: "custom", path: ["options", index, "values"], message: "Values must be different" });
      }
    });

    // Every variant must be exactly one combination of the option values.
    const expected = combinations(product.options).map(comboKey);
    const actual = product.variants.map((variant) => comboKey(variant.options));
    if (expected.length !== actual.length || expected.some((key) => !actual.includes(key))) {
      context.addIssue({ code: "custom", path: ["variants"], message: "Prices and stock must cover every option combination" });
    }

    product.variants.forEach((variant, index) => {
      if (variant.compareAtPrice !== null && variant.compareAtPrice <= variant.price) {
        context.addIssue({
          code: "custom",
          path: ["variants", index, "compareAtPrice"],
          message: "The original price must be higher than the selling price",
        });
      }
    });
    if (!product.variants.some((variant) => variant.isActive)) {
      context.addIssue({ code: "custom", path: ["variants"], message: "Keep at least one option on sale" });
    }

    const newImages = product.images.filter((image) => image.source === "new").length;
    if (newImages > MAX_NEW_IMAGES_PER_SAVE) {
      context.addIssue({
        code: "custom",
        path: ["images"],
        message: `Add up to ${MAX_NEW_IMAGES_PER_SAVE} new images per save`,
      });
    }
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;
export type ProductFormImage = ProductFormInput["images"][number];

/** Every combination of option values, in a stable order. One empty combination when there are no options. */
export function combinations(options: Array<{ name: string; values: string[] }>): Array<Record<string, string>> {
  return options.reduce<Array<Record<string, string>>>(
    (combos, option) => combos.flatMap((combo) => option.values.map((value) => ({ ...combo, [option.name]: value }))),
    [{}],
  );
}

export function comboKey(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((key) => `${key.toLowerCase()}=${options[key]!.toLowerCase()}`)
    .join("|");
}

/** Category-specific details the server re-checks: required ones must be filled. */
export function missingRequiredAttributes(
  definitions: AttributeDefinition[],
  attributes: Record<string, unknown>,
): AttributeDefinition[] {
  return definitions.filter((definition) => {
    if (!definition.isRequired) return false;
    const value = attributes[definition.key];
    return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  });
}

/** Zod issues to `{ "options.0.values": message }`, first message per field. */
export function formErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

/** What the server sends back to the form after a failed save. */
export interface ProductFormState {
  message: string | null;
  errors: Record<string, string>;
}

/** The images a product already has, in the form's shape. */
export function toFormImages(images: ProductImage[]): ProductFormImage[] {
  return [...images]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .filter((image) => image.url)
    .map((image) => ({ source: "existing", id: image.id, url: image.url, alt: image.alt }));
}
