import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, productLimitForPlan } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await req.json();
  // Product photos are stored as compressed data URIs; cap sizes.
  const imagesJson = Array.isArray(data.images) ? JSON.stringify(data.images) : "";
  if (imagesJson.length > 3000000) {
    return NextResponse.json(
      { error: "ছবি অনেক বেশি বড় হয়ে গেছে। কম ছবি/ছোট ছবি দিন।" },
      { status: 413 }
    );
  }
  if (typeof data.imageUrl === "string" && data.imageUrl.length > 900000) {
    return NextResponse.json(
      { error: "ছবিটি খুব বড়। ছোট/কম রেজোলিউশনের ছবি দিন।" },
      { status: 413 }
    );
  }
  const limit = productLimitForPlan(user.plan);
  if (limit !== Infinity) {
    const count = await prisma.product.count({ where: { userId: user.id } });
    if (count >= limit) {
      return NextResponse.json(
        { error: `আপনার প্ল্যানে সর্বোচ্চ ${limit}টি প্রোডাক্ট যোগ করা যায়। বেশি প্রোডাক্টের জন্য প্ল্যান আপগ্রেড করুন।` },
        { status: 403 }
      );
    }
  }

  const firstImage = Array.isArray(data.images) && data.images[0]?.url ? data.images[0].url : (data.imageUrl || "");
  const product = await prisma.product.create({
    data: {
      userId: user.id,
      nameBn: data.nameBn,
      nameEn: data.nameEn || "",
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      sku: data.sku || "",
      imageUrl: firstImage,
      images: imagesJson,
      colors: data.colors || "",
      sizes: data.sizes || "",
      freeDelivery: !!data.freeDelivery,
      deliveryAdvance: !!data.deliveryAdvance,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
