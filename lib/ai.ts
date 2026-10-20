import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AiProvider = "anthropic" | "openai" | "gemini";

export interface BotContext {
  businessName: string;
  products: { nameBn: string; nameEn: string; price: number; stock: number }[];
  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;
  codEnabled: boolean;
  language: "bn" | "en";
  tone: string;
  systemPrompt: string;
}

function buildSystemPrompt(ctx: BotContext): string {
  const productList =
    ctx.products.length > 0
      ? ctx.products
          .map((p) => `- ${p.nameBn}${p.nameEn ? ` (${p.nameEn})` : ""}: ৳${p.price} (স্টক: ${p.stock})`)
          .join("\n")
      : "(কোনো প্রোডাক্ট যোগ করা হয়নি)";

  const base =
    ctx.language === "bn"
      ? `তুমি "${ctx.businessName}"-এর AI সেলস এজেন্ট। বাংলায় বন্ধুসুলভ ভঙ্গিতে উত্তর দাও।\n\nপ্রোডাক্ট তালিকা:\n${productList}\n\nডেলিভারি চার্জ: ঢাকার ভিতরে ৳${ctx.deliveryInsideDhaka}, ঢাকার বাইরে ৳${ctx.deliveryOutsideDhaka}।\n${ctx.codEnabled ? "ক্যাশ অন ডেলিভারি চালু আছে।" : ""}\n\nনিয়ম: শুধু উপরের তালিকার প্রোডাক্ট সম্পর্কে বলো। দাম বানিয়ে বলো না। অর্ডার নিতে চাইলে নাম, ফোন, ঠিকানা চাও।`
      : `You are the AI sales agent for "${ctx.businessName}". Reply in a friendly tone.\n\nProducts:\n${productList}\n\nDelivery: ৳${ctx.deliveryInsideDhaka} inside Dhaka, ৳${ctx.deliveryOutsideDhaka} outside.\n${ctx.codEnabled ? "Cash on delivery available." : ""}\n\nRules: only mention products from the list above. Never invent prices. To take an order, ask for name, phone, address.`;

  return ctx.systemPrompt ? `${base}\n\nAdditional instructions:\n${ctx.systemPrompt}` : base;
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
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const provider: AiProvider =
    (process.env.AI_PROVIDER as AiProvider) ||
    (geminiKey ? "gemini" : "anthropic");
  const system = buildSystemPrompt(ctx);

  try {
    if (provider === "gemini") {
      if (!geminiKey) throw new Error("GEMINI_API_KEY missing");
      const gemini = new OpenAI({
        apiKey: geminiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
      // Model chain: individual Gemini models periodically return 404/503 for
      // new free-tier accounts, so try each in order until one answers.
      const models = [
        process.env.GEMINI_MODEL,
        "gemini-3-flash-preview",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);
      let lastErr: unknown = null;
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

/** Used when no AI key is configured or the API fails. */
export function fallbackReply(ctx: BotContext): string {
  if (ctx.language === "bn") {
    return "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। শীঘ্রই আমাদের টিম যোগাযোগ করবে।";
  }
  return "Sorry, I can't reply right now. Our team will contact you soon.";
}
