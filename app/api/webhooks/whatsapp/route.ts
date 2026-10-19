import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBotReply, BotContext } from "@/lib/ai";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = 'force-dynamic';

/**
 * WhatsApp Cloud API webhook.
 * GET  -> verification
 * POST -> incoming messages
 *
 * TODO: In Meta App Dashboard > WhatsApp > Configuration, set:
 *   Callback URL: https://YOUR-DOMAIN/api/webhooks/whatsapp
 *   Verify Token: same as WA_VERIFY_TOKEN in .env
 *   Subscribe to messages field.
 */

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const mode = q.get("hub.mode");
  const token = q.get("hub.verify_token");
  const challenge = q.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

async function buildContext(userId: string): Promise<BotContext> {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const products = await prisma.product.findMany({
    where: { userId, active: true },
    select: { nameBn: true, nameEn: true, price: true, stock: true },
  });
  return {
    businessName: settings?.businessName || "আমাদের শপ",
    products,
    deliveryInsideDhaka: settings?.deliveryInsideDhaka ?? 60,
    deliveryOutsideDhaka: settings?.deliveryOutsideDhaka ?? 120,
    codEnabled: settings?.codEnabled ?? true,
    language: (settings?.botLanguage as "bn" | "en") || "bn",
    tone: settings?.botTone || "friendly",
    systemPrompt: settings?.systemPrompt || "",
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value?.messages) continue;

      const phoneNumberId = value.metadata?.phone_number_id;
      for (const msg of value.messages) {
        if (msg.type !== "text") continue;
        const from = msg.from;
        const text = msg.text?.body;
        if (!from || !text) continue;

        const settings = await prisma.settings.findFirst({
          where: { waPhoneNumberId: phoneNumberId, waConnected: true },
        });
        if (!settings) continue;

        let convo = await prisma.conversation.findFirst({
          where: { userId: settings.userId, channel: "whatsapp", senderId: from },
        });
        if (!convo) {
          convo = await prisma.conversation.create({
            data: {
              userId: settings.userId,
              channel: "whatsapp",
              senderId: from,
              senderName: value.contacts?.[0]?.profile?.name || "",
            },
          });
        }
        await prisma.message.create({
          data: { conversationId: convo.id, role: "user", text },
        });

        const ctx = await buildContext(settings.userId);
        const history = await prisma.message.findMany({
          where: { conversationId: convo.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        const reply = await generateBotReply(
          text,
          ctx,
          history.reverse().map((m) => ({
            role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
            content: m.text,
          }))
        );

        await prisma.message.create({
          data: { conversationId: convo.id, role: "bot", text: reply },
        });
        try {
          await sendWhatsAppMessage(
            settings.waPhoneNumberId,
            settings.waAccessToken,
            from,
            reply
          );
        } catch (e) {
          console.error("WA send error:", e);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
