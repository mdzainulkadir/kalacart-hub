export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  materials: string[];
  size_options: string[];
  price: number;
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
