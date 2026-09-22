-- =============================================================================
-- Karthika - Row Level Security
--
-- Run after schema.sql.
--
-- The security model in one paragraph: authentication is Firebase, so
-- `auth.uid()` is meaningless here. The browser is only ever given the anon
-- key, and the anon key can read the published catalogue and nothing else.
-- Orders, addresses, wishlists and profiles are reachable only through the
-- Next.js server using the service-role key, which bypasses RLS, and every
-- one of those server paths verifies a Firebase session cookie and filters by
-- the caller's own UID before it touches a row. RLS here is the second lock,
-- not the only one: if the anon key ever leaks, nothing customer-owned is
-- exposed by it.
-- =============================================================================

alter table categories     enable row level security;
alter table collections    enable row level security;
alter table products       enable row level security;
alter table product_images enable row level security;
alter table banners        enable row level security;
alter table profiles       enable row level security;
alter table addresses      enable row level security;
alter table wishlists      enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;

-- -----------------------------------------------------------------------------
-- Public catalogue: readable by anyone, writable by no one but the service role
-- -----------------------------------------------------------------------------

drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories
  for select to anon, authenticated using (true);

drop policy if exists collections_public_read on collections;
create policy collections_public_read on collections
  for select to anon, authenticated using (true);

-- Unpublished products stay invisible even to a direct anon query.
drop policy if exists products_public_read on products;
create policy products_public_read on products
  for select to anon, authenticated using (is_active);

drop policy if exists product_images_public_read on product_images;
create policy product_images_public_read on product_images
  for select to anon, authenticated using (
    exists (
      select 1 from products
      where products.id = product_images.product_id and products.is_active
    )
  );

drop policy if exists banners_public_read on banners;
create policy banners_public_read on banners
  for select to anon, authenticated using (is_active);

-- -----------------------------------------------------------------------------
-- Customer-owned data: no policy at all for anon or authenticated.
--
-- With RLS enabled and no permissive policy, every select/insert/update/delete
-- from the anon key returns zero rows. Only the service-role key gets through,
-- and only the server holds that. These statements are here so the intent is
-- explicit in the file rather than implied by absence.
-- -----------------------------------------------------------------------------

revoke all on profiles   from anon, authenticated;
revoke all on addresses  from anon, authenticated;
revoke all on wishlists  from anon, authenticated;
revoke all on orders     from anon, authenticated;
revoke all on order_items from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Optional: policies for the day you mint Supabase JWTs carrying the Firebase
-- UID as a custom claim (`request.jwt.claims ->> 'firebase_uid'`). Enable
-- these only if you move customer reads out of the Next.js server and into
-- the browser; until then the revokes above are the stronger position.
-- -----------------------------------------------------------------------------

-- create policy addresses_owner on addresses
--   for all to authenticated
--   using (user_id = current_setting('request.jwt.claims', true)::json ->> 'firebase_uid')
--   with check (user_id = current_setting('request.jwt.claims', true)::json ->> 'firebase_uid');

-- create policy wishlists_owner on wishlists
--   for all to authenticated
--   using (user_id = current_setting('request.jwt.claims', true)::json ->> 'firebase_uid')
--   with check (user_id = current_setting('request.jwt.claims', true)::json ->> 'firebase_uid');

-- create policy orders_owner_read on orders
--   for select to authenticated
--   using (user_id = current_setting('request.jwt.claims', true)::json ->> 'firebase_uid');

-- -----------------------------------------------------------------------------
-- Storage buckets
--
-- Product and category imagery is public-read, service-role-write. Paths
-- follow the convention agreed in the build plan:
--   product-images/products/{productId}/{timestamp}.jpg
--   category-images/banners/{bannerId}-{timestamp}/{timestamp}.jpg
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do nothing;

drop policy if exists product_images_public_download on storage.objects;
create policy product_images_public_download on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images', 'category-images'));
