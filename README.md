# KALACART

Build a full-stack, production-quality marketplace web app called "KalaCart" connecting rural Indian artisans (sellers) directly with buyers, removing exploitative middlemen. Fully functional end-to-end — all data live from the database, all flows wired and working, no mockups.

TECH STACK

React + TypeScript, Tailwind CSS, shadcn/ui components, React Router. Backend: built-in Cloud backend (Postgres database + serverless functions + secrets manager). No user authentication anywhere — public storefront, public dashboard, public checkout, keep it simple.

DATABASE SCHEMA

sql

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null, category text not null,
  materials text[] not null, size_options text[] not null, price numeric not null,
  image_url text, seller_name text not null, seller_location text not null,
  seller_phone text not null, status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);
create table orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  buyer_name text not null, buyer_address text not null, buyer_phone text not null,
  selected_size text not null, quantity int not null default 1,
  order_status text not null default 'new', created_at timestamptz not null default now()
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, message text not null,
  created_at timestamptz not null default now()
);

RLS: public select on published products only; public insert on orders and messages; all product writes go through backend functions using elevated privileges, never direct anon writes to products.

SEED DATA

Insert 20 published sample products across 6 categories — Pottery & Ceramics, Handloom Textiles, Bamboo & Cane Craft, Jewelry, Home Decor, Wooden Toys. Each needs: specific title, warm story-like 2-3 sentence description with real craft technique details (like "thrown on a foot-powered wheel," "lost-wax casting," "pit-loom weaving"), materials array, 2-4 size_options, price ₹150-3500, distinct realistic Indian seller_name + seller_location (real Indian craft towns: Jaipur, Khurja, Varanasi, Pochampally, Bastar, Channapatna, Etikoppaka, Moradabad, Madhubani, etc.), distinct dummy seller_phone per seller, and a distinct, specific image_url per product using Unsplash source format with varied specific keywords per item so no two images look alike (e.g. https://source.unsplash.com/400x400/?terracotta-pottery, ?blue-pottery-vase, ?handloom-weaving, ?bamboo-basket, ?silver-tribal-jewelry, ?brass-diya, ?wooden-toy-elephant, etc — one unique query per product).

DESIGN SYSTEM

Colors: terracotta orange (#C1622F) primary, deep brown (#5A3A29) text/accents, cream (#F5E9DD) background, muted gold (#EFC46A) highlights. Warm serif headings, clean sans-serif body. Rounded cards (12px), soft shadows, gentle hover lift. Fully responsive with mobile hamburger nav. Generous spacing — nothing cramped or empty. Loading skeletons on data fetch. Friendly empty states.

Logo: No circular letter badge. Instead: a rounded-belly clay pot icon in terracotta orange with brown outline, cupped by two simple hand shapes (warm skin tone) on either side, positioned left of the text "KalaCart" — "Kala" in terracotta, "Cart" in deep brown, warm serif font, no circle or badge container around the icon. Use consistently in header and footer.

PAGES

1. Homepage (/) — Header: logo, live search (filters by title/category), "Become a Seller" button, cart icon with live badge. Hero banner with mission tagline + "Shop Now" button (smooth-scroll to grid). Impact stats strip (static: "500+ Artisans Empowered · 6 Craft Categories · 100% Direct-to-Artisan"). Category chips (6 + "All") filtering grid. "Trending Now" horizontal scroll row (6-8 random published). "New Arrivals" horizontal scroll row (8 most recent). Full responsive product grid (search/category filtered): image, title, seller name + location, price (₹X,XXX), simulated star rating (4.0-5.0, deterministic per product id) + review count. Empty state for no results. "Become a Seller" CTA banner mid-page. Footer: mission blurb, links (Home, Categories, Become a Seller, Contact — Contact scrolls to an actual contact form section on this page, not a WhatsApp link), social icons, tagline.

2. Product Detail (/product/:id) — large image, title, seller name+location with "✓ Verified Artisan" badge, rating, full description, materials as tags, size selector (pills), quantity stepper, "Add to Cart" + "Buy Now", "You may also like" row (4 related, same category).

3. Cart (/cart) — items with image/size/qty adjuster/remove, live total, persisted via localStorage, empty-cart state with "Continue Shopping" link.

4. Checkout (/checkout) — buyer name/address/phone form with validation, order summary, on submit inserts one orders row per cart item, clears cart, navigates to confirmation. Graceful error handling with retry, doesn't clear cart on failure.

5. Confirmation (/confirmation) — success message, order summary, "supports artisans directly" note, "Continue Shopping" button.

6. Seller Dashboard (/dashboard) — table of all products (draft + published): thumbnail, title, category, price, status badge, order count, created date. "Publish" and "Edit" buttons on drafts (call a backend function using elevated privileges since anon can't write directly).

7. Contact form — on the homepage (linked from footer "Contact"), a real form: name, email, message — inserts into messages table, thank-you toast on submit, clears form. This is separate from and in addition to the WhatsApp seller flow.

8. "Become a Seller" — header button + homepage banner button both open, new tab: https://wa.me/[TWILIO_SANDBOX_NUMBER]?text=join%20[YOUR_JOIN_CODE]. Below banner, 3-step icon explainer: "1. Message us on WhatsApp → 2. Send a photo of your product → 3. Our AI creates your listing instantly — you just confirm!"

SECRETS (I add these myself in the platform's secrets manager)

GEMINI_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

WHATSAPP INTAKE (core AI feature) — create as a backend function/API route, whichever this platform's standard pattern is; tell me the exact public URL when done

Receives Twilio's webhook POST (application/x-www-form-urlencoded) with From, Body, MediaUrl0. Strip whatsapp: prefix from From → seller_phone.

If MediaUrl0 present: download via Basic Auth (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN), convert to base64, send to Gemini (gemini-1.5-flash or newer) with prompt: "You are helping a rural artisan list a handmade product for sale. Based on this image, return ONLY valid JSON: title, description (warm, 2-3 sentences), category (one of: Pottery & Ceramics, Handloom Textiles, Bamboo & Cane Craft, Jewelry, Home Decor, Wooden Toys), materials (array), size_options (array), suggested_price (number, INR)." Parse JSON (strip markdown fences if present), insert into products: status "draft", seller_name "Artisan", seller_location "Not specified", image_url = MediaUrl0, price = suggested_price, seller_phone. Reply via Twilio Messages API with draft details, asking for CONFIRM or corrections.

If Body = "confirm" (case-insensitive, no image): find latest draft for that seller_phone, set status "published", reply with congrats + confirmation. If none found, ask them to send a photo first.

Else (other text, no image): treat as edit instruction — send current draft + instruction to Gemini for updated JSON, update draft, reply with revised listing. If no draft found, ask for a photo first.

Always return valid empty TwiML (<Response></Response>, Content-Type: text/xml), wrapped in try/catch so no failure ever skips this response.

ORDER NOTIFICATION

On new orders row insert, call Twilio Messages API to WhatsApp that product's seller_phone: "📦 New order! [buyer_name] ordered [quantity]x [product title] (size: [selected_size]). Deliver to: [buyer_address]. Contact: [buyer_phone]." Wrapped in try/catch so failure never blocks checkout.

ERROR HANDLING

Loading skeletons + retry on fetch failure. Checkout field validation (non-empty, phone digits check) with inline errors. Cart guards against empty checkout. Edge/backend functions never let an exception skip the required response to Twilio. Gemini JSON parse failure → reply "Sorry, we couldn't process that image. Please try sending a clearer photo."

Build the entire thing now, end to end, with live data — no hardcoded placeholders beyond seed data.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kalacart-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dcd008b0-a9ce-4370-a3cf-a02ae20c36d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
