import { createFileRoute } from "@tanstack/react-router";

const TWIML_EMPTY = "<Response></Response>";
const CATEGORIES = [
  "Pottery & Ceramics",
  "Handloom Textiles",
  "Bamboo & Cane Craft",
  "Jewelry",
  "Home Decor",
  "Wooden Toys",
];

function twiml() {
  return new Response(TWIML_EMPTY, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

type Draft = {
  title: string;
  description: string;
  category: string;
  materials: string[];
  size_options: string[];
  suggested_price: number;
};

function toBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < view.length; i += chunk) {
    binary += String.fromCharCode(...view.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseJsonFromModel(text: string): Draft | null {
  try {
    const cleaned = text
      .replace(/^\s*```(?:json)?/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<Draft>;
    if (!parsed.title || !parsed.description) return null;
    return {
      title: String(parsed.title).slice(0, 180),
      description: String(parsed.description).slice(0, 2000),
      category: CATEGORIES.includes(String(parsed.category))
        ? String(parsed.category)
        : "Home Decor",
      materials: Array.isArray(parsed.materials)
        ? parsed.materials.map(String).slice(0, 10)
        : ["Handmade"],
      size_options: Array.isArray(parsed.size_options)
        ? parsed.size_options.map(String).slice(0, 6)
        : ["Standard"],
      suggested_price: Number(parsed.suggested_price) > 0 ? Number(parsed.suggested_price) : 500,
    };
  } catch {
    return null;
  }
}

async function callGemini(parts: unknown[]): Promise<string | null> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    console.error("[whatsapp] GEMINI_API_KEY is not set — cannot call Gemini");
    return null;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const requestBody = JSON.stringify({ contents: [{ parts }] });
  console.log("[whatsapp] calling Gemini", { url: url.replace(key, "***"), bodyBytes: requestBody.length });
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });
  } catch (error) {
    console.error("[whatsapp] Gemini fetch threw", error);
    return null;
  }
  const rawText = await response.text();
  if (!response.ok) {
    console.error("[whatsapp] Gemini call failed", { status: response.status, rawResponse: rawText });
    return null;
  }
  console.log("[whatsapp] Gemini call succeeded", { status: response.status, rawResponseBytes: rawText.length });
  const json = JSON.parse(rawText) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? null;
}

const LISTING_PROMPT =
  "You are helping a rural artisan list a handmade product for sale. Based on this image, return ONLY valid JSON: title, description (warm, 2-3 sentences), category (one of: Pottery & Ceramics, Handloom Textiles, Bamboo & Cane Craft, Jewelry, Home Decor, Wooden Toys), materials (array), size_options (array), suggested_price (number, INR).";

async function sendWhatsApp(sellerPhone: string, body: string) {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) {
    console.error("[whatsapp] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing — skipping reply");
    return;
  }
  const fromNumber = "whatsapp:+17372508034";
  const toNumber = `whatsapp:${sellerPhone.replace(/[^\d+]/g, "")}`;
  console.log("[whatsapp] sending Twilio reply", { from: fromNumber, to: toNumber, bodyBytes: body.length });
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: body }),
    });
    const rawText = await response.text();
    if (!response.ok) {
      console.error("[whatsapp] Twilio reply failed", { status: response.status, rawResponse: rawText });
      return;
    }
    console.log("[whatsapp] Twilio reply sent", { status: response.status, rawResponseBytes: rawText.length });
  } catch (error) {
    console.error("[whatsapp] Twilio fetch threw", error);
  }
}

function draftSummary(draft: {
  title: string;
  description: string;
  category: string;
  materials: string[];
  size_options: string[];
  price: number;
}) {
  return [
    `🪔 Here is your draft listing:`,
    ``,
    `*${draft.title}*`,
    draft.description,
    ``,
    `Category: ${draft.category}`,
    `Materials: ${draft.materials.join(", ")}`,
    `Sizes: ${draft.size_options.join(", ")}`,
    `Price: ₹${Math.round(draft.price)}`,
    ``,
    `Reply CONFIRM to publish it, or tell us what to change (for example: "price 900" or "it is made of brass").`,
  ].join("\n");
}

export const Route = createFileRoute("/api/public/whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const from = String(form.get("From") ?? "");
          const body = String(form.get("Body") ?? "").trim();
          const mediaUrl = form.get("MediaUrl0") ? String(form.get("MediaUrl0")) : "";
          const sellerPhone = from.replace(/^whatsapp:/i, "");
          if (!sellerPhone) return twiml();

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // 1. Photo received -> create a new draft listing with AI
          if (mediaUrl) {
            const sid = process.env["TWILIO_ACCOUNT_SID"];
            const token = process.env["TWILIO_AUTH_TOKEN"];
            const mediaHeaders: Record<string, string> =
              sid && token ? { Authorization: `Basic ${btoa(`${sid}:${token}`)}` } : {};
            const mediaResponse = await fetch(mediaUrl, { headers: mediaHeaders });
            if (!mediaResponse.ok) {
              await sendWhatsApp(
                sellerPhone,
                "Sorry, we couldn't process that image. Please try sending a clearer photo.",
              );
              return twiml();
            }
            const mimeType = mediaResponse.headers.get("content-type") ?? "image/jpeg";
            const base64 = toBase64(await mediaResponse.arrayBuffer());

            const text = await callGemini([
              { text: LISTING_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ]);
            const draft = text ? parseJsonFromModel(text) : null;
            if (!draft) {
              await sendWhatsApp(
                sellerPhone,
                "Sorry, we couldn't process that image. Please try sending a clearer photo.",
              );
              return twiml();
            }

            const { error } = await supabaseAdmin.from("products").insert({
              title: draft.title,
              description: draft.description,
              category: draft.category,
              materials: draft.materials,
              size_options: draft.size_options,
              price: draft.suggested_price,
              image_url: mediaUrl,
              seller_name: "Artisan",
              seller_location: "Not specified",
              seller_phone: sellerPhone,
              status: "draft",
            });
            if (error) {
              console.error(error);
              await sendWhatsApp(
                sellerPhone,
                "Sorry, something went wrong saving your listing. Please try again.",
              );
              return twiml();
            }

            await sendWhatsApp(
              sellerPhone,
              draftSummary({ ...draft, price: draft.suggested_price }),
            );
            return twiml();
          }

          const { data: latestDraft } = await supabaseAdmin
            .from("products")
            .select("*")
            .eq("seller_phone", sellerPhone)
            .eq("status", "draft")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // 2. CONFIRM -> publish latest draft
          if (body.toLowerCase() === "confirm") {
            if (!latestDraft) {
              await sendWhatsApp(
                sellerPhone,
                "We couldn't find a draft listing for you yet. Please send a photo of your product first.",
              );
              return twiml();
            }
            const { error } = await supabaseAdmin
              .from("products")
              .update({ status: "published" })
              .eq("id", latestDraft.id);
            if (error) {
              console.error(error);
              await sendWhatsApp(sellerPhone, "Something went wrong publishing. Please reply CONFIRM again.");
              return twiml();
            }
            await sendWhatsApp(
              sellerPhone,
              `🎉 Congratulations! *${latestDraft.title}* is now live on KalaCart at ₹${Math.round(
                Number(latestDraft.price),
              )}. Buyers can order it right away and we will message you the moment an order comes in.`,
            );
            return twiml();
          }

          // 3. Any other text -> treat as an edit instruction for the latest draft
          if (!latestDraft) {
            await sendWhatsApp(
              sellerPhone,
              "Please send a photo of your product first, and we'll create your listing for you.",
            );
            return twiml();
          }

          const editPrompt = [
            LISTING_PROMPT,
            "",
            "This is the artisan's current draft listing:",
            JSON.stringify({
              title: latestDraft.title,
              description: latestDraft.description,
              category: latestDraft.category,
              materials: latestDraft.materials,
              size_options: latestDraft.size_options,
              suggested_price: Number(latestDraft.price),
            }),
            "",
            `The artisan asked for this change: "${body}"`,
            "Return ONLY the updated JSON with the same fields.",
          ].join("\n");

          const text = await callGemini([{ text: editPrompt }]);
          const updated = text ? parseJsonFromModel(text) : null;
          if (!updated) {
            await sendWhatsApp(
              sellerPhone,
              "Sorry, we couldn't understand that change. Please try again in a few simple words.",
            );
            return twiml();
          }

          const { error } = await supabaseAdmin
            .from("products")
            .update({
              title: updated.title,
              description: updated.description,
              category: updated.category,
              materials: updated.materials,
              size_options: updated.size_options,
              price: updated.suggested_price,
            })
            .eq("id", latestDraft.id);
          if (error) console.error(error);

          await sendWhatsApp(sellerPhone, draftSummary({ ...updated, price: updated.suggested_price }));
          return twiml();
        } catch (error) {
          console.error("whatsapp webhook failure", error);
          return twiml();
        }
      },
    },
  },
});
