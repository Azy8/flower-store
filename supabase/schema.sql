-- Run once in Supabase: Dashboard → SQL Editor → paste all → Run.
-- The website only uses the publishable key, so Row Level Security decides who can do what:
--   • everyone      → read categories, settings and VISIBLE products, view photos
--   • shop admins   → add / edit / delete everything (listed in public.admins)
-- Any other logged-in user gets the same rights as a visitor.

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  -- "restrict": a category that still has products can't be deleted
  category_id uuid not null references public.categories (id) on delete restrict,
  price text not null default '' check (char_length(price) <= 60),
  description text not null default '' check (char_length(description) <= 2000),
  tag text not null default '' check (char_length(tag) <= 30),
  image_path text,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);

-- Single-row table for shop info
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  shop_name text not null default 'ຮ້ານດອກໄມ້',
  tagline text not null default 'ຮ້ານດອກໄມ້',
  headline text not null default 'ເບິ່ງແບບດອກໄມ້ທີ່ຮ້ານມີ ເລືອກແລ້ວທັກຮ້ານໄດ້ເລີຍ',
  phone text not null default '',
  line_id text not null default '',
  whatsapp text not null default '',
  facebook_url text not null default '',
  address text not null default '',
  hours text not null default ''
);

-- Who may manage the shop
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- security definer: can read public.admins even though visitors can't
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- ---------- Product codes (F0001, F0002, ...) ----------
-- same as migrations/002_product_code.sql
create sequence if not exists public.product_code_seq;

-- Admins insert products, so they need to draw numbers from the sequence
grant usage, select on sequence public.product_code_seq to authenticated;

alter table public.products
  add column if not exists code text not null unique
  default ('F' || lpad(nextval('public.product_code_seq')::text, 4, '0'));

-- Codes never change once given (so a code a customer sent stays valid)
create or replace function public.keep_product_code() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.code := old.code;
  return new;
end $$;

drop trigger if exists products_keep_code on public.products;
create trigger products_keep_code before update on public.products
  for each row execute function public.keep_product_code();

-- ---------- Row Level Security ----------

alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.settings   enable row level security;
alter table public.admins     enable row level security; -- no policies: not readable via the API

drop policy if exists "categories: public read" on public.categories;
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin write" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products: read visible or admin" on public.products;
drop policy if exists "products: admin write" on public.products;
create policy "products: read visible or admin" on public.products for select
  using (visible or public.is_admin());
create policy "products: admin write" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings: public read" on public.settings;
drop policy if exists "settings: admin write" on public.settings;
create policy "settings: public read" on public.settings for select using (true);
create policy "settings: admin write" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Photo storage ----------

-- Public bucket: anyone can VIEW photos by URL; only admins can upload/delete (policies below).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "product-images: admin read" on storage.objects;
drop policy if exists "product-images: admin upload" on storage.objects;
drop policy if exists "product-images: admin update" on storage.objects;
drop policy if exists "product-images: admin delete" on storage.objects;
create policy "product-images: admin read" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------- Starting data ----------

insert into public.settings (id) values (1) on conflict (id) do nothing;
insert into public.categories (name, sort) values
  ('ຊໍ່ດອກໄມ້', 1), ('ກະຕ່າດອກໄມ້', 2), ('ພວງມາລາ', 3)
on conflict (name) do nothing;

-- ---------- Make yourself an admin ----------
-- 1) Dashboard → Authentication → Users → "Add user" (email + password, tick Auto Confirm)
-- 2) Put that email below and run just this statement:
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'your-email@example.com'
-- on conflict do nothing;
