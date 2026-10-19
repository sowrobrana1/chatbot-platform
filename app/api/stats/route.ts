import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

const DEMO_USER_ID = "demo-user";

export async function GET() {
  const [orders, products, messages, conversations] = await Promise.all([
    prisma.order.findMany({ where: { userId: DEMO_USER_ID } }),
    prisma.product.findMany({ where: { userId: DEMO_USER_ID } }),
    prisma.message.count({
      where: { conversation: { userId: DEMO_USER_ID } },
    }),
    prisma.conversation.count({ where: { userId: DEMO_USER_ID } }),
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
