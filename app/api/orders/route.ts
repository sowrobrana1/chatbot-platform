import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_USER_ID = "demo-user";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: {
      userId: DEMO_USER_ID,
      ...(status ? { status } : {}),
    },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const order = await prisma.order.create({
    data: {
      userId: DEMO_USER_ID,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress || "",
      channel: data.channel || "web",
      subtotal: Number(data.subtotal) || 0,
      deliveryCharge: Number(data.deliveryCharge) || 0,
      total: Number(data.total) || 0,
      notes: data.notes || "",
      items: {
        create: (data.items || []).map((i: { productId: string; quantity: number; price: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(order, { status: 201 });
}
