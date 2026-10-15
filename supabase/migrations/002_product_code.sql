-- Product codes: every product gets a unique, auto-generated code like F0001.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- Existing products get a code automatically; new ones get the next number.

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
