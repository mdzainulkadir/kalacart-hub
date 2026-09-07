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
    const from = process.env["TWILIO_WHATSAPP_FROM"] ?? "whatsapp:+14155238886";
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
