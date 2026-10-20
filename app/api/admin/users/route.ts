import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: true, orders: true } },
      settings: { select: { businessName: true } },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      planExpiresAt: u.planExpiresAt,
      isActive: u.isActive,
      createdAt: u.createdAt,
      businessName: u.settings?.businessName || "",
      productCount: u._count.products,
      orderCount: u._count.orders,
    }))
  );
}
