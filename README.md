# Karthika

An editorial e-commerce storefront for a fictional saree atelier in Chennai.
Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Supabase Postgres and
Firebase Authentication.

```bash
npm install
npm run dev
```

That is the whole setup. **No environment variables are required.** With an
empty `.env.local` the site runs on the seed catalogue in
`src/lib/data/catalog.ts`: 28 products, browsing, filtering, search, bag,
wishlist and guest checkout with cash on delivery all work. Supabase, Firebase
and Razorpay each switch on independently when their keys appear.

---

## How the data layer is arranged

Every page and route handler talks to one interface, `Repository`
(`src/lib/data/repository.ts`), and never to a database client directly.

```
             getRepository()
                    |
      SUPABASE_SERVICE_ROLE_KEY set?
         /                      \
        yes                      no
         |                        |
 SupabaseRepository         MockRepository
 (Postgres, real)           (catalog.ts, in-memory writes)
```

Both return identical domain objects in camelCase, so **swapping from seed data
to Supabase changes no component and no page**. Filtering, sorting, faceting and
pagination are pure functions in `src/lib/data/filters.ts`, shared by both, so
the two cannot drift.

### Connecting Supabase

1. Create a project.
2. Run, in order, in the SQL editor:
   - `supabase/schema.sql` — tables, indexes, enums, and the `commit_order_stock`
     function that decrements stock under a row lock.
   - `supabase/policies.sql` — Row Level Security and the storage buckets.
   - `supabase/seed.sql` — the catalogue. Generated; run `npm run db:seed` to
     regenerate it from `catalog.ts`.
3. Put `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in
   `.env.local`. The next request uses the database.

---

## Security model

- **Prices are never taken from the browser.** The bag stores product ids and
  quantities. `src/lib/cart/price.ts` re-reads every price from the catalogue
  and recomputes shipping and totals server-side; `/api/checkout` refuses the
  order if anything moved underneath the customer.
- **Identity comes only from a verified session cookie.** Sign-in exchanges a
  Firebase ID token for an httpOnly, `sameSite=lax` session cookie at
  `/api/auth/session`. `requireUser()` verifies it with `checkRevoked: true` on
  every protected request. A UID in a request body is never trusted.
- **Customers can only reach their own rows.** Orders, addresses and wishlists
  are always queried by the UID on the cookie, and updates and deletes are
  additionally scoped by `user_id` in SQL, so a guessed id reaches nothing.
- **RLS denies the anon key everything customer-owned.** The browser only ever
  holds the anon key, which can read the published catalogue and nothing else.
  The service-role key is server-only, enforced by the `server-only` package.
- **Payments are confirmed by signature, not by the browser.** `/api/razorpay/verify`
  checks the HMAC before marking an order paid, and the webhook verifies against
  the raw request body. Stock commitment is idempotent, so a retried webhook
  changes nothing.
- **Admin is an allowlist** (`ADMIN_EMAILS`) checked on a verified session, and
  re-checked inside the server action that writes, because a server action is a
  public endpoint whatever page rendered it.

The edge middleware only checks that a session cookie *exists*, to avoid
rendering a protected page for someone plainly signed out. It is a convenience,
never the authorisation boundary — the Admin SDK cannot run on the edge.

---

## Imagery

No photography has been shot, so every `image_url` is `null` and
`components/ui/media.tsx` renders a woven placeholder instead: a soft wash in
the garment's own tone, a warp-and-weft texture, and a border stripe down one
edge. Composition varies deterministically per image id, so a grid does not
read as one repeated swatch.

To use real photographs, set `url` on the image (or `image_url` in Postgres) and
`next/image` takes over. **Nothing else changes** — not the component, not the
layout, not the aspect ratios. Storage paths follow the agreed convention:

```
product-images/products/{productId}/{timestamp}.jpg
category-images/banners/{bannerId}-{timestamp}/{timestamp}.jpg
```

---

## Design system

Tokens live at the top of `src/app/globals.css` as Tailwind 4 `@theme`
variables — there is no `tailwind.config.js`.

| | |
|---|---|
| Ground | `ivory` `paper` `shell` `sand` — warm, never `#ffffff` |
| Line | `stone` `stone-soft` — every border is a hairline |
| Ink | `ink` `graphite` `taupe` `taupe-soft` |
| Accent | `terracotta` (action), `maroon` (festive), `olive`, `brass` |
| Display | Cormorant Garamond, weight 300, via `.display-xl/lg/md/sm` |
| UI | Inter, with `.eyebrow` for the letterspaced uppercase labels |
| Motion | 160/240/300ms on one curve, `--ease-drape`. Nothing bounces. |

Corners are square throughout, shadows are used once (the drawer), and
`prefers-reduced-motion` disables every transition.

---

## Layout

```
src/
  app/                     routes; server components by default
    api/                   cart pricing, checkout, auth, wishlist,
                           addresses, search, razorpay
    admin/                 guarded, separate shell from the shop
  components/
    layout/  home/  product/  shop/  cart/  checkout/  account/  auth/
    providers/             the one client boundary, mounted in the root layout
    ui/                    media, drawer, accordion, buttons, primitives
  lib/
    data/                  types, catalogue, repository interface + both impls
    cart/                  server-side pricing
    checkout/              one zod schema, used by the form and the server
    auth/  firebase/  payments/  shop/
supabase/                  schema.sql, policies.sql, seed.sql (generated)
scripts/generate-seed.ts   catalog.ts -> seed.sql
```

---

## Scripts

| | |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:seed` | regenerate `supabase/seed.sql` from `catalog.ts` |

---

## What is deliberately not built

- **Product size/colour variant matrix.** Sarees are single-size and each piece
  is its own SKU, so `products` carries fabric, colour and stock directly. The
  schema would need `product_variants` and a matrix builder if the shop later
  sells blouses or lehengas.
- **Admin create/edit forms.** The admin shell, guard, order management and
  catalogue view are built. Product editing needs Supabase writes and Storage
  uploads, so it waits for the database; every repository method those forms
  would call already exists.
- **A live Razorpay transaction.** The create-order, signature verification and
  webhook handlers are written against the Razorpay API, but they have not been
  run against real keys. Do the ₹1 live smoke test before go-live.
