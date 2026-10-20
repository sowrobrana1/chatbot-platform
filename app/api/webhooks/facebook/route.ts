import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBotReply, generateImageReply, BotContext } from "@/lib/ai";
import { sendFacebookMessage, verifyFacebookSignature } from "@/lib/facebook";

export const dynamic = 'force-dynamic';

/**
 * Facebook Messenger webhook.
 * GET  -> verification (Meta calls this when you configure the webhook)
 * POST -> incoming messages
 *
 * TODO: In Meta App Dashboard > Messenger > Settings, set:
 *   Callback URL: https://YOUR-DOMAIN/api/webhooks/facebook
 *   Verify Token: same as FB_VERIFY_TOKEN in .env
 *   Subscribe to: messages, messaging_postbacks
 */

// Verification handshake
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const mode = q.get("hub.mode");
  const token = q.get("hub.verify_token");
  const challenge = q.get("hub.challenge");

  // Accept either the global env token or a per-user token stored in Settings.
  // For multi-tenant, look up by token in a real implementation.
  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
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
  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  const ok = await verifyFacebookSignature(rawBody, sig);
  if (!ok) return new NextResponse("Invalid signature", { status: 401 });

  const body = JSON.parse(rawBody);
  if (body.object !== "page") return NextResponse.json({ ok: true });

  for (const entry of body.entry || []) {
    const pageId = entry.id;
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;
      const imageUrl: string | undefined = (event.message?.attachments || []).find(
        (a: any) => a.type === "image"
      )?.payload?.url;
      if (!senderId || event.message?.is_echo) continue;
      if (!text && !imageUrl) continue;

      // Find the owner of this page
      const settings = await prisma.settings.findFirst({
        where: { fbPageId: pageId, fbConnected: true },
        include: { user: true },
      });
      if (!settings) continue;

      // Save conversation
      let convo = await prisma.conversation.findFirst({
        where: { userId: settings.userId, channel: "facebook", senderId },
      });
      if (!convo) {
        convo = await prisma.conversation.create({
          data: { userId: settings.userId, channel: "facebook", senderId },
        });
      }
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          role: "user",
          text: text || "[কাস্টমার একটি ছবি পাঠিয়েছেন]",
        },
      });

      // Generate + send reply
      const ctx = await buildContext(settings.userId);
      let reply: string;
      if (imageUrl) {
        // Customer sent a product photo/screenshot: download it and let the
        // vision model match it against catalog product photos.
        try {
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error(`image fetch ${imgRes.status}`);
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const dataUri = `data:${mime};base64,${buf.toString("base64")}`;
          const catalog = await prisma.product.findMany({
            where: { userId: settings.userId, active: true, NOT: { imageUrl: "" } },
            select: { nameBn: true, nameEn: true, price: true, stock: true, imageUrl: true },
          });
          reply = await generateImageReply(dataUri, ctx, catalog);
        } catch (e) {
          console.error("FB image handling failed:", e);
          reply =
            ctx.language === "bn"
              ? "দুঃখিত, ছবিটি দেখতে পারিনি। কোন প্রোডাক্টটি খুঁজছেন নাম লিখে পাঠান, দাম জানিয়ে দিচ্ছি।"
              : "Sorry, I couldn't view the image. Please type the product name and I'll share the price.";
        }
      } else {
        const history = await prisma.message.findMany({
          where: { conversationId: convo.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
        reply = await generateBotReply(
          text as string,
          ctx,
          history.reverse().map((m) => ({
            role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
            content: m.text,
          }))
        );
      }

      await prisma.message.create({
        data: { conversationId: convo.id, role: "bot", text: reply },
      });
      try {
        await sendFacebookMessage(settings.fbPageToken, senderId, reply);
      } catch (e) {
        console.error("FB send error:", e);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
