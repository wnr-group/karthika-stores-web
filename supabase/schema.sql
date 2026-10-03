-- =============================================================================
-- Karthika marketplace - PostgreSQL schema
--
-- Run this once against a fresh Supabase project (SQL Editor, or
-- `supabase db execute -f supabase/schema.sql`). Then run `policies.sql`,
-- then `seed.sql`.
--
-- Identity note: authentication is Firebase, not Supabase Auth, so the join
-- key throughout is `profiles.firebase_uid` (the Firebase UID string), and
-- `auth.uid()` is never used. Row Level Security therefore denies the anon
-- key on every customer table; the Next.js server reaches those tables with
-- the service-role key and does its own authorisation. See policies.sql.
--
-- Marketplace note: this schema is generic by design. `products` carries no
-- category-specific column (no "fabric", no "weave"); those live in
-- `products.attributes`, shaped per category by `attribute_definitions`. A
-- `vendor` can list products, services, or both, and every listing resolves
-- its commission through `commission_rules` at product > vendor > category >
-- global granularity. See src/lib/types.ts for the TypeScript mirror of all
-- of this.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------

do $$ begin
  create type image_kind as enum ('primary', 'draped', 'detail', 'border', 'fabric', 'lifestyle');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tone as enum ('ivory','sand','terracotta','maroon','olive','indigo','saffron','rose','charcoal','teal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type occasion as enum ('everyday','work','festive','ceremony','wedding');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','paid','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('razorpay','cod');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_status as enum ('pending','approved','suspended','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_kind as enum ('product','service');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attribute_input_type as enum ('text','number','boolean','select','multiselect');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_type as enum ('shipping','local_delivery','pickup','digital');
exception when duplicate_object then null; end $$;

do $$ begin
  create type service_price_unit as enum ('flat','per_hour','per_person','per_unit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type commission_scope as enum ('global','category','vendor','product');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_subject as enum ('product','service','vendor');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

create table if not exists profiles (
  id             uuid primary key default gen_random_uuid(),
  firebase_uid   text not null unique,
  email          text not null,
  display_name   text,
  phone          text,
  marketing_opt_in boolean not null default false,
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists profiles_firebase_uid_idx on profiles (firebase_uid);
create index if not exists profiles_email_idx on profiles (lower(email));

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- vendors
--
-- Every product and service belongs to one of these. The original storefront
-- ("Karthika") is simply the first, largest, pre-approved row.
-- -----------------------------------------------------------------------------

create table if not exists vendors (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  tagline           text not null default '',
  description       text not null default '',
  logo_url          text,
  cover_image_url   text,
  location_city     text not null default '',
  location_state    text not null default '',
  contact_email     text not null,
  contact_phone     text not null default '',
  status            vendor_status not null default 'pending',
  -- Overrides category/global commission for every listing this vendor owns.
  -- Null defers to the next scope up; see commission_rules.
  commission_rate   numeric(5,2),
  rating            numeric(3,2) not null default 0,
  rating_count      integer not null default 0,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists vendors_status_idx on vendors (status);
create index if not exists vendors_featured_idx on vendors (is_featured) where status = 'approved';

drop trigger if exists vendors_updated_at on vendors;
create trigger vendors_updated_at before update on vendors
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- categories
--
-- Product categories and service categories share this one tree (see `kind`)
-- but a query always filters to one or the other; a customer never finds a
-- haircut by paging through sarees. `parent_id` is groundwork for a
-- vertical > category > subcategory hierarchy; the seed data does not nest
-- yet, so every row today has a null parent.
-- -----------------------------------------------------------------------------

create table if not exists categories (
  id            text primary key,
  parent_id     text references categories (id) on delete set null,
  kind          category_kind not null default 'product',
  name          text not null,
  slug          text not null unique,
  description   text not null default '',
  intro         text,
  image_url     text,
  image_alt     text not null default '',
  image_tone    tone not null default 'sand',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists categories_display_order_idx on categories (display_order);
create index if not exists categories_kind_idx on categories (kind);
create index if not exists categories_parent_idx on categories (parent_id);

drop trigger if exists categories_updated_at on categories;
create trigger categories_updated_at before update on categories
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- attribute_definitions
--
-- What a category's listings carry beyond the fields every product already
-- has. A vendor's "add product" form and a product page's details panel
-- render themselves from this rather than from a hardcoded field list.
-- Values live in products.attributes (jsonb), not in a row-per-value EAV
-- table: the catalogue is sized in the hundreds to low thousands of listings,
-- where jsonb's flexibility is worth more than relational purity.
-- -----------------------------------------------------------------------------

create table if not exists attribute_definitions (
  id              text primary key,
  category_id     text not null references categories (id) on delete cascade,
  key             text not null,
  label           text not null,
  input_type      attribute_input_type not null default 'text',
  -- [{ "value": "necklace", "label": "Necklace" }, ...] for select/multiselect.
  options         jsonb,
  unit            text,
  is_required     boolean not null default false,
  is_filterable   boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (category_id, key)
);

create index if not exists attribute_definitions_category_idx
  on attribute_definitions (category_id, display_order);

-- -----------------------------------------------------------------------------
-- collections
-- -----------------------------------------------------------------------------

create table if not exists collections (
  id            text primary key,
  name          text not null,
  slug          text not null unique,
  description   text not null default '',
  story         text not null default '',
  image_url     text,
  image_alt     text not null default '',
  image_tone    tone not null default 'sand',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists collections_display_order_idx on collections (display_order);

drop trigger if exists collections_updated_at on collections;
create trigger collections_updated_at before update on collections
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- products
--
-- Generic across every category the marketplace carries. Category-specific
-- facts (fabric, stone type, spice level, ...) live in `attributes`, not as
-- dedicated columns; see `attribute_definitions`.
-- -----------------------------------------------------------------------------

create table if not exists products (
  id                 text primary key,
  vendor_id          uuid not null references vendors (id) on delete cascade,
  name               text not null,
  slug               text not null unique,
  short_description  text not null default '',
  -- The one line shown under the name on a card and in the cart/order
  -- summary: "Pure Kanchipuram Silk", "925 Sterling Silver", "Serves 4".
  subtitle           text not null default '',
  description        text not null default '',
  story              text not null default '',

  -- Whole rupees. Nothing in this catalogue is priced in paise, and integers
  -- keep the arithmetic in the order pipeline exact.
  price              integer not null check (price >= 0),
  compare_at_price   integer check (compare_at_price is null or compare_at_price > price),

  color              text not null default '',
  tone               tone not null,
  tags               text[] not null default '{}',
  occasions          occasion[] not null default '{}',
  -- Category-specific fields, keyed by attribute_definitions.key for this
  -- product's category_id. Not database-enforced against that table.
  attributes         jsonb not null default '{}',
  fulfillment_type   fulfillment_type not null default 'shipping',

  category_id        text not null references categories (id) on delete restrict,
  collection_id      text references collections (id) on delete set null,

  stock_quantity     integer not null default 0 check (stock_quantity >= 0),
  is_featured        boolean not null default false,
  is_new             boolean not null default false,
  is_active          boolean not null default true,

  -- Overrides the vendor/category/global commission for this one listing.
  commission_rate    numeric(5,2),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- The listing page filters on these columns on every request.
create index if not exists products_vendor_idx      on products (vendor_id) where is_active;
create index if not exists products_category_idx    on products (category_id) where is_active;
create index if not exists products_collection_idx  on products (collection_id) where is_active;
create index if not exists products_price_idx       on products (price) where is_active;
create index if not exists products_created_idx     on products (created_at desc) where is_active;
create index if not exists products_featured_idx    on products (is_featured) where is_active;
create index if not exists products_new_idx         on products (is_new) where is_active;
create index if not exists products_tone_idx        on products (tone) where is_active;
create index if not exists products_occasions_idx   on products using gin (occasions);
create index if not exists products_tags_idx        on products using gin (tags);
create index if not exists products_attributes_idx  on products using gin (attributes);

-- Free-text search across the fields a customer actually types. `attributes`
-- is folded in as text so "silk" or "kundan" still matches regardless of
-- which category's attribute carries it.
create index if not exists products_search_idx on products using gin (
  to_tsvector(
    'english',
    coalesce(name, '') || ' ' ||
    coalesce(subtitle, '') || ' ' ||
    coalesce(color, '') || ' ' ||
    coalesce(short_description, '') || ' ' ||
    coalesce(attributes::text, '')
  )
);

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- product_images
-- -----------------------------------------------------------------------------

create table if not exists product_images (
  id            text primary key,
  product_id    text not null references products (id) on delete cascade,
  -- Null until real photography is uploaded to Storage; the storefront draws
  -- its woven placeholder in `image_tone` in the meantime.
  image_url     text,
  alt_text      text not null default '',
  image_type    image_kind not null default 'primary',
  image_tone    tone not null default 'sand',
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists product_images_product_idx on product_images (product_id, display_order);

-- -----------------------------------------------------------------------------
-- services
--
-- A bookable offering, not a kind of product: no stock, ships nowhere, sold
-- by reserving a slot. See `bookings`.
-- -----------------------------------------------------------------------------

create table if not exists services (
  id                   text primary key,
  vendor_id            uuid not null references vendors (id) on delete cascade,
  category_id          text not null references categories (id) on delete restrict,
  name                 text not null,
  slug                 text not null unique,
  description          text not null default '',
  price                integer not null check (price >= 0),
  price_unit           service_price_unit not null default 'flat',
  duration_minutes     integer,
  location_city        text,
  service_area         text[] not null default '{}',
  booking_rules        jsonb not null default '{}',
  -- [{ "name": "Second outfit change", "price": 2500 }, ...]
  addons               jsonb not null default '[]',
  cancellation_policy  text not null default '',
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists services_vendor_idx on services (vendor_id) where is_active;
create index if not exists services_category_idx on services (category_id) where is_active;

drop trigger if exists services_updated_at on services;
create trigger services_updated_at before update on services
  for each row execute function set_updated_at();

create table if not exists service_images (
  id            text primary key,
  service_id    text not null references services (id) on delete cascade,
  image_url     text,
  alt_text      text not null default '',
  image_type    image_kind not null default 'primary',
  image_tone    tone not null default 'sand',
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists service_images_service_idx on service_images (service_id, display_order);

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------

create table if not exists bookings (
  id                uuid primary key default gen_random_uuid(),
  service_id        text not null references services (id) on delete restrict,
  vendor_id         uuid not null references vendors (id) on delete restrict,
  -- Null for a guest booking, same convention as orders.user_id.
  user_id           text,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  scheduled_at      timestamptz not null,
  duration_minutes  integer,
  status            booking_status not null default 'pending',
  notes             text not null default '',
  -- Frozen at booking time, like an order line's unit price.
  price             integer not null check (price >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists bookings_user_idx on bookings (user_id, scheduled_at desc);
create index if not exists bookings_vendor_idx on bookings (vendor_id, scheduled_at desc);
create index if not exists bookings_service_idx on bookings (service_id);

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- commission_rules
--
-- The override chain product > vendor > category > global. The repository
-- resolves the narrowest rule that applies; see
-- SupabaseRepository.getCommissionRate. `scope_id` is null only for the
-- single 'global' row.
-- -----------------------------------------------------------------------------

create table if not exists commission_rules (
  id          uuid primary key default gen_random_uuid(),
  scope       commission_scope not null,
  scope_id    text,
  -- A percentage, e.g. 10 for 10%.
  rate        numeric(5,2) not null check (rate >= 0 and rate <= 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check ((scope = 'global') = (scope_id is null))
);

create unique index if not exists commission_rules_scope_idx
  on commission_rules (scope, coalesce(scope_id, ''));

drop trigger if exists commission_rules_updated_at on commission_rules;
create trigger commission_rules_updated_at before update on commission_rules
  for each row execute function set_updated_at();

insert into commission_rules (scope, scope_id, rate)
values ('global', null, 10)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------

create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  subject_type  review_subject not null,
  subject_id    text not null,
  user_id       text not null references profiles (firebase_uid) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  title         text,
  body          text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists reviews_subject_idx on reviews (subject_type, subject_id, created_at desc);

-- -----------------------------------------------------------------------------
-- banners (homepage hero, admin-managed)
-- -----------------------------------------------------------------------------

create table if not exists banners (
  id              text primary key,
  eyebrow         text not null default '',
  headline        text not null,
  body            text not null default '',
  cta_label       text not null default '',
  cta_href        text not null default '/shop',
  secondary_label text,
  secondary_href  text,
  image_url       text,
  image_alt       text not null default '',
  image_tone      tone not null default 'maroon',
  is_active       boolean not null default true,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists banners_updated_at on banners;
create trigger banners_updated_at before update on banners
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- addresses
-- -----------------------------------------------------------------------------

create table if not exists addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references profiles (firebase_uid) on delete cascade,
  label          text not null default 'Home',
  name           text not null,
  phone          text not null,
  address_line_1 text not null,
  address_line_2 text,
  city           text not null,
  state          text not null,
  postal_code    text not null,
  country        text not null default 'India',
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists addresses_user_idx on addresses (user_id);
-- At most one default address per customer.
create unique index if not exists addresses_one_default_idx
  on addresses (user_id) where is_default;

drop trigger if exists addresses_updated_at on addresses;
create trigger addresses_updated_at before update on addresses
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- wishlists
-- -----------------------------------------------------------------------------

create table if not exists wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references profiles (firebase_uid) on delete cascade,
  product_id text not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlists_user_idx on wishlists (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- orders
--
-- One order per checkout, even when its lines span several vendors; see
-- order_items.vendor_id. Splitting an order into independent per-vendor
-- fulfilment records is future work the column already supports.
-- -----------------------------------------------------------------------------

create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  -- Null for guest checkout. Not a hard FK so a customer deleting their
  -- account never destroys the shop's financial record.
  user_id          text,
  email            text not null,
  phone            text not null,

  status           order_status not null default 'pending',
  payment_status   payment_status not null default 'pending',
  payment_method   payment_method not null default 'razorpay',

  subtotal         integer not null check (subtotal >= 0),
  shipping_amount  integer not null default 0 check (shipping_amount >= 0),
  total_amount     integer not null check (total_amount >= 0),

  -- Frozen at purchase time. Never a foreign key: addresses get edited.
  shipping_address jsonb not null,

  razorpay_order_id   text,
  razorpay_payment_id text,
  -- Set once stock has been decremented, so a repeated webhook is a no-op.
  stock_committed_at  timestamptz,

  tracking_number  text,
  courier          text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_status_idx on orders (status, created_at desc);
create index if not exists orders_email_idx on orders (lower(email));
create unique index if not exists orders_razorpay_order_idx
  on orders (razorpay_order_id) where razorpay_order_id is not null;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------------

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  product_id  text references products (id) on delete set null,
  -- Which vendor fulfils this line. Denormalised like the rest of the row,
  -- so it survives the product being reassigned or deleted.
  vendor_id   uuid references vendors (id) on delete set null,

  -- Denormalised on purpose: an order must still read correctly in five
  -- years, after the product has been renamed, repriced or deleted.
  name        text not null,
  slug        text not null,
  subtitle    text not null default '',
  color       text not null default '',
  image_url   text,
  image_alt   text not null default '',
  image_tone  tone not null default 'sand',

  quantity    integer not null check (quantity > 0),
  unit_price  integer not null check (unit_price >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_vendor_idx on order_items (vendor_id);

-- -----------------------------------------------------------------------------
-- Stock commitment
--
-- Decrements stock for every line on an order, under a row lock, and only
-- once. Called after a payment is verified. Returns false if the order was
-- already committed, which is the normal path for a duplicate webhook.
-- -----------------------------------------------------------------------------

create or replace function commit_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_committed timestamptz;
  v_item record;
begin
  select stock_committed_at into v_committed
  from orders where id = p_order_id for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  if v_committed is not null then
    return false;
  end if;

  for v_item in
    select product_id, quantity from order_items
    where order_id = p_order_id and product_id is not null
    order by product_id            -- stable lock order, so two concurrent
  loop                             -- checkouts cannot deadlock each other
    update products
       set stock_quantity = greatest(0, stock_quantity - v_item.quantity)
     where id = v_item.product_id;
  end loop;

  update orders set stock_committed_at = now() where id = p_order_id;
  return true;
end;
$$;
