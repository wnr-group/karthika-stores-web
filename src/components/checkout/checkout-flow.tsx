"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { Media, ratio } from "@/components/ui/media";
import { CheckIcon } from "@/components/ui/icons";
import { EmptyState, Field } from "@/components/ui/primitives";
import {
  addressSchema,
  contactSchema,
  fieldErrors,
  INDIAN_STATES,
} from "@/lib/checkout/schema";
import { commerce } from "@/lib/site";
import type { PricedCart } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Checkout.
 *
 * Three steps and a confirmation: contact, delivery, payment. One step is
 * open at a time and the completed ones collapse to a summary line you can
 * click to reopen, so the page never becomes a wall of inputs.
 *
 * Guests and signed-in customers use the same flow. Signing in is offered,
 * never required.
 */

type Step = "contact" | "delivery" | "payment";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "contact", label: "Contact" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

export function CheckoutFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const { lines, clear, hydrated } = useCart();

  const [step, setStep] = useState<Step>("contact");
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [contact, setContact] = useState({ email: "", phone: "" });
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Tamil Nadu",
    postalCode: "",
    country: "India",
  });
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [notes, setNotes] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  // Prefill from the signed-in account.
  useEffect(() => {
    if (!user) return;
    setContact((current) => ({ ...current, email: current.email || user.email || "" }));
    setAddress((current) => ({ ...current, name: current.name || user.displayName || "" }));
  }, [user]);

  // Price the bag on the server whenever it changes.
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;

    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PricedCart | null) => {
        if (!cancelled) setPriced(data);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [lines, hydrated]);

  const totals = useMemo(() => {
    if (priced) return priced.totals;
    const subtotal = lines.reduce((total, line) => total + line.price * line.quantity, 0);
    const shipping = subtotal >= commerce.freeShippingThreshold ? 0 : commerce.standardShipping;
    return {
      subtotal,
      shipping,
      freeShippingRemaining: Math.max(0, commerce.freeShippingThreshold - subtotal),
      total: subtotal + shipping,
    };
  }, [priced, lines]);

  if (!hydrated) return <div className="h-96" />;

  if (lines.length === 0) {
    return (
      <EmptyState
        eyebrow="Checkout"
        title="There is nothing to check out"
        body="Your bag is empty. Have a look at what came off the looms this season."
        action={{ label: "Browse sarees", href: "/shop" }}
      />
    );
  }

  function validateContact(): boolean {
    const result = contactSchema.safeParse(contact);
    setErrors(result.success ? {} : fieldErrors(result.error));
    return result.success;
  }

  function validateAddress(): boolean {
    const result = addressSchema.safeParse(address);
    setErrors(result.success ? {} : fieldErrors(result.error));
    return result.success;
  }

  async function placeOrder() {
    // Parse both steps here rather than calling the validators, because
    // `errors` would still hold the previous render's value when we decide
    // which step to send the customer back to.
    const contactResult = contactSchema.safeParse(contact);
    const addressResult = addressSchema.safeParse(address);

    if (!contactResult.success || !addressResult.success) {
      setErrors(
        fieldErrors(contactResult.success ? addressResult.error! : contactResult.error),
      );
      setStep(contactResult.success ? "delivery" : "contact");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contact,
          address,
          paymentMethod,
          notes,
          saveAddress,
          lines: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        orderNumber?: string;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        setSubmitError(data.message ?? "We could not place the order. Please try again.");
        // The server reports "contact.email"; the inputs are keyed "email".
        if (data.errors) {
          setErrors(
            Object.fromEntries(
              Object.entries(data.errors).map(([key, message]) => [
                key.split(".").at(-1) ?? key,
                message,
              ]),
            ),
          );
        }
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setSubmitError("We could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        {/* Step rail */}
        <ol className="mb-10 flex items-center gap-3 text-[0.625rem] uppercase tracking-[0.18em]">
          {STEPS.map((entry, index) => {
            const currentIndex = STEPS.findIndex((s) => s.id === step);
            const done = index < currentIndex;

            return (
              <li key={entry.id} className="flex items-center gap-3">
                {index > 0 ? <span aria-hidden className="h-px w-6 bg-stone" /> : null}
                <button
                  type="button"
                  onClick={() => (done ? setStep(entry.id) : undefined)}
                  disabled={!done && index !== currentIndex}
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    index === currentIndex ? "text-ink" : done ? "text-taupe hover:text-ink" : "text-taupe-soft",
                  )}
                >
                  {done ? <CheckIcon className="h-3 w-3" /> : null}
                  {entry.label}
                </button>
              </li>
            );
          })}
        </ol>

        {!user ? (
          <p className="mb-8 border border-stone bg-shell/50 px-5 py-4 text-[0.8125rem] text-graphite">
            Checking out as a guest.{" "}
            <Link href="/login?redirect=/checkout" className="link-rule">
              Sign in
            </Link>{" "}
            if you would like this order saved to your account.
          </p>
        ) : null}

        {/* Contact */}
        <Section
          title="Contact"
          open={step === "contact"}
          summary={contact.email ? `${contact.email} · ${contact.phone}` : undefined}
          onEdit={() => setStep("contact")}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="field"
                value={contact.email}
                onChange={(event) => setContact({ ...contact, email: event.target.value })}
              />
            </Field>

            <Field
              label="Mobile"
              htmlFor="phone"
              error={errors.phone}
              hint="For delivery updates only"
            >
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className="field"
                value={contact.phone}
                onChange={(event) => setContact({ ...contact, phone: event.target.value })}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => {
              if (validateContact()) {
                // A single phone number is the common case.
                setAddress((current) => ({ ...current, phone: current.phone || contact.phone }));
                setStep("delivery");
              }
            }}
            className="mt-8 h-12 w-full bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep sm:w-auto sm:px-10"
          >
            Continue to delivery
          </button>
        </Section>

        {/* Delivery */}
        <Section
          title="Delivery"
          open={step === "delivery"}
          summary={
            address.addressLine1
              ? `${address.name}, ${address.addressLine1}, ${address.city} ${address.postalCode}`
              : undefined
          }
          onEdit={() => setStep("delivery")}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name} className="sm:col-span-2">
              <input
                id="name"
                autoComplete="name"
                className="field"
                value={address.name}
                onChange={(event) => setAddress({ ...address, name: event.target.value })}
              />
            </Field>

            <Field
              label="House / flat and street"
              htmlFor="addressLine1"
              error={errors.addressLine1}
              className="sm:col-span-2"
            >
              <input
                id="addressLine1"
                autoComplete="address-line1"
                className="field"
                value={address.addressLine1}
                onChange={(event) => setAddress({ ...address, addressLine1: event.target.value })}
              />
            </Field>

            <Field
              label="Area, landmark (optional)"
              htmlFor="addressLine2"
              className="sm:col-span-2"
            >
              <input
                id="addressLine2"
                autoComplete="address-line2"
                className="field"
                value={address.addressLine2}
                onChange={(event) => setAddress({ ...address, addressLine2: event.target.value })}
              />
            </Field>

            <Field label="City" htmlFor="city" error={errors.city}>
              <input
                id="city"
                autoComplete="address-level2"
                className="field"
                value={address.city}
                onChange={(event) => setAddress({ ...address, city: event.target.value })}
              />
            </Field>

            <Field label="PIN code" htmlFor="postalCode" error={errors.postalCode}>
              <input
                id="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                className="field"
                value={address.postalCode}
                onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
              />
            </Field>

            <Field label="State" htmlFor="state" error={errors.state}>
              <select
                id="state"
                autoComplete="address-level1"
                className="field cursor-pointer"
                value={address.state}
                onChange={(event) => setAddress({ ...address, state: event.target.value })}
              >
                {INDIAN_STATES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mobile for delivery" htmlFor="deliveryPhone" error={errors.phone}>
              <input
                id="deliveryPhone"
                type="tel"
                autoComplete="tel"
                className="field"
                value={address.phone}
                onChange={(event) => setAddress({ ...address, phone: event.target.value })}
              />
            </Field>

            <Field
              label="Notes for the atelier (optional)"
              htmlFor="notes"
              hint="Fall and pico, blouse stitching, a gift note"
              className="sm:col-span-2"
            >
              <textarea
                id="notes"
                rows={2}
                className="field resize-none"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
          </div>

          {user ? (
            <label className="mt-6 flex cursor-pointer items-center gap-3 text-[0.8125rem] text-graphite">
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center border transition-colors",
                  saveAddress ? "border-ink bg-ink" : "border-stone",
                )}
              >
                {saveAddress ? <CheckIcon className="h-2.5 w-2.5 text-paper" /> : null}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
              />
              Save this address to my account
            </label>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (validateAddress()) setStep("payment");
            }}
            className="mt-8 h-12 w-full bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep sm:w-auto sm:px-10"
          >
            Continue to payment
          </button>
        </Section>

        {/* Payment */}
        <Section title="Payment" open={step === "payment"} onEdit={() => setStep("payment")}>
          <div className="space-y-3">
            <PaymentOption
              id="razorpay"
              selected={paymentMethod === "razorpay"}
              onSelect={() => setPaymentMethod("razorpay")}
              title="Pay online"
              body="UPI, credit and debit cards, netbanking and wallets, through Razorpay."
            />
            <PaymentOption
              id="cod"
              selected={paymentMethod === "cod"}
              onSelect={() => setPaymentMethod("cod")}
              title="Cash on delivery"
              body="Pay the courier when the parcel arrives. Available on orders up to Rs 30,000."
            />
          </div>

          {submitError ? (
            <p role="alert" className="mt-6 border border-danger/30 bg-danger/5 px-4 py-3 text-[0.8125rem] text-danger">
              {submitError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={placeOrder}
            disabled={submitting}
            className="mt-8 h-12 w-full bg-ink text-[0.6875rem] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-terracotta-deep disabled:opacity-50"
          >
            {submitting ? "Placing your order..." : `Place order · ${formatPrice(totals.total)}`}
          </button>

          <p className="mt-4 text-[0.6875rem] leading-relaxed text-taupe">
            By placing this order you agree to our{" "}
            <Link href="/policies/terms" className="link-rule">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/policies/returns" className="link-rule">
              returns policy
            </Link>
            .
          </p>
        </Section>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-5">
        <div className="sticky top-28 border border-stone bg-paper p-6 md:p-8">
          <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">Your order</h2>

          <ul className="mt-6 space-y-5">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-4">
                <div className={cn("relative w-16 shrink-0 overflow-hidden", ratio.product)}>
                  <Media image={line.image} className="absolute inset-0" sizes="64px" />
                  <span className="tnum absolute right-0 top-0 bg-ink px-1.5 text-[0.625rem] leading-5 text-paper">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1rem] leading-snug text-ink">{line.name}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-taupe">{line.fabric}</p>
                </div>
                <span className="tnum shrink-0 text-[0.8125rem] text-ink">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-stone pt-5 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-taupe">Subtotal</dt>
              <dd className="tnum text-ink">{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-taupe">Shipping</dt>
              <dd className="tnum text-ink">
                {totals.shipping === 0 ? "Complimentary" : formatPrice(totals.shipping)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between border-t border-stone pt-5">
            <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink">Total</span>
            <span className="tnum text-lg text-ink">{formatPrice(totals.total)}</span>
          </div>

          <p className="mt-1.5 text-[0.6875rem] text-taupe">
            Inclusive of all taxes. Prices confirmed against the catalogue when you place the
            order.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Step section
   ------------------------------------------------------------------------- */

function Section({
  title,
  open,
  summary,
  onEdit,
  children,
}: {
  title: string;
  open: boolean;
  summary?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-stone py-7 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-ink">{title}</h2>
        {!open && summary ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>

      {!open && summary ? (
        <p className="mt-2 truncate text-[0.8125rem] text-taupe">{summary}</p>
      ) : null}

      {open ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}

function PaymentOption({
  id,
  selected,
  onSelect,
  title,
  body,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-4 border px-5 py-4 transition-colors duration-[240ms]",
        selected ? "border-ink bg-shell/40" : "border-stone hover:border-taupe",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-ink" : "border-stone",
        )}
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-ink" /> : null}
      </span>

      <input
        type="radio"
        name="payment"
        value={id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />

      <span>
        <span className="block text-[0.875rem] text-ink">{title}</span>
        <span className="mt-1 block text-[0.75rem] leading-relaxed text-taupe">{body}</span>
      </span>
    </label>
  );
}
