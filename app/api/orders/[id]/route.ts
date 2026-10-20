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

  const owned = await prisma.order.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.advanceStatus !== undefined) {
    const allowedAdv = ["none", "pending", "claimed", "confirmed"];
    if (!allowedAdv.includes(body.advanceStatus)) {
      return NextResponse.json({ error: "invalid advanceStatus" }, { status: 400 });
    }
    data.advanceStatus = body.advanceStatus;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const order = await prisma.order.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(order);
}
