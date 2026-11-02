-- KalaCart B2B setup. Run once in Lovable Cloud -> SQL editor.
-- Safe to re-run: uses IF NOT EXISTS where possible.

-- 1) Bulk-order fields on products
alter table products add column if not exists moq int not null default 10;
alter table products add column if not exists tier_prices jsonb;

-- Cheaper items get a higher minimum order quantity
update products set moq = case
  when price < 300 then 20
  when price < 800 then 10
  else 5
end;

-- Three price tiers: at MOQ (-10%), 50+ units (-18%), 100+ units (-25%)
update products set tier_prices = jsonb_build_array(
  jsonb_build_object('min', moq, 'price', round(price * 0.90)),
  jsonb_build_object('min', 50,  'price', round(price * 0.82)),
  jsonb_build_object('min', 100, 'price', round(price * 0.75))
);

-- 2) Request-for-quote table
create table if not exists rfqs (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  product_id uuid references products(id) not null,
  company_name text not null,
  gstin text,
  contact_name text not null,
  contact_phone text not null,
  quantity int not null check (quantity > 0),
  needed_by date,
  delivery_city text,
  notes text,
  status text not null default 'open'
    check (status in ('open','quoted','accepted','closed')),
  quoted_price numeric,
  quoted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table rfqs enable row level security;

-- Anyone may submit an RFQ. Nobody can read the table directly from the browser;
-- reads and quote updates go through server routes using the service role.
drop policy if exists "anon can insert rfqs" on rfqs;
create policy "anon can insert rfqs" on rfqs for insert to anon with check (true);
