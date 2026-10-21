import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AiProvider = "anthropic" | "openai" | "gemini";

export interface BotProduct {
  nameBn: string;
  nameEn: string;
  price: number;
  stock: number;
  colors?: string;
  sizes?: string;
  freeDelivery?: boolean;
  deliveryAdvance?: boolean;
}

export interface BotContext {
  businessName: string;
  products: BotProduct[];
  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;
  codEnabled: boolean;
  language: "bn" | "en";
  tone: string;
  systemPrompt: string;
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  /** An earlier order by this customer whose advance delivery charge is unpaid. */
  pendingAdvance?: { amount: number; productName: string } | null;
}

function buildSystemPrompt(ctx: BotContext): string {
  const productList =
    ctx.products.length > 0
      ? ctx.products
          .map((p) => {
            let line = `- ${p.nameBn}${p.nameEn ? ` (${p.nameEn})` : ""}: ৳${p.price} (স্টক: ${p.stock})`;
            if (p.colors) line += ` | কালার: ${p.colors}`;
            if (p.sizes) line += ` | সাইজ: ${p.sizes}`;
            if (p.freeDelivery) line += ` | 🎁 এই প্রোডাক্টে ডেলিভারি সম্পূর্ণ ফ্রি`;
            if (p.deliveryAdvance) line += ` | ⚠️ এই প্রোডাক্টে ডেলিভারি চার্জ অগ্রিম পাঠাতে হয়`;
            return line;
          })
          .join("\n")
      : "(কোনো প্রোডাক্ট যোগ করা হয়নি)";

  const payLines = [
    ctx.bkashNumber ? `বিকাশ: ${ctx.bkashNumber}` : "",
    ctx.nagadNumber ? `নগদ: ${ctx.nagadNumber}` : "",
    ctx.rocketNumber ? `রকেট: ${ctx.rocketNumber}` : "",
  ].filter(Boolean);
  const payBlock = payLines.length
    ? `\n\nঅগ্রিম পেমেন্টের নম্বর:\n${payLines.join("\n")}`
    : "";

  const orderProtocol =
    ctx.language === "bn"
      ? `\n\nঅর্ডার নেওয়ার নিয়ম:\n১) কাস্টমার অর্ডার করতে চাইলে একে একে জিজ্ঞেস করো: প্রোডাক্ট, কালার (তালিকার কালার থেকে), সাইজ (তালিকার সাইজ থেকে), কয় পিস, তারপর নাম, মোবাইল নম্বর, পুরো ঠিকানা (জেলা/এলাকাসহ)।\n২) সব তথ্য পেলে অর্ডারের সারসংক্ষেপ (প্রোডাক্ট, কালার, সাইজ, পিস, মোট দাম + ডেলিভারি চার্জ) দেখিয়ে কনফার্ম করো এবং উত্তরের একদম শেষে হুবহু এই ফরম্যাটে একটি গোপন লাইন যোগ করো (কাস্টমারকে এই লাইনের কথা বলবে না):\n[[ORDER|product=প্রোডাক্টের নাম|color=কালার|size=সাইজ|qty=সংখ্যা|name=নাম|phone=ফোন|address=ঠিকানা]]\n৩) প্রোডাক্টে "ডেলিভারি ফ্রি" থাকলে ডেলিভারি চার্জ ৳০ ধরবে এবং অফারটি আনন্দের সাথে জানাবে।\n৪) প্রোডাক্টে "ডেলিভারি চার্জ অগ্রিম" থাকলে অর্ডারের পর কাস্টমারকে বলবে: ডেলিভারি চার্জ ৳<পরিমাণ> নিচের নম্বরে বিকাশ/নগদ/রকেটে পাঠিয়ে লেনদেনের TrxID নম্বরটি বা পেমেন্টের স্ক্রিনশটটি পাঠাতে। টাকা পাঠানো ছাড়া অর্ডারটি প্রসেস হবে না — এটি ভদ্রভাবে জানাবে।\n৫) কাস্টমার টাকা পাঠিয়েছি বললে বা TrxID দিলে ধন্যবাদ জানাবে এবং উত্তরের শেষে গোপন লাইন যোগ করবে:\n[[PAID|trx=TrxID|sender=যে নম্বর থেকে পাঠিয়েছে]]
৬) সবচেয়ে গুরুত্বপূর্ণ: গোপন ORDER লাইন ছাড়া অর্ডার সিস্টেমে সেভ হয় না। যেকোনো উত্তরে তুমি অর্ডার "কনফার্ম হয়েছে" বললেই সেই উত্তরের শেষে ORDER লাইনটি অবশ্যই আবার যোগ করবে — আগের উত্তরে যোগ করে থাকলেও।`
      : `\n\nOrder rules: collect product, color, size, quantity, then name, phone, full address. When complete, show a summary and append exactly one hidden line at the very end:\n[[ORDER|product=<name>|color=<color>|size=<size>|qty=<n>|name=<name>|phone=<phone>|address=<address>]]\nFree-delivery products have ৳0 delivery — say so happily. For advance-delivery-charge products, ask the customer to send the delivery charge to the payment number below and share the TrxID or a payment screenshot. If the customer says they paid or shares a TrxID, thank them and append: [[PAID|trx=<id>|sender=<number>]] CRITICAL: without the hidden ORDER line the order is NOT saved — any reply that says the order is confirmed MUST end with the ORDER line again, even if you added it before.`;

  const advanceReminder = ctx.pendingAdvance
    ? ctx.language === "bn"
      ? `\n\n⚠️ এই কাস্টমারের আগের অর্ডারে (${ctx.pendingAdvance.productName}) ডেলিভারি চার্জ ৳${ctx.pendingAdvance.amount} অগ্রিম এখনো বাকি আছে। তোমার উত্তরের শুরুতেই ভদ্রভাবে সেটি মনে করিয়ে দাও এবং TrxID বা পেমেন্টের স্ক্রিনশট পাঠাতে বলো। টাকা না পেলে ওই অর্ডারটি পাঠানো হবে না।`
      : `\n\nNote: this customer still owes a ৳${ctx.pendingAdvance.amount} advance delivery charge for a previous order (${ctx.pendingAdvance.productName}). Politely remind them at the start of your reply and ask for the TrxID or payment screenshot.`
    : "";

  const base =
    ctx.language === "bn"
      ? `তুমি "${ctx.businessName}"-এর AI সেলস এজেন্ট। বাংলায় বন্ধুসুলভ ভঙ্গিতে উত্তর দাও।\n\nপ্রোডাক্ট তালিকা:\n${productList}\n\nডেলিভারি চার্জ: ঢাকার ভিতরে ৳${ctx.deliveryInsideDhaka}, ঢাকার বাইরে ৳${ctx.deliveryOutsideDhaka}।\n${ctx.codEnabled ? "ক্যাশ অন ডেলিভারি চালু আছে।" : ""}${payBlock}\n\nনিয়ম: শুধু উপরের তালিকার প্রোডাক্ট সম্পর্কে বলো। দাম বানিয়ে বলো না।`
      : `You are the AI sales agent for "${ctx.businessName}". Reply in a friendly tone.\n\nProducts:\n${productList}\n\nDelivery: ৳${ctx.deliveryInsideDhaka} inside Dhaka, ৳${ctx.deliveryOutsideDhaka} outside.\n${ctx.codEnabled ? "Cash on delivery available." : ""}${payBlock}\n\nRules: only mention products from the list above. Never invent prices.`;

  return `${base}${orderProtocol}${advanceReminder}${ctx.systemPrompt ? `\n\nAdditional instructions:\n${ctx.systemPrompt}` : ""}`;
}

/**
 * Generate a bot reply using the configured AI provider.
 * Set one of ANTHROPIC_API_KEY, OPENAI_API_KEY or GEMINI_API_KEY in the env.
 * Gemini (Google AI Studio) has a free tier and is used automatically when
 * GEMINI_API_KEY is set and AI_PROVIDER is not specified.
 */
export async function generateBotReply(
  userMessage: string,
  ctx: BotContext,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const keys = geminiKeys();
  const provider: AiProvider =
    (process.env.AI_PROVIDER as AiProvider) ||
    (keys.length ? "gemini" : "anthropic");
  const system = buildSystemPrompt(ctx);

  try {
    if (provider === "gemini") {
      if (!keys.length) throw new Error("GEMINI_API_KEY missing");
      const models = geminiModels();
      let lastErr: unknown = null;
      for (const key of keys) {
        const gemini = geminiClientFor(key);
        for (const model of models) {
        try {
          const res = await gemini.chat.completions.create({
            model,
            messages: [
              { role: "system", content: system },
              ...history,
              { role: "user", content: userMessage },
            ],
            max_tokens: 800,
          });
          const text = res.choices[0]?.message?.content?.trim();
          if (text) return text;
        } catch (e) {
          lastErr = e;
        }
      }
        }
      throw lastErr instanceof Error ? lastErr : new Error("All Gemini models failed");
    }

    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
      });
      return res.choices[0]?.message?.content?.trim() || fallbackReply(ctx);
    }

    // Default: Anthropic Claude
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
      max_tokens: 500,
      system,
      messages: [...history, { role: "user", content: userMessage }],
    });
    const block = res.content[0];
    if (block.type === "text") return block.text.trim();
    return fallbackReply(ctx);
  } catch (err) {
    console.error("AI reply failed:", err);
    return fallbackReply(ctx);
  }
}

export interface CatalogImage {
  nameBn: string;
  nameEn: string;
  price: number;
  stock: number;
  imageUrl: string; // data URI (or https URL) of the product photo
}

function geminiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GOOGLE_API_KEY,
    process.env.GEMINI_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ].filter((v, i, a): v is string => !!v && a.indexOf(v) === i);
}

function geminiClientFor(key: string) {
  return new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    timeout: 15000,
    maxRetries: 0,
  });
}

function geminiClient() {
  const keys = geminiKeys();
  if (!keys.length) return null;
  return geminiClientFor(keys[Math.floor(Math.random() * keys.length)]);
}

function geminiModels(): string[] {
  return [
    process.env.GEMINI_MODEL,
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
  ].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);
}

/**
 * Reply to a customer-sent product photo/screenshot: show Gemini the catalog
 * photos (with names/prices) followed by the customer's image, and ask it to
 * identify the matching product and answer with its price/stock.
 */
export async function generateImageReply(
  customerImageDataUri: string,
  ctx: BotContext,
  catalog: CatalogImage[]
): Promise<string> {
  const gemini = geminiClient();
  if (!gemini) return fallbackReply(ctx);
  const system = buildSystemPrompt(ctx);

  const parts: any[] = [];
  if (catalog.length > 0) {
    parts.push({
      type: "text",
      text: "নিচে আমাদের ক্যাটালগের প্রোডাক্টগুলোর ছবি একে একে দেওয়া হলো (প্রতিটির আগে নাম ও দাম লেখা আছে)। সবশেষে কাস্টমারের পাঠানো ছবি দেওয়া হলো।",
    });
    catalog.slice(0, 20).forEach((p, i) => {
      parts.push({
        type: "text",
        text: `ক্যাটালগ প্রোডাক্ট ${i + 1}: ${p.nameBn}${p.nameEn ? ` (${p.nameEn})` : ""} — দাম ৳${p.price}, স্টক ${p.stock}`,
      });
      parts.push({ type: "image_url", image_url: { url: p.imageUrl } });
    });
  }
  parts.push({ type: "text", text: "কাস্টমারের পাঠানো ছবি:" });
  parts.push({ type: "image_url", image_url: { url: customerImageDataUri } });
  parts.push({
    type: "text",
    text:
      ctx.language === "bn"
        ? "কাস্টমারের ছবির প্রোডাক্টটি ক্যাটালগের কোনটির সাথে মেলে তা শনাক্ত করো। মিললে বাংলায় বলো এটি কোন প্রোডাক্ট, দাম কত, স্টক আছে কিনা, এবং অর্ডার করতে চান কিনা জিজ্ঞেস করো। কোনো ক্যাটালগ প্রোডাক্টের সাথে না মিললে ভদ্রভাবে বলো যে ছবির প্রোডাক্টটি আমাদের বর্তমান তালিকায় পাওয়া যাচ্ছে না, এবং তিনি কী খুঁজছেন লিখে জানাতে বলো। দাম কখনো বানিয়ে বলবে না।"
        : "Identify which catalog product matches the customer's photo. If matched, reply with the product name, price and stock, and ask if they want to order. If nothing matches, politely say the product is not in the current catalog and ask what they are looking for. Never invent prices.",
  });

  let lastErr: unknown = null;
  for (const model of geminiModels()) {
    try {
      const res = await gemini.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: parts },
        ] as any,
        max_tokens: 800,
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      lastErr = e;
    }
  }
  console.error("AI image reply failed:", lastErr);
  return fallbackReply(ctx);
}

export interface PaymentCheck {
  looksLikePayment: boolean;
  amount: number | null;
  trxId: string;
  sender: string;
  method: string; // bkash | nagad | rocket | ""
}

/**
 * Read a customer-sent payment screenshot (bKash/Nagad/Rocket confirmation)
 * and extract amount / TrxID / sender number so the shop can match it
 * against an expected advance payment.
 */
export async function generatePaymentCheck(
  imageDataUri: string,
  expectedAmount: number
): Promise<PaymentCheck | null> {
  const gemini = geminiClient();
  if (!gemini) return null;
  const parts: any[] = [
    {
      type: "text",
      text: `This image may be a mobile-banking payment confirmation (bKash / Nagad / Rocket) for an advance payment of ৳${expectedAmount}. Examine it carefully. Reply with ONLY a JSON object, no other text: {"looksLikePayment": true/false, "amount": <number or null>, "trxId": "<transaction id or empty>", "sender": "<sender phone number or empty>", "method": "<bkash|nagad|rocket or empty>"}. If it is not a payment confirmation screenshot, set looksLikePayment to false.`,
    },
    { type: "image_url", image_url: { url: imageDataUri } },
  ];
  for (const model of geminiModels()) {
    try {
      const res = await gemini.chat.completions.create({
        model,
        messages: [{ role: "user", content: parts }] as any,
        max_tokens: 300,
      });
      const raw = res.choices[0]?.message?.content?.trim() || "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) continue;
      const j = JSON.parse(m[0]);
      return {
        looksLikePayment: !!j.looksLikePayment,
        amount: typeof j.amount === "number" ? j.amount : null,
        trxId: String(j.trxId || ""),
        sender: String(j.sender || ""),
        method: String(j.method || ""),
      };
    } catch (e) {
      console.error("payment check model failed:", model, e);
    }
  }
  return null;
}

export interface ExtractedOrder {
  product: string;
  color: string;
  size: string;
  qty: number;
  name: string;
  phone: string;
  address: string;
}

/**
 * Recovery extraction: if the chat model confirmed an order in prose but
 * forgot the hidden ORDER marker, read the recent conversation and pull the
 * order fields out as strict JSON. Returns null unless a complete order
 * (name + phone + address) is present.
 */
export async function extractOrderFromConversation(
  transcript: { role: "user" | "assistant"; content: string }[]
): Promise<ExtractedOrder | null> {
  const gemini = geminiClient();
  if (!gemini) return null;
  const convo = transcript
    .map((m) => `${m.role === "user" ? "CUSTOMER" : "BOT"}: ${m.content}`)
    .join("\n");
  const prompt = `Below is a shop chat conversation (Bengali/English mix). The customer may have placed an order. Extract the order details. Reply with ONLY a JSON object, no other text: {"found": true/false, "product": "<product name as the customer/bot referred to it>", "color": "<color or empty>", "size": "<size or empty>", "qty": <number, default 1>, "name": "<customer name>", "phone": "<customer phone number>", "address": "<full delivery address>"}. Set found=true ONLY if the customer actually ordered AND name, phone and address are all present in the conversation. Otherwise found=false.\n\nCONVERSATION:\n${convo}`;
  for (const model of geminiModels()) {
    try {
      const res = await gemini.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      });
      const raw = res.choices[0]?.message?.content?.trim() || "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) continue;
      const j = JSON.parse(m[0]);
      if (!j.found || !j.phone || !j.name) continue;
      return {
        product: String(j.product || ""),
        color: String(j.color || ""),
        size: String(j.size || ""),
        qty: Math.max(1, parseInt(String(j.qty || "1"), 10) || 1),
        name: String(j.name || ""),
        phone: String(j.phone || ""),
        address: String(j.address || ""),
      };
    } catch (e) {
      console.error("order extraction model failed:", model, e);
    }
  }
  return null;
}

/** Used when no AI key is configured or the API fails. */
export function fallbackReply(ctx: BotContext): string {
  if (ctx.language === "bn") {
    return "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। শীঘ্রই আমাদের টিম যোগাযোগ করবে।";
  }
  return "Sorry, I can't reply right now. Our team will contact you soon.";
}

// ---------------------------------------------------------------------------
// Translator mode (BD Translator page): the bot ONLY translates.
// Bangla (script or Romanized) -> English, English -> Bangla. A leading
// "en:" / "bn:" command forces the direction. Image messages: read the text
// in the image and return only its translation. No chat, no extra words.
// ---------------------------------------------------------------------------

export type TranslateTarget = "en" | "bn" | "auto";

const TRANSLATOR_SYSTEM = `You are a translation engine for the "BD Translator" Facebook page. You ONLY translate — never chat, never explain, never add greetings, quotes, notes or quotation marks.

Rules:
- If the target is English: translate the user's text into natural English.
- If the target is Bangla: translate the user's text into natural Bangla (Bangla script).
- If the target is Auto: if the text is English, translate to Bangla; if it is Bangla (Bangla script OR Romanized Bangla/Banglish), translate to English.
- Keep names, numbers, prices and formatting (line breaks, lists) as they are.
- Output ONLY the translated text.`;

const TRANSLATE_FALLBACK = "দুঃখিত, আবার চেষ্টা করুন / Sorry, please try again";

// Latency helpers for the translator: remember which key worked last (on a
// warm instance) and try it first; abandon a quota-dead key immediately
// instead of burning time on every model with that key; cap each attempt so
// a hanging request fails over fast.
let lastGoodKeyIndex = 0;

function orderedKeys(keys: string[]): { key: string; index: number }[] {
  const out: { key: string; index: number }[] = [];
  for (let n = 0; n < keys.length; n++) {
    const index = (lastGoodKeyIndex + n) % keys.length;
    out.push({ key: keys[index], index });
  }
  return out;
}

function isQuotaError(e: unknown): boolean {
  const status = (e as { status?: number } | null)?.status;
  const msg = String((e as { message?: string } | null)?.message || e || "");
  return status === 429 || /429|quota|resource_exhausted|rate limit/i.test(msg);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error("gemini attempt timeout")), ms);
  });
  return Promise.race([p, timeout]).finally(() => {
    if (t) clearTimeout(t);
  });
}

export async function translateText(
  text: string,
  target: TranslateTarget = "auto"
): Promise<string> {
  const keys = geminiKeys();
  if (!keys.length) return TRANSLATE_FALLBACK;
  const targetLine =
    target === "en"
      ? "Target: English."
      : target === "bn"
        ? "Target: Bangla."
        : "Target: Auto (English<->Bangla by input language).";
  let lastErr: unknown = null;
  for (const { key, index } of orderedKeys(keys)) {
    const gemini = geminiClientFor(key);
    for (const model of geminiModels()) {
      try {
        const res = await withTimeout(
          gemini.chat.completions.create({
            model,
            messages: [
              { role: "system", content: TRANSLATOR_SYSTEM },
              { role: "user", content: `${targetLine}\n\n${text}` },
            ],
            max_tokens: 2000,
          }),
          9000
        );
        const out = res.choices[0]?.message?.content?.trim();
        if (out) {
          lastGoodKeyIndex = index;
          return out;
        }
      } catch (e) {
        lastErr = e;
        if (isQuotaError(e)) break; // dead key — jump to the next key at once
      }
    }
  }
  console.error("translateText failed:", lastErr);
  return TRANSLATE_FALLBACK;
}

export async function translateImageText(imageDataUri: string): Promise<string> {
  const keys = geminiKeys();
  if (!keys.length) return TRANSLATE_FALLBACK;
  const instruction =
    "Read ALL the text in this image. If the text is in Bangla (Bangla script or Romanized Bangla), output ONLY its English translation. If it is in English, output ONLY its Bangla translation (Bangla script). If the image has no readable text, output exactly: ছবিতে কোনো লেখা পাওয়া যায়নি / No text found in the image. Never explain or add anything else.";
  let lastErr: unknown = null;
  for (const { key, index } of orderedKeys(keys)) {
    const gemini = geminiClientFor(key);
    for (const model of geminiModels()) {
      try {
        const res = await withTimeout(
          gemini.chat.completions.create({
            model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: instruction },
                  { type: "image_url", image_url: { url: imageDataUri } },
                ],
              },
            ] as any,
            max_tokens: 2000,
          }),
          15000
        );
        const out = res.choices[0]?.message?.content?.trim();
        if (out) {
          lastGoodKeyIndex = index;
          return out;
        }
      } catch (e) {
        lastErr = e;
        if (isQuotaError(e)) break; // dead key — jump to the next key at once
      }
    }
  }
  console.error("translateImageText failed:", lastErr);
  return TRANSLATE_FALLBACK;
}
