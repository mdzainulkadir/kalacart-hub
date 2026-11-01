# Roadmap — KalaCart B2B layer (additive only)

- [ ] Migration: products.moq + products.tier_prices (+ backfill), new rfqs table with anon INSERT-only RLS
- [ ] Regenerate Supabase types after migration
- [ ] lib: Product type + tier helpers; Retail/Business mode store (localStorage)
- [ ] Header: Retail | Business toggle (desktop + mobile)
- [ ] ProductCard: business pricing line ("From ₹X/unit · MOQ N")
- [ ] Product page: tier price table + Request Quote form (GSTIN validation, qty ≥ MOQ) in Business mode
- [ ] Server fns: createRfq (short_code, server-side MOQ check), listRfqs, acceptRfq (bulk order)
- [ ] /rfq/:code status page + GET server route /api/rfq/$code (row only, by short_code)
- [ ] Dashboard: Listings / RFQ Inbox tabs, Reply on WhatsApp (QUOTE <CODE>), Export catalog CSV, /catalog link
- [ ] /catalog print-friendly "GeM / ONDC-ready catalog" page
- [ ] Webhook: QUOTE handler before existing logic (phone match, quoted_price/quoted_at/status, safe reply)
- [ ] PWA: manifest + 192/512 icons + head tags (no service worker)
- [ ] Verify: typecheck, build, Playwright end-to-end (business mode, RFQ submit → status page, dashboard inbox, catalog)
