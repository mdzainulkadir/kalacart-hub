ALTER TABLE public.products
  ADD COLUMN moq integer NOT NULL DEFAULT 10,
  ADD COLUMN tier_prices jsonb;

COMMENT ON COLUMN public.products.moq IS 'Minimum order quantity for bulk (B2B) purchases';
COMMENT ON COLUMN public.products.tier_prices IS 'Bulk tier pricing: [{"min":N,"price":rupees}]';

-- Backfill: cheaper items get a higher minimum order quantity (5-20)
UPDATE public.products SET
  moq = CASE
    WHEN price < 500 THEN 20
    WHEN price < 1000 THEN 15
    WHEN price < 2000 THEN 10
    WHEN price < 3000 THEN 8
    ELSE 5
  END;

-- Backfill tier prices from retail price, rounded to whole rupees
UPDATE public.products SET tier_prices = jsonb_build_array(
  jsonb_build_object('min', moq, 'price', round(price * 0.90)),
  jsonb_build_object('min', 50, 'price', round(price * 0.82)),
  jsonb_build_object('min', 100, 'price', round(price * 0.75))
);

CREATE TABLE public.rfqs (
  id uuid primary key default gen_random_uuid(),
  short_code text not null unique,
  product_id uuid not null references public.products(id),
  company_name text not null,
  gstin text not null,
  contact_name text not null,
  contact_phone text not null,
  quantity integer not null,
  needed_by date not null,
  delivery_city text not null,
  notes text,
  status text not null default 'open',
  quoted_price numeric,
  quoted_at timestamptz,
  created_at timestamptz not null default now()
);

GRANT INSERT ON public.rfqs TO anon, authenticated;
GRANT ALL ON public.rfqs TO service_role;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a bulk quote request"
  ON public.rfqs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies: RFQs are read and quoted only through
-- server code (status page by short_code, seller dashboard, WhatsApp webhook).