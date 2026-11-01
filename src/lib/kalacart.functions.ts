import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OrderItem = z.object({
  productId: z.string().uuid(),
  size: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const PlaceOrderInput = z.object({
  buyerName: z.string().min(2).max(120),
  buyerAddress: z.string().min(5).max(600),
  buyerPhone: z.string().min(7).max(20),
  items: z.array(OrderItem).min(1).max(50),
});

async function notifySeller(params: {
  sellerPhone: string;
  buyerName: string;
  quantity: number;
  title: string;
  size: string;
  buyerAddress: string;
  buyerPhone: string;
}) {
  try {
    const sid = process.env["TWILIO_ACCOUNT_SID"];
    const token = process.env["TWILIO_AUTH_TOKEN"];
    if (!sid || !token) return;
    const from = process.env["TWILIO_WHATSAPP_FROM"] ?? "whatsapp:+17372508034";
    const to = `whatsapp:${params.sellerPhone.replace(/[^\d+]/g, "")}`;
    const body = `📦 New order! ${params.buyerName} ordered ${params.quantity}x ${params.title} (size: ${params.size}). Deliver to: ${params.buyerAddress}. Contact: ${params.buyerPhone}.`;
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    });
  } catch (error) {
    console.error("seller notification failed", error);
  }
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlaceOrderInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.productId);
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, title, seller_phone")
      .in("id", ids);
    if (productError) throw new Error(productError.message);

    const rows = data.items.map((item) => ({
      product_id: item.productId,
      buyer_name: data.buyerName,
      buyer_address: data.buyerAddress,
      buyer_phone: data.buyerPhone,
      selected_size: item.size,
      quantity: item.quantity,
    }));

    const { data: inserted, error } = await supabaseAdmin.from("orders").insert(rows).select("id");
    if (error) throw new Error(error.message);

    for (const item of data.items) {
      const product = products?.find((p) => p.id === item.productId);
      if (!product) continue;
      await notifySeller({
        sellerPhone: product.seller_phone,
        buyerName: data.buyerName,
        quantity: item.quantity,
        title: product.title,
        size: item.size,
        buyerAddress: data.buyerAddress,
        buyerPhone: data.buyerPhone,
      });
    }

    return { orderIds: (inserted ?? []).map((o) => o.id) };
  });

export const listDashboardProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: orders, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("product_id");
  if (orderError) throw new Error(orderError.message);

  const counts = new Map<string, number>();
  for (const order of orders ?? []) {
    counts.set(order.product_id, (counts.get(order.product_id) ?? 0) + 1);
  }

  return (products ?? []).map((p) => ({ ...p, order_count: counts.get(p.id) ?? 0 }));
});

export const publishProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ status: "published" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateProductInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(3000),
  category: z.string().min(2).max(80),
  price: z.number().min(1).max(1000000),
  seller_name: z.string().min(1).max(120),
  seller_location: z.string().min(1).max(160),
  materials: z.array(z.string().min(1)).min(1).max(12),
  size_options: z.array(z.string().min(1)).min(1).max(12),
});

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UpdateProductInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...fields } = data;
    const { error } = await supabaseAdmin.from("products").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- B2B: request-for-quote (RFQ) ----

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{2}$/;

const CreateRfqInput = z.object({
  productId: z.string().uuid(),
  companyName: z.string().trim().min(2).max(160),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_PATTERN, "Enter a valid 15-character GSTIN"),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().min(7).max(20),
  quantity: z.number().int().min(1).max(100000),
  neededBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  deliveryCity: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).optional(),
});

function randomShortCode(): string {
  // 6 uppercase alphanumeric characters; ambiguous glyphs (I, O, 0, 1) excluded
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const createRfq = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateRfqInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, moq")
      .eq("id", data.productId)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product) throw new Error("Product not found");

    const moq = product.moq ?? 10;
    if (data.quantity < moq) {
      throw new Error(`Minimum order quantity for this product is ${moq} units`);
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const short_code = randomShortCode();
      const { data: rfq, error } = await supabaseAdmin
        .from("rfqs")
        .insert({
          short_code,
          product_id: data.productId,
          company_name: data.companyName,
          gstin: data.gstin,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          quantity: data.quantity,
          needed_by: data.neededBy,
          delivery_city: data.deliveryCity,
          notes: data.notes ?? null,
        })
        .select("short_code")
        .maybeSingle();
      if (error) {
        // 23505 = unique_violation: short-code collision, retry with a new code
        if ((error as { code?: string }).code === "23505") continue;
        throw new Error(error.message);
      }
      return { shortCode: rfq?.short_code ?? short_code };
    }
    throw new Error("Could not allocate a quote reference. Please try again.");
  });

export const listRfqs = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("rfqs")
    .select(
      "id, short_code, product_id, company_name, contact_name, contact_phone, quantity, needed_by, delivery_city, notes, status, quoted_price, quoted_at, created_at, products(title, seller_name, seller_phone, price, moq)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
});

const AcceptRfqInput = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/) });

export const acceptRfq = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AcceptRfqInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from("rfqs")
      .select(
        "id, short_code, product_id, quantity, status, quoted_price, contact_name, contact_phone, delivery_city",
      )
      .eq("short_code", data.code)
      .maybeSingle();
    if (rfqError) throw new Error(rfqError.message);
    if (!rfq) throw new Error("Quote request not found");
    if (rfq.status === "accepted") return { ok: true, alreadyAccepted: true };
    if (rfq.status !== "quoted" || !rfq.quoted_price) {
      throw new Error("The artisan has not sent a price for this request yet");
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, title, seller_phone, size_options")
      .eq("id", rfq.product_id)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product) throw new Error("Product no longer available");

    const { error: orderError } = await supabaseAdmin.from("orders").insert({
      product_id: rfq.product_id,
      buyer_name: rfq.contact_name,
      buyer_address: rfq.delivery_city,
      buyer_phone: rfq.contact_phone,
      selected_size: product.size_options?.[0] ?? "Bulk order",
      quantity: rfq.quantity,
    });
    if (orderError) throw new Error(orderError.message);

    const { error: updateError } = await supabaseAdmin
      .from("rfqs")
      .update({ status: "accepted" })
      .eq("id", rfq.id);
    if (updateError) throw new Error(updateError.message);

    await notifySeller({
      sellerPhone: product.seller_phone,
      buyerName: `${rfq.contact_name} (${rfq.delivery_city})`,
      quantity: rfq.quantity,
      title: `${product.title} — bulk order`,
      size: "per RFQ",
      buyerAddress: "Confirmed via KalaCart quote",
      buyerPhone: rfq.contact_phone,
    });

    return { ok: true, alreadyAccepted: false };
  });
