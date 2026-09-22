-- =============================================================================
-- Karthika - PostgreSQL schema
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
-- categories
-- -----------------------------------------------------------------------------

create table if not exists categories (
  id            text primary key,
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

drop trigger if exists categories_updated_at on categories;
create trigger categories_updated_at before update on categories
  for each row execute function set_updated_at();

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
-- -----------------------------------------------------------------------------

create table if not exists products (
  id                 text primary key,
  name               text not null,
  slug               text not null unique,
  short_description  text not null default '',
  description        text not null default '',
  story              text not null default '',

  -- Whole rupees. Sarees are never priced in paise and integers keep the
  -- arithmetic in the order pipeline exact.
  price              integer not null check (price >= 0),
  compare_at_price   integer check (compare_at_price is null or compare_at_price > price),

  fabric             text not null,
  color              text not null,
  tone               tone not null,
  weave              text not null default '',
  craft_tags         text[] not null default '{}',
  occasions          occasion[] not null default '{}',

  length_metres      numeric(4,2) not null default 6.30,
  width_metres       numeric(4,2) not null default 1.15,
  blouse_piece       text not null default '',
  care               text[] not null default '{}',

  category_id        text not null references categories (id) on delete restrict,
  collection_id      text references collections (id) on delete set null,

  stock_quantity     integer not null default 0 check (stock_quantity >= 0),
  is_featured        boolean not null default false,
  is_new             boolean not null default false,
  is_active          boolean not null default true,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- The listing page filters on these columns on every request.
create index if not exists products_category_idx    on products (category_id) where is_active;
create index if not exists products_collection_idx  on products (collection_id) where is_active;
create index if not exists products_price_idx       on products (price) where is_active;
create index if not exists products_created_idx     on products (created_at desc) where is_active;
create index if not exists products_featured_idx    on products (is_featured) where is_active;
create index if not exists products_new_idx         on products (is_new) where is_active;
create index if not exists products_fabric_idx      on products (fabric) where is_active;
create index if not exists products_tone_idx        on products (tone) where is_active;
create index if not exists products_occasions_idx   on products using gin (occasions);
create index if not exists products_craft_tags_idx  on products using gin (craft_tags);

-- Free-text search across the fields a customer actually types.
create index if not exists products_search_idx on products using gin (
  to_tsvector(
    'english',
    coalesce(name, '') || ' ' ||
    coalesce(fabric, '') || ' ' ||
    coalesce(color, '') || ' ' ||
    coalesce(weave, '') || ' ' ||
    coalesce(short_description, '')
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

  -- Denormalised on purpose: an order must still read correctly in five
  -- years, after the product has been renamed, repriced or deleted.
  name        text not null,
  slug        text not null,
  fabric      text not null default '',
  color       text not null default '',
  image_url   text,
  image_alt   text not null default '',
  image_tone  tone not null default 'sand',

  quantity    integer not null check (quantity > 0),
  unit_price  integer not null check (unit_price >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists order_items_order_idx on order_items (order_id);

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
