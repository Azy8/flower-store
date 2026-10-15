-- Undo 002_product_code.sql: product codes are no longer used
-- (customers now send a direct link to the product instead).
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run. Safe to run more than once.

drop trigger if exists products_keep_code on public.products;
drop function if exists public.keep_product_code();
alter table public.products drop column if exists code;
drop sequence if exists public.product_code_seq;
