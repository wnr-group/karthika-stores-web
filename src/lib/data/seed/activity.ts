/**
 * Ninety days of marketplace history, generated deterministically.
 *
 * The dashboards need something to count, so the seed repository boots with
 * customers, multi-vendor orders (split into vendor orders the way a real
 * checkout splits them), bookings, reviews, payments, payouts, refunds and
 * disputes. Everything is derived from the catalogue with a seeded PRNG, so
 * the same order number always points at the same order.
 */

import { addDays, istDate, istToIso } from "@/lib/marketplace/booking";
import { categoryTrail } from "@/lib/marketplace/categories";
import { commissionOn, resolveCommission } from "@/lib/marketplace/commission";
import { aggregateOrderStatus, availableFulfillment, fulfillmentFee } from "@/lib/marketplace/fulfillment";
import { cities, site } from "@/lib/site";
import type {
  Booking,
  BookingStatus,
  Customer,
  Dispute,
  FulfillmentType,
  Order,
  OrderItem,
  Payout,
  PaymentMethod,
  Product,
  Refund,
  Review,
  ReviewStatus,
  Service,
  StatusEvent,
  Transaction,
  Vendor,
  VendorOrder,
  VendorOrderStatus,
} from "@/lib/types";

import { createRandom, daysAgo, SEED_BOOT, SEED_NOW } from "./clock";
import { commissionRules } from "./marketplace";
import { categories } from "./taxonomy";

interface ActivityInput {
  vendors: Vendor[];
  products: Product[];
  services: Service[];
}

export interface Activity {
  customers: Customer[];
  orders: Order[];
  bookings: Booking[];
  reviews: Review[];
  transactions: Transaction[];
  payouts: Payout[];
  refunds: Refund[];
  disputes: Dispute[];
  orderSequence: number;
  bookingSequence: number;
}

/* -------------------------------------------------------------------------
   People
   ------------------------------------------------------------------------- */

const FIRST_NAMES = [
  "Aarav", "Priya", "Karthik", "Divya", "Rahul", "Sneha", "Vikram", "Ananya", "Arjun", "Meera",
  "Rohan", "Kavya", "Siddharth", "Lakshmi", "Aditya", "Pooja", "Nikhil", "Shreya", "Varun", "Nandini",
  "Harish", "Ishita", "Manoj", "Revathi", "Suresh", "Aishwarya", "Deepak", "Gayathri", "Imran", "Fatima",
  "Joseph", "Maria", "Ravi", "Swathi", "Ajay", "Bhavana", "Ganesh", "Keerthi", "Vivek", "Zoya",
  "Naveen", "Tara", "Abhishek", "Radhika", "Prakash", "Sahana", "Kiran", "Neha", "Mohan", "Anjali",
  "Farhan", "Ritu", "Sanjay", "Uma", "Vishal", "Yamini", "Dinesh", "Hema", "Pranav", "Sana",
];

const LAST_NAMES = [
  "Iyer", "Sharma", "Reddy", "Nair", "Krishnan", "Menon", "Rao", "Gupta", "Pillai", "Subramanian",
  "Kapoor", "Joshi", "Shetty", "Das", "Fernandes", "Khan", "Mehta", "Bose", "Venkatesh", "Thomas",
];

/** Most customers are where most sellers are. */
const CITY_WEIGHTS: Array<readonly [string, number]> = [
  ["chennai", 34], ["bengaluru", 20], ["mumbai", 9], ["delhi", 8], ["hyderabad", 8],
  ["kochi", 5], ["pune", 5], ["jaipur", 4], ["madurai", 4], ["coimbatore", 3],
];

const STREETS = ["Cathedral Road", "100 Feet Road", "MG Road", "Linking Road", "Park Street", "Anna Salai", "Church Street", "Jubilee Hills Road 36"];

/* -------------------------------------------------------------------------
   Review vocabulary, per vertical
   ------------------------------------------------------------------------- */

const REVIEW_LINES: Record<string, Array<[string, string]>> = {
  "cat-fashion": [
    ["Exactly as pictured", "The colour is true to the photos and the fabric feels far better than the price suggests. Already planning a second one."],
    ["Lovely finish", "Stitching is neat, nothing loose. Sizing chart was accurate for me."],
    ["Got so many compliments", "Wore it to a family function and three people asked where it was from."],
    ["Good, runs slightly large", "Quality is great. I would size down if you are between sizes."],
    ["Beautiful drape", "Soft and falls beautifully. Packed carefully with a handwritten note."],
    ["Worth it", "You can tell it was made by hand. Delivery took five days to Pune."],
  ],
  "cat-jewellery": [
    ["Looks far more expensive", "The plating is rich and the stones catch the light. Wore it all day with no irritation."],
    ["Perfect for the wedding", "Matched my Kanchipuram perfectly. Arrived in a lovely box."],
    ["Light and comfortable", "I was worried about the weight but it is very wearable."],
    ["Pretty, slightly smaller than expected", "Check the dimensions, but the finish is excellent."],
    ["Bought as a gift", "My sister loved it. The pouch makes it easy to store."],
  ],
  "cat-beauty": [
    ["My skin loves this", "Two weeks in and my skin looks brighter. Smells earthy and lovely."],
    ["Clean ingredients", "Short ingredient list and the batch date on the label is reassuring."],
    ["Repeat purchase", "Third bottle. Nothing else has worked as well for my hair."],
    ["Gentle on sensitive skin", "No breakouts at all, which is rare for me with oils."],
    ["Nice, but takes time", "Results are gradual. Packaging is sturdy and leak-proof."],
  ],
  "cat-food": [
    ["Tastes like home", "Exactly how my grandmother made it. Ordering again for the whole family."],
    ["Fresh and well packed", "Arrived warm and the packaging kept everything separate. Delivery was on time."],
    ["Just the right spice", "Flavourful without being overpowering. Portion was generous."],
    ["Our new weekend ritual", "We order every Sunday now. Consistently good."],
    ["Good, a little pricey", "Quality is excellent though. You can taste the ghee."],
    ["Best in the city", "Tried many places; this is the one we stick with."],
  ],
  "cat-home": [
    ["Beautifully made", "Solid and well finished. The workshop card was a lovely touch."],
    ["Better in person", "Photos do not do the colour justice. Packed very securely."],
    ["Sturdy and handsome", "Arrived without a scratch. Assembly was not needed."],
    ["Lovely craft", "Every piece is slightly different, which I like."],
    ["Took a while to arrive", "Worth the wait, but it took nine days to Delhi."],
  ],
  "cat-electronics": [
    ["Excellent value", "Sound quality rivals headphones at twice the price. Battery lasts forever."],
    ["Works as advertised", "Paired instantly with my phone and laptop. Seller shipped the next day."],
    ["Great build", "Feels premium. Warranty card and invoice were in the box."],
    ["Good, app could be better", "Hardware is great; the companion app is a bit basic."],
    ["Fast delivery from TechHub", "Arrived in two days, well packed, tested before shipping."],
  ],
  "cat-gifts": [
    ["Made the day", "Delivered on time and looked even better than the photo."],
    ["Thoughtful and beautiful", "Every item in it was something the recipient actually used."],
    ["Lovely personal touch", "The engraving was perfect and they confirmed the text before making it."],
    ["Fresh for days", "Flowers lasted almost a week."],
  ],
  "cat-pets": [
    ["My dog loves it", "He refuses to sleep anywhere else now. Cover washes well."],
    ["Good quality", "Sturdy and well stitched. Our cat approves, which says a lot."],
    ["Healthy and tasty", "Switched over a week as advised; no tummy issues at all."],
    ["Fits well", "Sizing guide was spot on for our indie."],
  ],
  service: [
    ["Absolutely professional", "On time, well prepared and extremely skilled. Would book again in a heartbeat."],
    ["Exceeded expectations", "They listened to exactly what we wanted and delivered more."],
    ["Smooth from start to finish", "Booking was easy, confirmation came quickly, and the team was courteous."],
    ["Great value", "Fair price for the quality of work. Highly recommend."],
    ["Good, slightly late", "Arrived 20 minutes late but the work itself was excellent."],
    ["Will recommend to friends", "Our family was so happy with the result."],
  ],
};

const FLAGGED_LINES: Array<[string, string]> = [
  ["Item never arrived??", "Still waiting after two weeks, nobody responds. Avoid."],
  ["Contact me for cheaper", "Same product available cheaper, message me on WhatsApp 98XXXXXX."],
  ["Wrong colour", "Ordered maroon, got something closer to brown. Not happy."],
];

/* -------------------------------------------------------------------------
   Generator
   ------------------------------------------------------------------------- */

const ROOT_CATEGORY_IDS = new Set(categories.filter((category) => !category.parentId).map((category) => category.id));

function verticalOf(categoryId: string): string {
  return categoryTrail(categories, categoryId).find((category) => ROOT_CATEGORY_IDS.has(category.id))?.id ?? "cat-fashion";
}

export function generateActivity({ vendors, products, services }: ActivityInput): Activity {
  const random = createRandom(20240601);
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const live = products.filter((product) => product.status === "approved" && vendorById.get(product.vendorId)?.status === "approved");
  const liveServices = services.filter((service) => service.status === "approved");

  /* --- Customers --- */
  const customers: Customer[] = FIRST_NAMES.map((first, index) => {
    const last = LAST_NAMES[(index * 7) % LAST_NAMES.length]!;
    const city = random.weighted(CITY_WEIGHTS);
    return {
      id: `cus-${String(index + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+91 9${String(800000000 + index * 7919).slice(0, 9)}`,
      city,
      status: index === 17 ? "blocked" : "active",
      orderCount: 0,
      bookingCount: 0,
      totalSpent: 0,
      lastActiveAt: null,
      createdAt: daysAgo(random.int(20, 400)),
    };
  });

  /* --- Orders --- */
  const orders: Order[] = [];
  const transactions: Transaction[] = [];
  let orderSequence = 24080;
  let transactionSequence = 1;

  const pickProduct = (city: string): Product | undefined => {
    const candidates = live
      .map((product) => {
        const vendor = vendorById.get(product.vendorId)!;
        const options = availableFulfillment(product, vendor, city);
        return options.length ? ([product, Math.sqrt(product.salesCount + 10)] as const) : null;
      })
      .filter((entry): entry is readonly [Product, number] => entry !== null);
    return candidates.length ? random.weighted(candidates) : undefined;
  };

  for (let day = 89; day >= 0; day -= 1) {
    // Gentle growth over the quarter, a weekend bump, and some noise.
    const weekday = new Date(SEED_NOW - day * 86_400_000).getUTCDay();
    const base = 3 + (89 - day) / 30 + (weekday === 0 || weekday === 6 ? 1.5 : 0);
    const count = Math.max(1, Math.round(base + random.int(-1, 2)));

    for (let n = 0; n < count; n += 1) {
      const customer = random.pick(customers);
      const hour = random.int(8, 22);
      const scheduled = daysAgo(day, hour, random.int(0, 59));
      // Today's orders can be scheduled for later today, which would date them
      // after real orders placed now (or tomorrow, in IST). Pull those back
      // to the minutes before boot, keeping their order and spending no
      // randomness, so the rest of the seed stays the same.
      const createdAt =
        Date.parse(scheduled) > SEED_BOOT
          ? new Date(SEED_BOOT - (count - n) * 7 * 60_000).toISOString()
          : scheduled;
      const lineCount = random.weighted([[1, 55], [2, 30], [3, 15]] as const);

      const picked = new Map<string, { product: Product; quantity: number; variantIndex: number }>();
      for (let line = 0; line < lineCount; line += 1) {
        const product = pickProduct(customer.city);
        if (!product || picked.has(product.id)) continue;
        const variantIndex = random.int(0, product.variants.length - 1);
        picked.set(product.id, { product, quantity: random.weighted([[1, 80], [2, 17], [3, 3]] as const), variantIndex });
      }
      if (picked.size === 0) continue;

      orderSequence += 1;
      const orderNumber = `${site.orderPrefix}-${orderSequence}`;
      const orderId = `ord-${orderSequence}`;
      const method: PaymentMethod = random.chance(0.72) ? "razorpay" : "cod";

      // Group by vendor, with digital goods split into their own fulfilment.
      const groups = new Map<string, Array<{ product: Product; quantity: number; variantIndex: number }>>();
      for (const entry of picked.values()) {
        const digital = entry.product.fulfillmentTypes.length === 1 && entry.product.fulfillmentTypes[0] === "digital";
        const key = `${entry.product.vendorId}:${digital ? "digital" : "physical"}`;
        groups.set(key, [...(groups.get(key) ?? []), entry]);
      }

      const cancelledOrder = day > 1 && random.chance(0.05);
      const vendorOrders: VendorOrder[] = [...groups.entries()].map(([key, entries], groupIndex) => {
        const vendor = vendorById.get(key.split(":")[0]!)!;
        const fulfillmentType: FulfillmentType =
          availableFulfillment(entries[0]!.product, vendor, customer.city).find((type) =>
            entries.every((entry) => availableFulfillment(entry.product, vendor, customer.city).includes(type)),
          ) ?? entries[0]!.product.fulfillmentTypes[0]!;
        const vendorOrderId = `${orderId}-v${groupIndex + 1}`;

        const items: OrderItem[] = entries.map((entry, itemIndex) => {
          const variant = entry.product.variants[entry.variantIndex]!;
          const lineTotal = variant.price * entry.quantity;
          const { rate } = resolveCommission({
            rules: commissionRules,
            productId: entry.product.id,
            productRate: entry.product.commissionRate,
            vendorId: vendor.id,
            vendorRate: vendor.commissionRate,
            vendorPlan: vendor.plan,
            categoryTrailIds: categoryTrail(categories, entry.product.categoryId).map((category) => category.id),
          });
          return {
            id: `${vendorOrderId}-i${itemIndex + 1}`,
            vendorOrderId,
            productId: entry.product.id,
            variantId: variant.id,
            variantTitle: variant.title,
            vendorId: vendor.id,
            name: entry.product.name,
            slug: entry.product.slug,
            subtitle: entry.product.subtitle,
            color: entry.product.color,
            image: entry.product.images[0]!,
            quantity: entry.quantity,
            unitPrice: variant.price,
            lineTotal,
            customization: entry.product.customization?.required ? "As discussed on WhatsApp" : null,
            commissionRate: rate,
            commissionAmount: commissionOn(lineTotal, rate),
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
        const shippingAmount = fulfillmentFee(fulfillmentType, vendor, subtotal);
        const commissionAmount = items.reduce((sum, item) => sum + item.commissionAmount, 0);

        // Age decides how far along fulfilment is.
        const perishable = fulfillmentType === "local_delivery" || fulfillmentType === "pickup" || fulfillmentType === "digital";
        let status: VendorOrderStatus;
        if (cancelledOrder) status = "cancelled";
        else if (day === 0) status = random.chance(0.6) ? "new" : "processing";
        else if (perishable) status = day >= 1 ? "delivered" : "processing";
        else if (day <= 2) status = random.weighted([["processing", 50], ["shipped", 40], ["new", 10]] as const);
        else if (day <= 7) status = random.weighted([["shipped", 45], ["delivered", 55]] as const);
        else status = random.weighted([["delivered", 93], ["returned", 4], ["cancelled", 3]] as const);

        const history: StatusEvent[] = [{ status: "new", at: createdAt, note: null }];
        const step = (next: VendorOrderStatus, offsetHours: number, note: string | null = null) =>
          history.push({
            status: next,
            at: new Date(Math.min(Date.parse(createdAt) + offsetHours * 3_600_000, SEED_BOOT)).toISOString(),
            note,
          });
        if (status !== "new" && status !== "cancelled") step("processing", 3);
        if (["shipped", "delivered", "returned"].includes(status)) step("shipped", perishable ? 6 : 30);
        if (["delivered", "returned"].includes(status)) step("delivered", perishable ? 8 : 24 * random.int(3, 5));
        if (status === "returned") step("returned", 24 * 8, "Customer returned: size did not fit");
        if (status === "cancelled") step("cancelled", 5, cancelledOrder ? "Cancelled by customer" : "Out of stock");

        const total = subtotal + shippingAmount;
        return {
          id: vendorOrderId,
          orderId,
          orderNumber,
          number: `${orderNumber}-${groupIndex + 1}`,
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorSlug: vendor.slug,
          status,
          fulfillmentType,
          items,
          subtotal,
          shippingAmount,
          discountAmount: 0,
          total,
          commissionAmount,
          vendorEarnings: total - commissionAmount,
          trackingNumber: fulfillmentType === "shipping" && status !== "new" && status !== "processing" && status !== "cancelled"
            ? `${random.pick(["DTDC", "BD", "XB", "DL"])}${random.int(10000000, 99999999)}`
            : null,
          courier: fulfillmentType === "shipping" && status !== "new" && status !== "processing" && status !== "cancelled"
            ? random.pick(["Delhivery", "Blue Dart", "DTDC", "Xpressbees"])
            : null,
          customerName: customer.name,
          customerEmail: customer.email,
          city: customer.city,
          history,
          createdAt,
          updatedAt: history[history.length - 1]!.at,
        };
      });

      const subtotal = vendorOrders.reduce((sum, vo) => sum + vo.subtotal, 0);
      const shippingAmount = vendorOrders.reduce((sum, vo) => sum + vo.shippingAmount, 0);

      // One in eight eligible orders used the welcome coupon.
      const couponCode = subtotal >= 999 && random.chance(0.12) ? "WELCOME150" : null;
      const discountAmount = couponCode ? 150 : 0;
      const totalAmount = subtotal + shippingAmount - discountAmount;
      const status = aggregateOrderStatus(vendorOrders.map((vo) => vo.status));
      const paid = method === "razorpay" ? status !== "cancelled" || random.chance(0.5) : status === "delivered" || status === "returned";

      const cityInfo = cities.find((entry) => entry.slug === customer.city)!;
      const order: Order = {
        id: orderId,
        orderNumber,
        userId: null,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        status,
        paymentStatus: status === "returned" ? "refunded" : paid ? "paid" : status === "cancelled" ? "failed" : "pending",
        paymentMethod: method,
        subtotal,
        shippingAmount,
        discountAmount,
        couponCode,
        totalAmount,
        commissionAmount: vendorOrders.reduce((sum, vo) => sum + vo.commissionAmount, 0),
        shippingAddress: {
          name: customer.name,
          phone: customer.phone,
          addressLine1: `${random.int(2, 220)}, ${random.pick(STREETS)}`,
          addressLine2: null,
          city: cityInfo.name,
          state: cityInfo.state,
          postalCode: String(random.int(400001, 699999)),
          country: "India",
        },
        items: vendorOrders.flatMap((vo) => vo.items),
        vendorOrders,
        createdAt,
        updatedAt: vendorOrders.map((vo) => vo.updatedAt).sort().at(-1)!,
      };
      orders.push(order);

      customer.orderCount += 1;
      if (status !== "cancelled") customer.totalSpent += totalAmount;
      customer.lastActiveAt = createdAt;

      if (method === "razorpay") {
        // A small share of online payments fail once before succeeding.
        if (random.chance(0.07)) {
          transactions.push({
            id: `txn-${transactionSequence++}`,
            reference: orderNumber,
            kind: "order",
            customerName: customer.name,
            method: random.pick(["upi", "card"] as const),
            amount: totalAmount,
            status: "failed",
            gatewayRef: `pay_${orderSequence}F${random.int(1000, 9999)}`,
            failureReason: random.pick(["Bank declined the transaction", "UPI request expired", "Insufficient funds", "3-D Secure authentication failed"]),
            createdAt,
          });
        }
        transactions.push({
          id: `txn-${transactionSequence++}`,
          reference: orderNumber,
          kind: "order",
          customerName: customer.name,
          method: random.pick(["upi", "upi", "card", "razorpay"] as const),
          amount: totalAmount,
          status: order.paymentStatus === "refunded" ? "refunded" : paid ? "succeeded" : "failed",
          gatewayRef: `pay_${orderSequence}${random.int(100000, 999999)}`,
          failureReason: paid ? null : "Payment abandoned at checkout",
          createdAt,
        });
      } else if (paid) {
        transactions.push({
          id: `txn-${transactionSequence++}`,
          reference: orderNumber,
          kind: "order",
          customerName: customer.name,
          method: "cod",
          amount: totalAmount,
          status: order.paymentStatus === "refunded" ? "refunded" : "succeeded",
          gatewayRef: null,
          failureReason: null,
          createdAt: order.updatedAt,
        });
      }
    }
  }

  /* --- Bookings --- */
  const bookings: Booking[] = [];
  let bookingSequence = 10400;
  const serviceWeights = liveServices.map((service) => [service, Math.sqrt(service.bookingCount + 5)] as const);

  for (let index = 0; index < 150; index += 1) {
    const service = random.weighted(serviceWeights);
    const vendor = vendorById.get(service.vendorId)!;
    const customer = random.pick(customers);
    const offset = random.int(-75, 35);
    // Land on a real slot boundary, in IST, so seeded bookings line up with
    // the slots the booking widget generates.
    const [startHour, startMinute] = service.availability.startTime.split(":").map(Number);
    const [endHour] = service.availability.endTime.split(":").map(Number);
    const slotCount = Math.max(1, Math.floor(((endHour! - startHour!) * 60 - startMinute!) / service.availability.slotMinutes));
    const slotStart = startHour! * 60 + startMinute! + random.int(0, slotCount - 1) * service.availability.slotMinutes;
    const scheduledAt = istToIso(
      addDays(istDate(SEED_NOW), -offset),
      `${String(Math.floor(slotStart / 60)).padStart(2, "0")}:${String(slotStart % 60).padStart(2, "0")}`,
    );
    const createdAt = daysAgo(Math.max(0, -offset + random.int(2, 20)));
    const quantity = service.bookingRules.minQuantity > 1
      ? random.int(service.bookingRules.minQuantity, Math.min(service.bookingRules.maxQuantity, service.bookingRules.minQuantity * 3))
      : random.int(1, Math.min(2, service.bookingRules.maxQuantity));
    const addons = service.addons.filter(() => random.chance(0.25));
    const unitPrice = service.price;
    const subtotal = service.priceUnit === "flat" ? unitPrice : unitPrice * quantity;
    const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
    const total = subtotal + addonsTotal;

    let status: BookingStatus;
    if (offset > 0) status = random.chance(0.06) ? "cancelled" : "completed";
    else status = service.bookingRules.requiresConfirmation && random.chance(0.45) ? "pending" : random.chance(0.05) ? "cancelled" : "confirmed";

    const { rate } = resolveCommission({
      rules: commissionRules,
      vendorId: vendor.id,
      vendorRate: vendor.commissionRate,
      vendorPlan: vendor.plan,
      categoryTrailIds: [service.categoryId],
    });

    bookingSequence += 1;
    const bookingNumber = `${site.bookingPrefix}-${bookingSequence}`;
    const depositAmount = Math.round((total * service.bookingRules.depositPercent) / 100);
    bookings.push({
      id: `bkg-${bookingSequence}`,
      bookingNumber,
      serviceId: service.id,
      serviceName: service.name,
      serviceSlug: service.slug,
      vendorId: vendor.id,
      vendorName: vendor.name,
      userId: null,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      scheduledAt,
      durationMinutes: service.durationMinutes,
      quantity,
      addons,
      location: service.modes.includes("online")
        ? "Video call"
        : service.modes[0] === "at_vendor"
          ? vendor.address
          : `${random.int(2, 220)}, ${random.pick(STREETS)}`,
      city: service.serviceArea.includes(customer.city) ? customer.city : service.city,
      status,
      notes: random.chance(0.3) ? random.pick(["Please call on arrival.", "Gate code 2241.", "Parking available in the basement.", "We have a dog, he is friendly."]) : "",
      unitPrice,
      subtotal,
      addonsTotal,
      total,
      depositAmount,
      paymentStatus: status === "cancelled" ? "refunded" : status === "completed" ? "paid" : depositAmount > 0 ? "paid" : "pending",
      commissionRate: rate,
      commissionAmount: commissionOn(total, rate),
      image: service.images[0]!,
      cancellationReason: status === "cancelled" ? random.pick(["Date changed", "Booked another provider", "Event postponed"]) : null,
      createdAt,
      updatedAt: createdAt,
    });

    customer.bookingCount += 1;
    if (status !== "cancelled") customer.totalSpent += total;
    if (!customer.lastActiveAt || customer.lastActiveAt < createdAt) customer.lastActiveAt = createdAt;

    if (status !== "pending" || depositAmount > 0) {
      transactions.push({
        id: `txn-${transactionSequence++}`,
        reference: bookingNumber,
        kind: "booking",
        customerName: customer.name,
        method: random.pick(["upi", "card"] as const),
        amount: status === "completed" ? total : depositAmount || total,
        status: status === "cancelled" ? "refunded" : "succeeded",
        gatewayRef: `pay_B${bookingSequence}${random.int(1000, 9999)}`,
        failureReason: null,
        createdAt,
      });
    }
  }

  /* --- Reviews --- */
  const reviews: Review[] = [];
  let reviewSequence = 1;
  const ratingFor = (target: number) =>
    Math.max(1, Math.min(5, Math.round(target + random.weighted([[0, 60], [0.5, 15], [-0.5, 12], [-1, 8], [-2, 5]] as const))));

  const addReview = (
    subjectType: Review["subjectType"],
    subjectId: string,
    subjectName: string,
    vendorId: string,
    lines: Array<[string, string]>,
    target: number,
    status: ReviewStatus = "published",
  ) => {
    const customer = random.pick(customers);
    const [title, body] = random.pick(lines);
    const rating = status === "flagged" ? random.int(1, 2) : ratingFor(target);
    reviews.push({
      id: `rev-${reviewSequence++}`,
      subjectType,
      subjectId,
      subjectName,
      vendorId,
      userId: null,
      authorName: `${customer.name.split(" ")[0]} ${customer.name.split(" ")[1]![0]}.`,
      authorCity: cities.find((city) => city.slug === customer.city)!.name,
      rating,
      title,
      body,
      status,
      isVerifiedPurchase: status !== "flagged" && random.chance(0.85),
      helpfulCount: random.int(0, 24),
      vendorReply: status === "published" && rating <= 3 && random.chance(0.7)
        ? "Thank you for the honest feedback. We have reached out to make this right."
        : status === "published" && random.chance(0.15)
          ? "Thank you so much! It means a lot to our small team."
          : null,
      createdAt: daysAgo(random.int(1, 85), random.int(8, 22)),
    });
  };

  for (const product of live) {
    const count = Math.min(6, 2 + Math.floor(product.ratingCount / 80));
    const lines = REVIEW_LINES[verticalOf(product.categoryId)] ?? REVIEW_LINES["cat-fashion"]!;
    for (let index = 0; index < count; index += 1) {
      addReview("product", product.id, product.name, product.vendorId, lines, product.rating);
    }
  }
  for (const service of liveServices) {
    const count = Math.min(6, 2 + Math.floor(service.ratingCount / 40));
    for (let index = 0; index < count; index += 1) {
      addReview("service", service.id, service.name, service.vendorId, REVIEW_LINES.service!, service.rating);
    }
  }
  for (const vendor of vendors.filter((entry) => entry.status === "approved")) {
    addReview("vendor", vendor.id, vendor.name, vendor.id, REVIEW_LINES.service!, vendor.rating);
  }
  // A moderation queue.
  for (let index = 0; index < 4; index += 1) {
    const product = random.pick(live);
    addReview("product", product.id, product.name, product.vendorId, FLAGGED_LINES, 2, "flagged");
  }
  for (let index = 0; index < 5; index += 1) {
    const product = random.pick(live);
    addReview("product", product.id, product.name, product.vendorId, REVIEW_LINES[verticalOf(product.categoryId)] ?? REVIEW_LINES.service!, product.rating, "pending");
  }

  /* --- Payouts: fortnightly, per vendor --- */
  const payouts: Payout[] = [];
  let payoutSequence = 1;
  for (const vendor of vendors.filter((entry) => entry.status === "approved" || entry.status === "suspended")) {
    for (let period = 6; period >= 0; period -= 1) {
      const end = SEED_NOW - period * 14 * 86_400_000;
      const start = end - 14 * 86_400_000;
      const inPeriod = (iso: string) => Date.parse(iso) >= start && Date.parse(iso) < end;

      const vendorOrders = orders
        .flatMap((order) => order.vendorOrders)
        .filter((vo) => vo.vendorId === vendor.id && vo.status === "delivered" && inPeriod(vo.createdAt));
      const vendorBookings = bookings.filter((booking) => booking.vendorId === vendor.id && booking.status === "completed" && inPeriod(booking.scheduledAt));
      const returned = orders
        .flatMap((order) => order.vendorOrders)
        .filter((vo) => vo.vendorId === vendor.id && vo.status === "returned" && inPeriod(vo.createdAt));

      const grossSales =
        vendorOrders.reduce((sum, vo) => sum + vo.total, 0) + vendorBookings.reduce((sum, booking) => sum + booking.total, 0);
      if (grossSales === 0) continue;
      const commission =
        vendorOrders.reduce((sum, vo) => sum + vo.commissionAmount, 0) +
        vendorBookings.reduce((sum, booking) => sum + booking.commissionAmount, 0);
      const adjustments = -returned.reduce((sum, vo) => sum + vo.vendorEarnings, 0);

      const status: Payout["status"] =
        vendor.status === "suspended" ? "on_hold" : period === 0 ? "scheduled" : period === 1 ? "processing" : "paid";

      payouts.push({
        id: `pay-${payoutSequence}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        periodStart: new Date(start).toISOString(),
        periodEnd: new Date(end).toISOString(),
        grossSales,
        commission,
        adjustments,
        netAmount: grossSales - commission + adjustments,
        status,
        reference: status === "paid" ? `UTR${String(9_100_000_000 + payoutSequence * 7331)}` : null,
        paidAt: status === "paid" ? new Date(end + 2 * 86_400_000).toISOString() : null,
        createdAt: new Date(end).toISOString(),
      });
      payoutSequence += 1;
    }
  }

  /* --- Refunds: every returned vendor order, plus a few open requests --- */
  const refunds: Refund[] = [];
  let refundSequence = 1;
  for (const order of orders) {
    for (const vo of order.vendorOrders) {
      if (vo.status === "returned") {
        refunds.push({
          id: `ref-${refundSequence++}`,
          reference: vo.number,
          vendorId: vo.vendorId,
          vendorName: vo.vendorName,
          customerName: order.customerName,
          amount: vo.total,
          reason: random.pick(["Size did not fit", "Colour different from photos", "Changed mind"]),
          status: "processed",
          createdAt: vo.updatedAt,
        });
      }
    }
  }
  const recentDelivered = orders.filter((order) => order.status === "delivered").slice(-30);
  for (let index = 0; index < 4; index += 1) {
    const order = random.pick(recentDelivered);
    const vo = order.vendorOrders[0]!;
    refunds.push({
      id: `ref-${refundSequence++}`,
      reference: vo.number,
      vendorId: vo.vendorId,
      vendorName: vo.vendorName,
      customerName: order.customerName,
      amount: vo.items[0]!.lineTotal,
      reason: random.pick(["Item arrived damaged", "Wrong variant delivered", "Missing item in package", "Quality not as described"]),
      status: index === 0 ? "approved" : "requested",
      createdAt: daysAgo(random.int(0, 4), random.int(9, 20)),
    });
  }

  /* --- Disputes --- */
  const disputeSeeds: Array<[string, string, Dispute["status"], string | null]> = [
    ["vendor-quickfix", "Laptop returned with a new fault after repair", "escalated", null],
    ["vendor-quickfix", "Technician did not arrive; visit fee charged", "open", null],
    ["vendor-quickfix", "Charged for parts that were not replaced", "under_review", null],
    ["vendor-quickfix", "Phone screen replaced with non-genuine part", "open", null],
    ["vendor-stride", "Sole separated within two weeks", "resolved", "Vendor resoled free of charge; customer satisfied."],
    ["vendor-techhub", "Earbud case not charging, replacement delayed", "under_review", null],
    ["vendor-petal", "Bouquet delivered two hours late to venue", "resolved", "Partial refund of Rs 1,000 issued by vendor."],
    ["vendor-crafted", "Side table arrived with a cracked leg", "open", null],
  ];
  const disputes: Dispute[] = disputeSeeds.map(([vendorId, reason, status, resolution], index) => {
    const vendor = vendorById.get(vendorId)!;
    const vendorOrder = orders.flatMap((order) => order.vendorOrders).filter((vo) => vo.vendorId === vendorId).at(-1 - index);
    const createdAt = daysAgo(random.int(1, 30), random.int(9, 20));
    return {
      id: `dsp-${index + 1}`,
      reference: vendorOrder?.number ?? `${site.orderPrefix}-${23900 + index}`,
      vendorId,
      vendorName: vendor.name,
      customerName: vendorOrder?.customerName ?? random.pick(customers).name,
      reason,
      amount: vendorOrder?.total ?? random.int(800, 6000),
      status,
      resolution,
      createdAt,
      updatedAt: createdAt,
    };
  });

  return {
    customers,
    orders: orders.reverse(),
    bookings: bookings.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    reviews,
    transactions: transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    payouts: payouts.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)),
    refunds: refunds.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    disputes,
    orderSequence,
    bookingSequence,
  };
}
