"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";

import { saveVendorProduct } from "@/app/vendor/products/actions";
import { Field } from "@/components/ui/primitives";
import { occasionLabel, TONE_LABELS } from "@/lib/data/filters";
import type { AttributeDefinition, AttributeValue, Product } from "@/lib/types";
import {
  combinations,
  comboKey,
  formErrors,
  MAX_IMAGES,
  MAX_NEW_IMAGES_PER_SAVE,
  MAX_OPTIONS,
  missingRequiredAttributes,
  OCCASIONS,
  productFormSchema,
  TAX_RATES,
  toFormImages,
  TONES,
  type ProductFormInput,
  type ProductFormState,
} from "@/lib/vendor/product-form";
import type { CategoryChoice } from "@/lib/vendor/product-form-options";

/**
 * The seller's add / edit product form.
 *
 * Everything is held as strings while the seller types and converted once on
 * save, so a half-typed price never fights the input. The form checks itself
 * with the same schema the server uses, then posts the product as JSON plus
 * the new image files.
 */

type PriceRow = { price: string; compareAt: string; stock: string; isActive: boolean };
type OptionDraft = { name: string; values: string };
type ImageDraft =
  | { key: string; source: "existing"; id: string; url: string | null; alt: string }
  | { key: string; source: "new"; file: File; preview: string; alt: string };

const EMPTY_ROW: PriceRow = { price: "", compareAt: "", stock: "", isActive: true };
const INITIAL_STATE: ProductFormState = { message: null, errors: {} };

const splitList = (text: string, separator: RegExp) =>
  text
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean);

const toNumber = (text: string): number => (text.trim() === "" ? Number.NaN : Number(text));

export function VendorProductForm({
  categories,
  product,
}: {
  categories: CategoryChoice[];
  /** Present when editing. */
  product?: Product;
}) {
  const [serverState, formAction, saving] = useActionState(saveVendorProduct, INITIAL_STATE);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  /* --- Details --- */
  const [name, setName] = useState(product?.name ?? "");
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [story, setStory] = useState(product?.story ?? "");
  const [highlights, setHighlights] = useState((product?.highlights ?? []).join("\n"));
  const [color, setColor] = useState(product?.color ?? "");
  const [tone, setTone] = useState<ProductFormInput["tone"]>(product?.tone ?? "sand");
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [occasions, setOccasions] = useState<ProductFormInput["occasions"]>(product?.occasions ?? []);
  const [attributes, setAttributes] = useState<Record<string, AttributeValue>>(product?.attributes ?? {});

  /* --- Pricing, options and stock --- */
  const [options, setOptions] = useState<OptionDraft[]>(
    (product?.options ?? []).map((option) => ({ name: option.name, values: option.values.join(", ") })),
  );
  const [rows, setRows] = useState<Record<string, PriceRow>>(() =>
    Object.fromEntries(
      (product?.variants ?? []).map((variant) => [
        comboKey(variant.options),
        {
          price: String(variant.price),
          compareAt: variant.compareAtPrice ? String(variant.compareAtPrice) : "",
          stock: String(variant.stockQuantity),
          isActive: variant.isActive,
        },
      ]),
    ),
  );

  /* --- Shipping and visibility --- */
  const [weight, setWeight] = useState(product?.shipping.weightGrams ? String(product.shipping.weightGrams) : "");
  const [processingDays, setProcessingDays] = useState(String(product?.shipping.processingDays ?? 2));
  const [taxRate, setTaxRate] = useState(String(product?.taxRate ?? 5));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  /* --- Images --- */
  const [images, setImages] = useState<ImageDraft[]>(() =>
    toFormImages(product?.images ?? []).flatMap((image) =>
      image.source === "existing" ? [{ ...image, key: image.id }] : [],
    ),
  );
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the in-memory previews of new images when they go away.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const live = new Set(images.flatMap((image) => (image.source === "new" ? [image.preview] : [])));
    for (const url of previews.current) if (!live.has(url)) URL.revokeObjectURL(url);
    previews.current = live;
  }, [images]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const category = categories.find((entry) => entry.id === categoryId);
  const tracksInventory = category?.tracksInventory ?? true;

  const parsedOptions = useMemo(
    () =>
      options.map((option) => ({ name: option.name.trim(), values: [...new Set(splitList(option.values, /,/))] })),
    [options],
  );
  const combos = useMemo(
    () => combinations(parsedOptions.filter((option) => option.name && option.values.length)),
    [parsedOptions],
  );

  const errors = { ...serverState.errors, ...clientErrors };
  const message = clientMessage ?? serverState.message;

  // Show the message after a failed server save.
  useEffect(() => {
    if (serverState.message) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [serverState]);

  function row(key: string): PriceRow {
    return rows[key] ?? EMPTY_ROW;
  }

  function setRow(key: string, patch: Partial<PriceRow>) {
    setRows((current) => ({ ...current, [key]: { ...(current[key] ?? EMPTY_ROW), ...patch } }));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_IMAGES - images.length;
    const added = [...list].slice(0, Math.max(0, room)).map<ImageDraft>((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
      source: "new",
      file,
      preview: URL.createObjectURL(file),
      alt: "",
    }));
    setImages((current) => [...current, ...added]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function moveImage(index: number, by: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const newFiles: File[] = [];
    const payload = {
      name,
      subtitle,
      categoryId,
      shortDescription,
      description,
      story,
      highlights: splitList(highlights, /\n/),
      color,
      tone,
      tags: splitList(tags, /,/),
      occasions,
      attributes: Object.fromEntries(
        (category?.attributes ?? []).flatMap((definition) => {
          let value = attributes[definition.key];
          if (Array.isArray(value)) value = value.map((entry) => entry.trim()).filter(Boolean);
          if (definition.inputType === "number" && typeof value === "string") value = Number.parseFloat(value);
          const empty =
            value === undefined ||
            value === "" ||
            (typeof value === "number" && Number.isNaN(value)) ||
            (Array.isArray(value) && value.length === 0);
          return empty ? [] : [[definition.key, value]];
        }),
      ),
      options: parsedOptions.filter((option) => option.name || option.values.length),
      variants: combos.map((combo) => {
        const values = row(comboKey(combo));
        return {
          options: combo,
          price: toNumber(values.price),
          compareAtPrice: values.compareAt.trim() ? toNumber(values.compareAt) : null,
          stockQuantity: tracksInventory ? toNumber(values.stock) : 999,
          isActive: values.isActive,
        };
      }),
      weightGrams: weight.trim() ? toNumber(weight) : null,
      processingDays: toNumber(processingDays),
      taxRate: Number(taxRate),
      isActive,
      images: images.map((image) =>
        image.source === "existing"
          ? { source: "existing" as const, id: image.id, url: image.url, alt: image.alt }
          : { source: "new" as const, file: newFiles.push(image.file) - 1, alt: image.alt },
      ),
    };

    const checked = productFormSchema.safeParse(payload);
    const missing = missingRequiredAttributes(category?.attributes ?? [], payload.attributes);
    if (!checked.success || missing.length) {
      setClientErrors({
        ...(checked.success ? {} : formErrors(checked.error)),
        ...Object.fromEntries(missing.map((definition) => [`attributes.${definition.key}`, `Enter the ${definition.label.toLowerCase()}`])),
      });
      setClientMessage("Please check the highlighted fields.");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setClientErrors({});
    setClientMessage(null);
    const formData = new FormData();
    if (product) formData.set("productId", product.id);
    formData.set("product", JSON.stringify(checked.data));
    newFiles.forEach((file) => formData.append("newImages", file));
    startTransition(() => formAction(formData));
  }

  const variantError =
    errors.variants ??
    Object.entries(errors).find(([key]) => key.startsWith("variants."))?.[1] ??
    null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-12">
      <div ref={topRef} className="scroll-mt-28">
        {message ? (
          <p role="alert" className="border border-danger/40 bg-danger/5 px-4 py-3 text-[0.8125rem] text-danger">
            {message}
          </p>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- Details */}
      <Section title="Details">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Product name" htmlFor="name" error={errors.name} className="sm:col-span-2">
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Subtitle" htmlFor="subtitle" hint="Under the name, e.g. “925 sterling silver, set of two”" error={errors.subtitle} className="sm:col-span-2">
            <input id="subtitle" className="field" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={160} />
          </Field>
          <Field label="Category" htmlFor="categoryId" error={errors.categoryId} className="sm:col-span-2">
            <select id="categoryId" className="field cursor-pointer" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Choose a category</option>
              {categories.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Short description" htmlFor="shortDescription" hint="One sentence, shown on cards and in the bag" error={errors.shortDescription} className="sm:col-span-2">
            <input id="shortDescription" className="field" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={240} />
          </Field>
          <Field label="Description" htmlFor="description" hint="Leave a blank line between paragraphs" error={errors.description} className="sm:col-span-2">
            <textarea id="description" rows={5} className="field resize-y" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
          </Field>
          <Field label="About the maker (optional)" htmlFor="story" error={errors.story} className="sm:col-span-2">
            <textarea id="story" rows={3} className="field resize-y" value={story} onChange={(e) => setStory(e.target.value)} maxLength={2000} />
          </Field>
          <Field label="Highlights" htmlFor="highlights" hint="One per line, up to 8" error={errors.highlights ?? errors["highlights.0"]} className="sm:col-span-2">
            <textarea id="highlights" rows={3} className="field resize-y" value={highlights} onChange={(e) => setHighlights(e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ---------------------------------------------- Category-specific details */}
      {category && category.attributes.length > 0 ? (
        <Section title="Product details" hint="These also power the shop's filters for this category.">
          <div className="grid gap-6 sm:grid-cols-2">
            {category.attributes.map((definition) => (
              <AttributeInput
                key={definition.key}
                definition={definition}
                value={attributes[definition.key]}
                error={errors[`attributes.${definition.key}`]}
                onChange={(value) =>
                  setAttributes((current) => {
                    const next = { ...current };
                    if (value === undefined) delete next[definition.key];
                    else next[definition.key] = value;
                    return next;
                  })
                }
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* ---------------------------------------------- Pricing and stock */}
      <Section
        title="Price and stock"
        hint={tracksInventory ? undefined : "This category is made to order, so stock is not counted."}
      >
        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={index} className="grid gap-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
              <Field label={`Option ${index + 1}`} htmlFor={`option-name-${index}`} error={errors[`options.${index}.name`]}>
                <input
                  id={`option-name-${index}`}
                  className="field"
                  placeholder="e.g. Size"
                  value={option.name}
                  onChange={(e) => setOptions((current) => current.map((entry, i) => (i === index ? { ...entry, name: e.target.value } : entry)))}
                />
              </Field>
              <Field label="Values" htmlFor={`option-values-${index}`} hint="Separate with commas, e.g. S, M, L" error={errors[`options.${index}.values`]}>
                <input
                  id={`option-values-${index}`}
                  className="field"
                  value={option.values}
                  onChange={(e) => setOptions((current) => current.map((entry, i) => (i === index ? { ...entry, values: e.target.value } : entry)))}
                />
              </Field>
              <button
                type="button"
                onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                className="pb-2.5 text-left text-[0.75rem] text-taupe underline-offset-4 hover:text-danger hover:underline"
              >
                Remove option
              </button>
            </div>
          ))}
          {errors.options ? <p className="text-[0.6875rem] text-danger">{errors.options}</p> : null}

          {category?.supportsVariants !== false && options.length < MAX_OPTIONS ? (
            <button
              type="button"
              onClick={() => setOptions((current) => [...current, { name: "", values: "" }])}
              className="text-[0.75rem] uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline"
            >
              + Add an option (size, colour…)
            </button>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-stone text-[0.625rem] uppercase tracking-[0.14em] text-taupe">
                  {combos[0] && Object.keys(combos[0]).length ? <th className="py-2 pr-3 font-normal">Option</th> : null}
                  <th className="py-2 pr-3 font-normal">Price (₹)</th>
                  <th className="py-2 pr-3 font-normal">Original price (₹)</th>
                  {tracksInventory ? <th className="py-2 pr-3 font-normal">Stock</th> : null}
                  <th className="py-2 font-normal">On sale</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo, index) => {
                  const key = comboKey(combo);
                  const values = row(key);
                  const label = Object.values(combo).join(" / ");
                  const rowError = (field: string) => errors[`variants.${index}.${field}`];
                  return (
                    <tr key={key} className="border-b border-stone-soft align-top">
                      {label ? <td className="py-2.5 pr-3 text-ink">{label}</td> : null}
                      <td className="py-1 pr-3">
                        <input
                          aria-label={`Price${label ? ` for ${label}` : ""}`}
                          inputMode="numeric"
                          className="field tnum"
                          value={values.price}
                          onChange={(e) => setRow(key, { price: e.target.value.replace(/[^\d]/g, "") })}
                        />
                        {rowError("price") ? <p className="mt-1 text-[0.6875rem] text-danger">{rowError("price")}</p> : null}
                      </td>
                      <td className="py-1 pr-3">
                        <input
                          aria-label={`Original price${label ? ` for ${label}` : ""}, for showing a discount`}
                          inputMode="numeric"
                          placeholder="Optional"
                          className="field tnum"
                          value={values.compareAt}
                          onChange={(e) => setRow(key, { compareAt: e.target.value.replace(/[^\d]/g, "") })}
                        />
                        {rowError("compareAtPrice") ? <p className="mt-1 text-[0.6875rem] text-danger">{rowError("compareAtPrice")}</p> : null}
                      </td>
                      {tracksInventory ? (
                        <td className="py-1 pr-3">
                          <input
                            aria-label={`Stock${label ? ` for ${label}` : ""}`}
                            inputMode="numeric"
                            className="field tnum"
                            value={values.stock}
                            onChange={(e) => setRow(key, { stock: e.target.value.replace(/[^\d]/g, "") })}
                          />
                          {rowError("stockQuantity") ? <p className="mt-1 text-[0.6875rem] text-danger">{rowError("stockQuantity")}</p> : null}
                        </td>
                      ) : null}
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`${label || "This product"} is on sale`}
                          checked={values.isActive}
                          onChange={(e) => setRow(key, { isActive: e.target.checked })}
                          className="h-4 w-4 accent-[var(--color-forest)]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {variantError ? <p className="text-[0.6875rem] text-danger">{variantError}</p> : null}
        </div>
      </Section>

      {/* ---------------------------------------------- Images */}
      <Section title="Images" hint={`Up to ${MAX_IMAGES}. The first image is the main one. JPG, PNG, WebP or AVIF, 5 MB each.`}>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.key} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden bg-shell">
                {/* A plain img: previews are blob: URLs, which next/image cannot load. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.source === "new" ? image.preview : (image.url ?? "")}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 bg-paper/95 px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] text-ink">
                    Main
                  </span>
                ) : null}
                {image.source === "new" ? (
                  <span className="absolute right-2 top-2 bg-forest px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] text-paper">
                    New
                  </span>
                ) : null}
              </div>
              <input
                aria-label={`Image ${index + 1} description`}
                placeholder="Describe the image"
                className="field text-[0.8125rem]"
                value={image.alt}
                maxLength={160}
                onChange={(e) => setImages((current) => current.map((entry) => (entry.key === image.key ? { ...entry, alt: e.target.value } : entry)))}
              />
              <div className="flex items-center justify-between text-[0.6875rem] text-taupe">
                <span className="flex gap-3">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="hover:text-ink disabled:opacity-30" aria-label={`Move image ${index + 1} earlier`}>
                    ← Earlier
                  </button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="hover:text-ink disabled:opacity-30" aria-label={`Move image ${index + 1} later`}>
                    Later →
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((entry) => entry.key !== image.key))}
                  className="hover:text-danger"
                  aria-label={`Remove image ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {images.length < MAX_IMAGES ? (
          <label className="mt-4 inline-flex cursor-pointer items-center rounded-full border border-stone px-4 py-2 text-[0.75rem] text-ink transition-colors hover:border-ink">
            + Add images
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        ) : null}
        <p className="mt-2 text-[0.6875rem] text-taupe">
          Up to {MAX_NEW_IMAGES_PER_SAVE} new images per save. Without any image, the shop shows a plain placeholder.
        </p>
        {errors.images ? <p className="mt-2 text-[0.6875rem] text-danger">{errors.images}</p> : null}
      </Section>

      {/* ---------------------------------------------- Colour, tags, occasions */}
      <Section title="How shoppers find it">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Colour name" htmlFor="color" hint="e.g. Oxidised silver" error={errors.color}>
            <input id="color" className="field" value={color} onChange={(e) => setColor(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Colour filter" htmlFor="tone" hint="The colour group shoppers filter by" error={errors.tone}>
            <select id="tone" className="field cursor-pointer" value={tone} onChange={(e) => setTone(e.target.value as ProductFormInput["tone"])}>
              {TONES.map((value) => (
                <option key={value} value={value}>
                  {TONE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tags" htmlFor="tags" hint="Separate with commas, up to 12" error={errors.tags} className="sm:col-span-2">
            <input id="tags" className="field" value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="field-label">Occasions</legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {OCCASIONS.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-[0.8125rem] text-graphite">
                  <input
                    type="checkbox"
                    checked={occasions.includes(value)}
                    onChange={(e) =>
                      setOccasions((current) => (e.target.checked ? [...current, value] : current.filter((entry) => entry !== value)))
                    }
                    className="h-4 w-4 accent-[var(--color-forest)]"
                  />
                  {occasionLabel(value)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      {/* ---------------------------------------------- Shipping and visibility */}
      <Section title="Shipping and tax">
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Packed weight (grams)" htmlFor="weight" error={errors.weightGrams}>
            <input id="weight" inputMode="numeric" className="field tnum" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d]/g, ""))} />
          </Field>
          <Field label="Days to dispatch" htmlFor="processingDays" error={errors.processingDays}>
            <input id="processingDays" inputMode="numeric" className="field tnum" value={processingDays} onChange={(e) => setProcessingDays(e.target.value.replace(/[^\d]/g, ""))} />
          </Field>
          <Field label="GST rate" htmlFor="taxRate" hint="Prices include GST" error={errors.taxRate}>
            <select id="taxRate" className="field cursor-pointer" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}>
              {TAX_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <div className="flex flex-col gap-4 border-t border-stone pt-6 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-[0.875rem] text-ink">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[var(--color-forest)]" />
          Show in shop
          <span className="text-[0.75rem] text-taupe">(goes live as soon as you save)</span>
        </label>
        <div className="flex items-center gap-3">
          <Link href="/vendor/products" className="px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.14em] text-taupe hover:text-ink">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-full bg-forest px-7 text-[0.75rem] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-forest-soft disabled:opacity-60"
          >
            {saving ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-6 border-b border-stone pb-3">
        <h3 className="font-display text-[1.25rem] text-ink">{title}</h3>
        {hint ? <p className="mt-1 text-[0.75rem] text-taupe">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** One category-specific detail, drawn to match its definition. */
function AttributeInput({
  definition,
  value,
  error,
  onChange,
}: {
  definition: AttributeDefinition;
  value: AttributeValue | undefined;
  error?: string;
  onChange: (value: AttributeValue | undefined) => void;
}) {
  const id = `attr-${definition.key}`;
  const label = `${definition.label}${definition.unit ? ` (${definition.unit})` : ""}${definition.isRequired ? "" : " (optional)"}`;

  if (definition.inputType === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-[0.8125rem] text-graphite">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-forest)]" />
        {definition.label}
      </label>
    );
  }

  if (definition.inputType === "select" && definition.options?.length) {
    return (
      <Field label={label} htmlFor={id} error={error}>
        <select id={id} className="field cursor-pointer" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Not set</option>
          {definition.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (definition.inputType === "multiselect" && definition.options?.length) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="sm:col-span-2">
        <legend className="field-label">{label}</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {definition.options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-[0.8125rem] text-graphite">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, option.value] : selected.filter((entry) => entry !== option.value))
                }
                className="h-4 w-4 accent-[var(--color-forest)]"
              />
              {option.label}
            </label>
          ))}
        </div>
        {error ? <p className="mt-1.5 text-[0.6875rem] text-danger">{error}</p> : null}
      </fieldset>
    );
  }

  if (definition.inputType === "multiselect") {
    // No fixed choices (e.g. care instructions): one per line.
    const text = Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
    return (
      <Field label={label} htmlFor={id} hint="One per line" error={error} className="sm:col-span-2">
        <textarea
          id={id}
          rows={3}
          className="field resize-y"
          value={text}
          onChange={(e) => {
            const lines = e.target.value.split("\n");
            onChange(lines.some((line) => line.trim()) ? lines : undefined);
          }}
          onBlur={() => Array.isArray(value) && onChange(value.map((line) => line.trim()).filter(Boolean))}
        />
      </Field>
    );
  }

  if (definition.inputType === "number") {
    return (
      <Field label={label} htmlFor={id} error={error}>
        <input
          id={id}
          inputMode="decimal"
          className="field tnum"
          value={typeof value === "number" ? String(value) : typeof value === "string" ? value : ""}
          onChange={(e) => {
            const text = e.target.value.replace(/[^\d.]/g, "");
            if (!text) return onChange(undefined);
            // Keep "2." while typing; store a number once it parses cleanly.
            onChange(/\.$/.test(text) || Number.isNaN(Number(text)) ? text : Number(text));
          }}
        />
      </Field>
    );
  }

  return (
    <Field label={label} htmlFor={id} error={error}>
      <input id={id} className="field" value={typeof value === "string" ? value : String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)} />
    </Field>
  );
}
