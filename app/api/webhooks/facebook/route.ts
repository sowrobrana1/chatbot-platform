import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateBotReply,
  generateImageReply,
  generatePaymentCheck,
  extractOrderFromConversation,
  BotContext,
  CatalogImage,
} from "@/lib/ai";
import { sendFacebookMessage, verifyFacebookSignature } from "@/lib/facebook";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Facebook Messenger webhook.
 * GET  -> verification (Meta calls this when you configure the webhook)
 * POST -> incoming messages
 *
 * In Meta App Dashboard > Messenger > Settings, set:
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

async function buildContext(
  userId: string,
  pendingAdvance: { amount: number; productName: string } | null
): Promise<BotContext> {
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const products = await prisma.product.findMany({
    where: { userId, active: true },
    select: {
      nameBn: true, nameEn: true, price: true, stock: true,
      colors: true, sizes: true, freeDelivery: true, deliveryAdvance: true,
    },
  });
  return {
    businessName: settings?.businessName || settings?.businessNameEn || "আমাদের শপ",
    products,
    deliveryInsideDhaka: settings?.deliveryInsideDhaka ?? 60,
    deliveryOutsideDhaka: settings?.deliveryOutsideDhaka ?? 120,
    codEnabled: settings?.codEnabled ?? true,
    language: (settings?.botLanguage as "bn" | "en") || "bn",
    tone: settings?.botTone || "friendly",
    systemPrompt: settings?.systemPrompt || "",
    bkashNumber: settings?.bkashNumber || "",
    nagadNumber: settings?.nagadNumber || "",
    rocketNumber: settings?.rocketNumber || "",
    pendingAdvance,
  };
}

function parseMarker(reply: string, tag: string): { data: Record<string, string> | null; clean: string } {
  const re = new RegExp(`\\[\\[${tag}\\|([^\\]]+)\\]\\]`);
  const m = reply.match(re);
  if (!m) return { data: null, clean: reply };
  const data: Record<string, string> = {};
  for (const part of m[1].split("|")) {
    const idx = part.indexOf("=");
    if (idx > 0) data[part.slice(0, idx).trim().toLowerCase()] = part.slice(idx + 1).trim();
  }
  return { data, clean: reply.replace(re, "").trim() };
}

interface OrderData {
  product?: string;
  color?: string;
  size?: string;
  qty?: string | number;
  name?: string;
  phone?: string;
  address?: string;
}

/**
 * Create a real Order row from extracted/marker order data.
 * Product resolution is deliberately forgiving: exact/includes name match,
 * then color-name match, then — if the shop has exactly ONE active product —
 * that product. Dedupes against an identical order from the same sender in
 * the last 60 minutes (Facebook redelivers webhook events).
 * Returns true when an order exists (created now or already present).
 */
async function tryCreateOrder(
  userId: string,
  senderId: string,
  ctx: BotContext,
  d: OrderData
): Promise<boolean> {
  try {
    const phone = (d.phone || "").replace(/[\s-]/g, "");
    if (!phone) return false;
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const dup = await prisma.order.findFirst({
      where: { userId, senderId, customerPhone: phone, createdAt: { gt: since } },
    });
    if (dup) return true;

    const all = await prisma.product.findMany({ where: { userId, active: true } });
    const want = (d.product || "").trim().toLowerCase();
    let product =
      all.find(
        (p: any) =>
          p.nameBn.trim().toLowerCase() === want || p.nameEn.trim().toLowerCase() === want
      ) ||
      all.find(
        (p: any) =>
          want &&
          (p.nameBn.toLowerCase().includes(want) || want.includes(p.nameBn.trim().toLowerCase()))
      ) ||
      all.find((p: any) => {
        const cols = (p.colors || "")
          .split(",")
          .map((c: string) => c.trim().toLowerCase())
          .filter(Boolean);
        return want && cols.includes(want);
      });
    if (!product && all.length === 1) product = all[0];
    if (!product) {
      console.error("Order not created: product unresolved", { want, d });
      return false;
    }
    const qty = Math.max(1, parseInt(String(d.qty || "1"), 10) || 1);
    const address = d.address || "";
    const inDhaka = /ঢাকা|dhaka/i.test(address);
    const delivery = product.freeDelivery
      ? 0
      : inDhaka
        ? ctx.deliveryInsideDhaka
        : ctx.deliveryOutsideDhaka;
    const needsAdvance = product.deliveryAdvance && delivery > 0;
    await prisma.order.create({
      data: {
        userId,
        customerName: d.name || "Messenger Customer",
        customerPhone: phone,
        customerAddress: address,
        channel: "facebook",
        senderId,
        status: "pending",
        subtotal: product.price * qty,
        deliveryCharge: delivery,
        total: product.price * qty + delivery,
        advanceAmount: needsAdvance ? delivery : 0,
        advanceStatus: needsAdvance ? "pending" : "none",
        notes: `কালার: ${d.color || "-"}, সাইজ: ${d.size || "-"}`,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.nameBn,
              color: d.color || "",
              size: d.size || "",
              quantity: qty,
              price: product.price,
            },
          ],
        },
      },
    });
    return true;
  } catch (e) {
    console.error("tryCreateOrder failed:", e);
    return false;
  }
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
      const userId = settings.userId;

      // Save conversation
      let convo = await prisma.conversation.findFirst({
        where: { userId, channel: "facebook", senderId },
      });
      if (!convo) {
        convo = await prisma.conversation.create({
          data: { userId, channel: "facebook", senderId },
        });
      }
      // Facebook redelivers the same event when the first delivery is slow;
      // an identical text from this sender within 3 minutes is a duplicate —
      // skip it so the customer never gets two contradictory replies.
      if (text) {
        const lastUserMsg = await prisma.message.findFirst({
          where: { conversationId: convo.id, role: "user" },
          orderBy: { createdAt: "desc" },
        });
        if (
          lastUserMsg &&
          lastUserMsg.text === text &&
          Date.now() - lastUserMsg.createdAt.getTime() < 3 * 60 * 1000
        ) {
          continue;
        }
      }

      await prisma.message.create({
        data: {
          conversationId: convo.id,
          role: "user",
          text: text || "[কাস্টমার একটি ছবি পাঠিয়েছেন]",
        },
      });

      // Is there an earlier order from this customer with an unpaid advance?
      const pendingOrder = await prisma.order.findFirst({
        where: { userId, senderId, channel: "facebook", advanceStatus: "pending" },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });
      const pendingAdvance = pendingOrder
        ? {
            amount: pendingOrder.advanceAmount,
            productName: pendingOrder.items[0]?.productName || "অর্ডার",
          }
        : null;

      const ctx = await buildContext(userId, pendingAdvance);
      let reply: string | null = null;

      // --- Customer sent an image ---
      if (imageUrl) {
        try {
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error(`image fetch ${imgRes.status}`);
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const dataUri = `data:${mime};base64,${buf.toString("base64")}`;

          // If an advance payment is outstanding, first check whether this
          // image is a payment receipt for it.
          if (pendingOrder) {
            const check = await generatePaymentCheck(dataUri, pendingOrder.advanceAmount);
            if (check?.looksLikePayment) {
              if (check.amount !== null && check.amount >= pendingOrder.advanceAmount) {
                await prisma.order.update({
                  where: { id: pendingOrder.id },
                  data: {
                    advanceStatus: "claimed",
                    advanceTrxId: check.trxId,
                    advanceSender: check.sender,
                  },
                });
                reply =
                  ctx.language === "bn"
                    ? `ধন্যবাদ! ✅ আপনার পেমেন্টের ছবি পেয়েছি — ৳${check.amount}${check.trxId ? `, TrxID: ${check.trxId}` : ""}। আমরা যাচাই করে আপনার অর্ডারটি কনফার্ম করছি।`
                    : `Thank you! ✅ Payment screenshot received — ৳${check.amount}${check.trxId ? `, TrxID: ${check.trxId}` : ""}. We will verify and confirm your order.`;
              } else {
                reply =
                  ctx.language === "bn"
                    ? `আপনার পেমেন্টের ছবি পেয়েছি, কিন্তু পরিমাণ মিলছে না। এই অর্ডারের ডেলিভারি চার্জ অগ্রিম লাগবে ৳${pendingOrder.advanceAmount}। অনুগ্রহ করে সঠিক পরিমাণ পাঠিয়ে আবার স্ক্রিনশটটি দিন, অথবা TrxID নম্বরটি লিখে পাঠান।`
                    : `I received your payment screenshot, but the amount doesn't match. The advance delivery charge for this order is ৳${pendingOrder.advanceAmount}. Please send the correct amount and share the screenshot or TrxID.`;
              }
            }
          }

          // Otherwise treat it as a product photo: match against the catalog.
          if (!reply) {
            const prods = await prisma.product.findMany({
              where: { userId, active: true },
              select: {
                nameBn: true, nameEn: true, price: true, stock: true,
                imageUrl: true, images: true,
              },
            });
            const catalog: CatalogImage[] = [];
            for (const p of prods) {
              let imgs: { url: string; color?: string }[] = [];
              try {
                const parsed = JSON.parse(p.images || "[]");
                if (Array.isArray(parsed)) imgs = parsed.filter((x: any) => x?.url);
              } catch { /* legacy single image below */ }
              if (imgs.length === 0 && p.imageUrl) imgs = [{ url: p.imageUrl }];
              for (const im of imgs) {
                catalog.push({
                  nameBn: im.color ? `${p.nameBn} (${im.color})` : p.nameBn,
                  nameEn: p.nameEn,
                  price: p.price,
                  stock: p.stock,
                  imageUrl: im.url,
                });
              }
            }
            reply = await generateImageReply(dataUri, ctx, catalog);
          }
        } catch (e) {
          console.error("FB image handling failed:", e);
          reply =
            ctx.language === "bn"
              ? "দুঃখিত, ছবিটি দেখতে পারিনি। কোন প্রোডাক্টটি খুঁজছেন নাম লিখে পাঠান, দাম জানিয়ে দিচ্ছি।"
              : "Sorry, I couldn't view the image. Please type the product name and I'll share the price.";
        }
      }

      // --- Normal text message ---
      if (!reply) {
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

        // Customer says they paid the advance (bot emits a PAID marker)
        const paid = parseMarker(reply, "PAID");
        if (paid.data) {
          reply = paid.clean;
          if (pendingOrder) {
            await prisma.order.update({
              where: { id: pendingOrder.id },
              data: {
                advanceStatus: "claimed",
                advanceTrxId: paid.data.trx || "",
                advanceSender: paid.data.sender || "",
              },
            });
          }
        }

        // Bot completed an order (ORDER marker) -> save it for real
        const ord = parseMarker(reply, "ORDER");
        let orderSaved = false;
        if (ord.data) {
          reply = ord.clean;
          orderSaved = await tryCreateOrder(userId, senderId, ctx, ord.data);
        }

        // Recovery sweep: the bot confirmed an order in prose but forgot the
        // marker (happens in follow-up turns). If this reply sounds like an
        // order confirmation and the conversation contains a phone number,
        // extract the order from the transcript and save it for real.
        if (
          !orderSaved &&
          /কনফার্ম|অর্ডারটি গৃহীত|অর্ডার কনফার্ম|order (is )?confirmed/i.test(reply)
        ) {
          try {
            // NOTE: history was already reversed to chronological order above.
            const transcript = [
              ...history.map((m) => ({
                role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
                content: m.text,
              })),
              { role: "user" as const, content: text as string },
              { role: "assistant" as const, content: reply },
            ];
            const hasPhone = transcript.some((m) => /01\d{9}/.test(m.content.replace(/[\s-]/g, "")));
            if (hasPhone) {
              const extracted = await extractOrderFromConversation(transcript);
              if (extracted) {
                await tryCreateOrder(userId, senderId, ctx, extracted);
              }
            }
          } catch (e) {
            console.error("Order recovery sweep failed:", e);
          }
        }
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
