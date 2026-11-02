# KalaCart B2B build: agent task list

Put this file in the repo root. Start the agent with:

> Read AGENTS.md and B2B_TASKS.md. Do ONLY the task I name, then stop and summarize the files you changed.

Then say "Do Task 0", "Do Task 1", and so on, one at a time.

## Ground rules (apply to every task)
- Work on the git branch `b2b`, never directly on `main`.
- Additive changes only. Do not change existing product, cart, checkout, dashboard, or contact behavior.
- Do not touch `/api/public/whatsapp` except where Task 6 says so.
- Never write real API keys or secrets into any file. Secrets stay in the platform secrets manager.
- After each task run `npm run build`. If it fails, fix it before stopping.
- Keep diffs small. Match the existing code style, Tailwind classes, and shadcn/ui components.
- The database changes in `b2b_setup.sql` are already applied. Do not create migrations.
- Twilio outbound free-text replies are blocked on this trial account (error 21654). Any reply send must be wrapped in try/catch, logged, and must never stop the main action.

## Context
KalaCart is a marketplace connecting artisans (sellers, via WhatsApp) with buyers (web). The project is a TanStack Start app with server routes, Tailwind, shadcn/ui, and a Supabase-style Postgres backend. We are adding a B2B layer: business buyers can see bulk pricing and request quotes. Tables `products` (new columns `moq` int, `tier_prices` jsonb like `[{"min":10,"price":405},{"min":50,"price":369},{"min":100,"price":338}]`) and `rfqs` already exist.

## Task 0: Orientation (no code changes)
Read the repo. Report: how routes are organized, how the browser reads data, how server routes access the database with elevated privileges, where the cart state lives, where the header is, and how `/dashboard` is built. Propose which files each later task will touch.

## Task 1: Types and data
Add `moq` and `tier_prices` to the Product type and every query that selects product fields. Add a small helper `unitPriceFor(product, qty)` that returns the tier price for a quantity (falls back to base price below MOQ). Add a helper `fromPrice(product)` returning the lowest tier price.

## Task 2: Retail / Business toggle
Add a Retail | Business switch to the header, stored in localStorage (guard for SSR). Expose it through a small context hook `useBuyerMode()`. Default is Retail. No visual change in Retail mode.

## Task 3: Business-mode product UI
In Business mode only: product cards show "From ₹X/unit · MOQ N". The product page shows a tier price table and replaces Add to Cart / Buy Now with a "Request Quote" button (it can link to `/rfq/new?product=<id>` for now).

## Task 4: RFQ form and status page
- Page `/rfq/new`: form with company name, GSTIN (15-character GST format validation, optional), contact name, phone, quantity (must be >= MOQ), needed-by date, delivery city, notes.
- On submit, call a server route that generates a unique 6-character uppercase `short_code`, inserts into `rfqs`, and returns the code. Redirect to `/rfq/$code`.
- Page `/rfq/$code`: loads through a server route that returns ONLY the row matching that code. Shows the request details. If `status = 'quoted'`, show the quoted unit price, total, and an "Accept & Place Bulk Order" button that inserts into `orders` (one row, with the quantity) and sets the RFQ to `accepted`.

## Task 5: Seller RFQ inbox
On `/dashboard` add an "RFQ Inbox" tab listing open and quoted RFQs (product, quantity, city, needed-by, short_code, status, quoted price). Each open row gets a "Reply on WhatsApp" button opening `https://wa.me/17372508034?text=QUOTE%20<CODE>%20` in a new tab. Read through a server route (anon cannot read the table).

## Task 6: QUOTE reply over WhatsApp
In `/api/public/whatsapp`, add a branch at the top: if the message text matches `^QUOTE\s+([A-Z0-9]{6})\s+(\d+(\.\d+)?)$` (case-insensitive), find the RFQ by short_code, confirm the sender's number matches that product's `seller_phone`, then set `quoted_price`, `quoted_at`, and `status = 'quoted'`. Try to send a plain-Body confirmation, wrapped in try/catch. Always return the same empty TwiML response as the rest of the route. Do not alter the photo, CONFIRM, or edit branches.

## Task 7: Catalog export
Add an "Export catalog" button on `/dashboard` that downloads a CSV (title, category, materials, size_options, price, moq, tier prices, seller_name, seller_location, image_url). Add a print-friendly `/catalog` page for saving as PDF. Label both "GeM / ONDC-ready catalog".

## Task 8: Installable app (PWA)
Add a web app manifest (name KalaCart, theme color #C1622F, display standalone, 192 and 512 icons) and the needed meta tags. No service worker. Then add a short `MOBILE.md` explaining how to wrap the live site with Capacitor or PWABuilder to produce an Android APK.
