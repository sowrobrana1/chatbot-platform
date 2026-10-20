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
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = await req.json();
  const update: Record<string, unknown> = {};

  if (data.plan !== undefined) {
    if (!["free", "starter", "pro"].includes(data.plan)) {
      return NextResponse.json({ error: "ভুল প্ল্যান" }, { status: 400 });
    }
    update.plan = data.plan;
  }
  if (data.planExpiresAt !== undefined) {
    update.planExpiresAt = data.planExpiresAt === "" || data.planExpiresAt === null
      ? null
      : new Date(data.planExpiresAt);
  }
  if (data.isActive !== undefined) {
    update.isActive = !!data.isActive;
  }
  if (data.role !== undefined) {
    if (!["user", "admin"].includes(data.role)) {
      return NextResponse.json({ error: "ভুল রোল" }, { status: 400 });
    }
    update.role = data.role;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "পরিবর্তনের কিছু নেই" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: update,
    });
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      plan: updated.plan,
      planExpiresAt: updated.planExpiresAt,
      isActive: updated.isActive,
    });
  } catch {
    return NextResponse.json({ error: "ব্যবহারকারী পাওয়া যায়নি" }, { status: 404 });
  }
}
