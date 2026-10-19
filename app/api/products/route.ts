import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

// TODO: Replace DEMO_USER_ID with real session auth (NextAuth).
const DEMO_USER_ID = "demo-user";

async function ensureDemoUser() {
  let user = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        email: "demo@example.com",
        name: "ডেমো",
        password: "not-used",
        settings: {
          create: { businessName: "ডেমো শপ" },
        },
      },
    });
  }
  return user;
}

export async function GET() {
  await ensureDemoUser();
  const products = await prisma.product.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  await ensureDemoUser();
  const data = await req.json();
  const product = await prisma.product.create({
    data: {
      userId: DEMO_USER_ID,
      nameBn: data.nameBn,
      nameEn: data.nameEn || "",
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      sku: data.sku || "",
      imageUrl: data.imageUrl || "",
    },
  });
  return NextResponse.json(product, { status: 201 });
}
