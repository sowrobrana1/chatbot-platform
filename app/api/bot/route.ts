import { NextRequest, NextResponse } from "next/server";
import { generateBotReply, BotContext } from "@/lib/ai";

export const dynamic = 'force-dynamic';

/**
 * POST /api/bot
 * Body: { message: string, context: BotContext, history?: [...] }
 * Used by the Bot Studio test panel and landing page demo.
 * TODO: In production, load context from the logged-in user's Settings.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, context, history } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    const ctx: BotContext = {
      businessName: context?.businessName || "ডেমো শপ",
      products: context?.products || [],
      deliveryInsideDhaka: context?.deliveryInsideDhaka ?? 60,
      deliveryOutsideDhaka: context?.deliveryOutsideDhaka ?? 120,
      codEnabled: context?.codEnabled ?? true,
      language: context?.language || "bn",
      tone: context?.tone || "friendly",
      systemPrompt: context?.systemPrompt || "",
    };
    const reply = await generateBotReply(message, ctx, history || []);
    return NextResponse.json({ reply });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: "bot failed",
        detail: e instanceof Error ? e.message.slice(0, 500) : String(e).slice(0, 500),
      },
      { status: 500 }
    );
  }
}
