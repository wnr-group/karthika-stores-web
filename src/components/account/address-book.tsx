"use client";

import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { Field } from "@/components/ui/primitives";
import { addressSchema, fieldErrors, INDIAN_STATES } from "@/lib/checkout/schema";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The address book.
 *
 * Server-rendered list, client-side editing. Everything goes through
 * /api/addresses, which scopes each write to the signed-in customer.
 */

const BLANK = {
  label: "Home",
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "Tamil Nadu",
  postalCode: "",
  country: "India",
  isDefault: false,
};

type Draft = typeof BLANK;

export function AddressBook({ initial }: { initial: Address[] }) {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function startNew() {
    setDraft(BLANK);
    setErrors({});
    setEditing("new");
  }

  function startEdit(address: Address) {
    setDraft({
      label: address.label,
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setErrors({});
    setEditing(address.id);
  }

  async function save() {
    const result = addressSchema.safeParse(draft);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }

    setBusy(true);
    setErrors({});

    const isNew = editing === "new";
    const response = await fetch("/api/addresses", {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(isNew ? draft : { ...draft, id: editing }),
    }).catch(() => null);

    setBusy(false);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => null)) as
        | { message?: string; errors?: Record<string, string> }
        | null;
      if (data?.errors) setErrors(data.errors);
      toast(data?.message ?? "We could not save that address.", "error");
      return;
    }

    const { address } = (await response.json()) as { address: Address };

    setAddresses((current) => {
      const cleared = address.isDefault
        ? current.map((entry) => ({ ...entry, isDefault: false }))
        : current;
      return isNew
        ? [...cleared, address]
        : cleared.map((entry) => (entry.id === address.id ? address : entry));
    });

    setEditing(null);
    toast(isNew ? "Address saved" : "Address updated", "success");
  }

  async function remove(id: string) {
    setBusy(true);
    const response = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => null);
    setBusy(false);

    if (!response?.ok) {
      toast("We could not remove that address.", "error");
      return;
    }

    setAddresses((current) => current.filter((entry) => entry.id !== id));
    toast("Address removed", "success");
  }

  return (
    <div>
      <div className="flex items-end justify-between border-b border-stone pb-4">
        <h2 className="display-sm">Addresses</h2>
        {editing === null ? (
          <button
            type="button"
            onClick={startNew}
            className="link-quiet text-[0.6875rem] uppercase tracking-[0.16em]"
          >
            Add an address
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <div className="mt-8 border border-stone bg-paper p-6 md:p-8">
          <h3 className="eyebrow mb-6">
            {editing === "new" ? "New address" : "Edit address"}
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Label" htmlFor="label" hint="Home, office, mother's house">
              <input
                id="label"
                className="field"
                value={draft.label}
                onChange={(event) => setDraft({ ...draft, label: event.target.value })}
              />
            </Field>

            <Field label="Full name" htmlFor="addr-name" error={errors.name}>
              <input
                id="addr-name"
                className="field"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>

            <Field
              label="House / flat and street"
              htmlFor="addr-line1"
              error={errors.addressLine1}
              className="sm:col-span-2"
            >
              <input
                id="addr-line1"
                className="field"
                value={draft.addressLine1}
                onChange={(event) => setDraft({ ...draft, addressLine1: event.target.value })}
              />
            </Field>

            <Field label="Area, landmark (optional)" htmlFor="addr-line2" className="sm:col-span-2">
              <input
                id="addr-line2"
                className="field"
                value={draft.addressLine2}
                onChange={(event) => setDraft({ ...draft, addressLine2: event.target.value })}
              />
            </Field>

            <Field label="City" htmlFor="addr-city" error={errors.city}>
              <input
                id="addr-city"
                className="field"
                value={draft.city}
                onChange={(event) => setDraft({ ...draft, city: event.target.value })}
              />
            </Field>

            <Field label="PIN code" htmlFor="addr-pin" error={errors.postalCode}>
              <input
                id="addr-pin"
                inputMode="numeric"
                className="field"
                value={draft.postalCode}
                onChange={(event) => setDraft({ ...draft, postalCode: event.target.value })}
              />
            </Field>

            <Field label="State" htmlFor="addr-state" error={errors.state}>
              <select
                id="addr-state"
                className="field cursor-pointer"
                value={draft.state}
                onChange={(event) => setDraft({ ...draft, state: event.target.value })}
              >
                {INDIAN_STATES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mobile" htmlFor="addr-phone" error={errors.phone}>
              <input
                id="addr-phone"
                type="tel"
                className="field"
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            </Field>
          </div>

          <label className="mt-6 flex cursor-pointer items-center gap-3 text-[0.8125rem] text-graphite">
            <span
              className={cn(
                "flex h-3.5 w-3.5 items-center justify-center border transition-colors",
                draft.isDefault ? "border-ink bg-ink" : "border-stone",
              )}
            >
              {draft.isDefault ? (
                <svg viewBox="0 0 10 8" className="h-2 w-2 text-paper" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="m1 4 2.5 2.5L9 1" />
                </svg>
              ) : null}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={draft.isDefault}
              onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
            />
            Use as my default delivery address
          </label>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="h-11 bg-ink px-8 text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="h-11 border border-stone px-6 text-[0.6875rem] uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {addresses.length === 0 && editing === null ? (
        <div className="py-10">
          <p className="text-[0.9375rem] text-graphite">
            No addresses saved. Add one and checkout gets a good deal faster next time.
          </p>
          <button
            type="button"
            onClick={startNew}
            className="link-rule mt-5 inline-block text-[0.6875rem] uppercase tracking-[0.16em]"
          >
            Add an address
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "border p-5 transition-colors",
                address.isDefault ? "border-ink" : "border-stone",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-ink">
                  {address.label}
                </p>
                {address.isDefault ? (
                  <span className="text-[0.625rem] uppercase tracking-[0.16em] text-taupe">
                    Default
                  </span>
                ) : null}
              </div>

              <address className="mt-3 text-[0.8125rem] not-italic leading-relaxed text-graphite">
                {address.name}
                <br />
                {address.addressLine1}
                <br />
                {address.addressLine2 ? (
                  <>
                    {address.addressLine2}
                    <br />
                  </>
                ) : null}
                {address.city}, {address.state} {address.postalCode}
                <br />
                <span className="tnum">{address.phone}</span>
              </address>

              <div className="mt-4 flex gap-5">
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(address.id)}
                  disabled={busy}
                  className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
