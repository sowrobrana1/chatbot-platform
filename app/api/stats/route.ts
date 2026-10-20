import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [orders, products, messages, conversations] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id } }),
    prisma.product.findMany({ where: { userId: user.id } }),
    prisma.message.count({
      where: { conversation: { userId: user.id } },
    }),
    prisma.conversation.count({ where: { userId: user.id } }),
  ]);

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => p.stock <= 5).length;

  // Orders by day (last 7 days)
  const byDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const o of orders) {
    const k = o.createdAt.toISOString().slice(0, 10);
    if (k in byDay) byDay[k]++;
  }

  return NextResponse.json({
    revenue,
    totalOrders: orders.length,
    pendingOrders,
    totalProducts: products.length,
    lowStock,
    totalMessages: messages,
    totalConversations: conversations,
    ordersByDay: byDay,
  });
}
