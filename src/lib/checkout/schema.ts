import { z } from "zod";

/**
 * One schema, used by the checkout form in the browser and by the route
 * handler on the server. The client copy exists to give fast feedback; the
 * server copy is the one that decides.
 */

const phone = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a ten-digit Indian mobile number");

const postalCode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a six-digit PIN code");

export const contactSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone,
});

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Please give us a name for the parcel").max(80),
  phone,
  addressLine1: z.string().trim().min(4, "Enter the house or flat and street").max(120),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city").max(60),
  state: z.string().trim().min(2, "Enter a state").max(60),
  postalCode,
  country: z.string().trim().default("India"),
});

export const checkoutSchema = z.object({
  contact: contactSchema,
  address: addressSchema,
  paymentMethod: z.enum(["razorpay", "cod"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
  // Ids and quantities only. Prices are never accepted from the browser.
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(5),
      }),
    )
    .min(1, "Your bag is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

/** Flattens a Zod error into `{ fieldName: message }` for the form. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}

/** The states, for the delivery step's select. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
