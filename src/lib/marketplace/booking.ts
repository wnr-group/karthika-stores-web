/**
 * Service booking rules: pricing and slot availability.
 *
 * All times are Indian Standard Time. A slot is stored as a UTC ISO string
 * and displayed in Asia/Kolkata, so a 9am slot is 9am for the customer and
 * the vendor whatever the server's own timezone.
 */

import type { Booking, Service, ServiceAddon } from "@/lib/types";

export const TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330;

/** "2025-10-04" + "09:30" in IST -> a UTC ISO string. */
export function istToIso(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utc = Date.UTC(year!, month! - 1, day!, hour!, minute!) - IST_OFFSET_MINUTES * 60_000;
  return new Date(utc).toISOString();
}

/** The IST calendar date (yyyy-mm-dd) of an instant. */
export function istDate(iso: string | number | Date): string {
  const date = new Date(new Date(iso).getTime() + IST_OFFSET_MINUTES * 60_000);
  return date.toISOString().slice(0, 10);
}

export function istTime(iso: string): string {
  const date = new Date(new Date(iso).getTime() + IST_OFFSET_MINUTES * 60_000);
  return date.toISOString().slice(11, 16);
}

/** The IST weekday (0 = Sunday) of a yyyy-mm-dd date. */
export function istWeekday(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + days)).toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------
   Pricing
   ------------------------------------------------------------------------- */

export interface BookingQuote {
  quantity: number;
  addons: ServiceAddon[];
  unitPrice: number;
  subtotal: number;
  addonsTotal: number;
  total: number;
  depositAmount: number;
  /** What is settled with the vendor after the service. */
  balanceAmount: number;
}

export function clampQuantity(service: Pick<Service, "bookingRules">, quantity: number): number {
  const { minQuantity, maxQuantity } = service.bookingRules;
  const value = Number.isFinite(quantity) ? Math.floor(quantity) : minQuantity;
  return Math.min(maxQuantity, Math.max(minQuantity, value));
}

export function quoteBooking(
  service: Pick<Service, "price" | "priceUnit" | "addons" | "bookingRules">,
  requestedQuantity: number,
  addonIds: string[],
): BookingQuote {
  const quantity = clampQuantity(service, requestedQuantity);
  const addons = service.addons.filter((addon) => addonIds.includes(addon.id));
  const subtotal = service.priceUnit === "flat" ? service.price : service.price * quantity;
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = subtotal + addonsTotal;
  const depositAmount = Math.round((total * service.bookingRules.depositPercent) / 100);

  return {
    quantity,
    addons,
    unitPrice: service.price,
    subtotal,
    addonsTotal,
    total,
    depositAmount,
    balanceAmount: total - depositAmount,
  };
}

/* -------------------------------------------------------------------------
   Slots
   ------------------------------------------------------------------------- */

export interface Slot {
  time: string;
  iso: string;
  available: boolean;
  reason?: "past" | "notice" | "full";
}

function minutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour! * 60 + minute!;
}

function clock(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Is the vendor open on this IST date at all? */
export function isBookableDate(service: Pick<Service, "availability" | "bookingRules">, date: string, now = Date.now()): boolean {
  if (!service.availability.days.includes(istWeekday(date))) return false;
  if (service.availability.blackoutDates.includes(date)) return false;
  const today = istDate(now);
  if (date < today) return false;
  if (date > addDays(today, service.bookingRules.maxAdvanceDays)) return false;
  // The whole day may fall inside the notice period.
  const lastSlot = istToIso(date, service.availability.endTime);
  return Date.parse(lastSlot) - now >= service.bookingRules.advanceNoticeHours * 3_600_000;
}

export function slotsForDate(
  service: Pick<Service, "availability" | "bookingRules">,
  date: string,
  existing: Array<Pick<Booking, "scheduledAt" | "status">>,
  now = Date.now(),
): Slot[] {
  if (!service.availability.days.includes(istWeekday(date)) || service.availability.blackoutDates.includes(date)) {
    return [];
  }

  const { startTime, endTime, slotMinutes } = service.availability;
  const taken = new Map<string, number>();
  for (const booking of existing) {
    if (booking.status === "cancelled") continue;
    taken.set(booking.scheduledAt, (taken.get(booking.scheduledAt) ?? 0) + 1);
  }

  const slots: Slot[] = [];
  for (let at = minutes(startTime); at < minutes(endTime); at += slotMinutes) {
    const time = clock(at);
    const iso = istToIso(date, time);
    const start = Date.parse(iso);
    let reason: Slot["reason"];
    if (start <= now) reason = "past";
    else if (start - now < service.bookingRules.advanceNoticeHours * 3_600_000) reason = "notice";
    else if ((taken.get(iso) ?? 0) >= service.bookingRules.maxBookingsPerSlot) reason = "full";
    slots.push({ time, iso, available: !reason, reason });
  }
  return slots;
}

/** The next `count` dates the service can be booked on, from today. */
export function upcomingDates(service: Pick<Service, "availability" | "bookingRules">, count = 14, now = Date.now()): string[] {
  const dates: string[] = [];
  const today = istDate(now);
  for (let offset = 0; dates.length < count && offset <= service.bookingRules.maxAdvanceDays; offset += 1) {
    const date = addDays(today, offset);
    if (isBookableDate(service, date, now)) dates.push(date);
  }
  return dates;
}

/* -------------------------------------------------------------------------
   Display
   ------------------------------------------------------------------------- */

export function formatSlot(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDuration(minutesTotal: number | null): string {
  if (!minutesTotal) return "Flexible";
  if (minutesTotal < 60) return `${minutesTotal} min`;
  const hours = Math.floor(minutesTotal / 60);
  const rest = minutesTotal % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export const PRICE_UNIT_LABELS: Record<Service["priceUnit"], string> = {
  flat: "",
  per_hour: "per hour",
  per_person: "per person",
  per_unit: "per unit",
};

export function priceUnitLabel(service: Pick<Service, "priceUnit" | "unitLabel">): string {
  return service.unitLabel ?? PRICE_UNIT_LABELS[service.priceUnit];
}
