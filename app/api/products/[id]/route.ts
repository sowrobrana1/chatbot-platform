import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const owned = await prisma.product.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(data.nameBn !== undefined ? { nameBn: data.nameBn } : {}),
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
      ...(data.price !== undefined ? { price: Number(data.price) } : {}),
      ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
      ...(data.sku !== undefined ? { sku: data.sku } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.images !== undefined
        ? {
            images: Array.isArray(data.images) ? JSON.stringify(data.images) : "",
            ...(Array.isArray(data.images) && data.images[0]?.url
              ? { imageUrl: data.images[0].url }
              : {}),
          }
        : {}),
      ...(data.colors !== undefined ? { colors: data.colors } : {}),
      ...(data.sizes !== undefined ? { sizes: data.sizes } : {}),
      ...(data.freeDelivery !== undefined ? { freeDelivery: !!data.freeDelivery } : {}),
      ...(data.deliveryAdvance !== undefined ? { deliveryAdvance: !!data.deliveryAdvance } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const owned = await prisma.product.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
