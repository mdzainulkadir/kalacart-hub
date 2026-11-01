export type TierPrice = { min: number; price: number };

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  materials: string[];
  size_options: string[];
  price: number;
  moq: number;
  tier_prices: TierPrice[] | null;
  image_url: string | null;
  seller_name: string;
  seller_location: string;
  seller_phone: string;
  status: string;
  created_at: string;
};

export const CATEGORIES = [
  "Pottery & Ceramics",
  "Handloom Textiles",
  "Bamboo & Cane Craft",
  "Jewelry",
  "Home Decor",
  "Wooden Toys",
] as const;

/** Twilio WhatsApp sandbox — sellers message this number to start a listing. */
export const WHATSAPP_SANDBOX_NUMBER = "17372508034";
export const WHATSAPP_JOIN_CODE = "join twilio-trial";
export const BECOME_SELLER_URL = `https://wa.me/${WHATSAPP_SANDBOX_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_JOIN_CODE,
)}`;

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic simulated rating (4.0–5.0) and review count per product id. */
export function ratingFor(id: string): { rating: number; reviews: number } {
  const h = hashId(id);
  const rating = 4 + (h % 11) / 10;
  const reviews = 8 + (h % 197);
  return { rating: Math.min(5, Number(rating.toFixed(1))), reviews };
}

export function fallbackImage(product: Pick<Product, "title">): string {
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(product.title)}`;
}

/** Bulk tier prices for a product — falls back to the standard discount ladder
 * (MOQ −10%, 50+ −18%, 100+ −25%) when tier_prices has not been generated yet. */
export function tiersFor(product: Pick<Product, "price" | "moq" | "tier_prices">): TierPrice[] {
  const price = Number(product.price);
  const moq = product.moq && product.moq > 0 ? product.moq : 10;
  if (Array.isArray(product.tier_prices) && product.tier_prices.length > 0) {
    return product.tier_prices.map((t) => ({ min: Number(t.min), price: Number(t.price) }));
  }
  return [
    { min: moq, price: Math.round(price * 0.9) },
    { min: 50, price: Math.round(price * 0.82) },
    { min: 100, price: Math.round(price * 0.75) },
  ];
}

/** Lowest per-unit bulk price ("From ₹X/unit"). */
export function fromPriceFor(product: Pick<Product, "price" | "moq" | "tier_prices">): number {
  const tiers = tiersFor(product);
  return Math.min(Number(product.price), ...tiers.map((t) => t.price));
}

export type Rfq = {
  id: string;
  short_code: string;
  product_id: string;
  company_name: string;
  gstin: string;
  contact_name: string;
  contact_phone: string;
  quantity: number;
  needed_by: string;
  delivery_city: string;
  notes: string | null;
  status: string;
  quoted_price: number | null;
  quoted_at: string | null;
  created_at: string;
};
