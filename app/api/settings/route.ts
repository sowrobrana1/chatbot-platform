import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await prisma.settings.findUnique({
    where: { userId: user.id },
  });
  // Never leak full tokens to the client
  if (settings) {
    const { fbPageToken, waAccessToken, ...safe } = settings;
    return NextResponse.json({
      ...safe,
      fbPageTokenSet: !!fbPageToken,
      waAccessTokenSet: !!waAccessToken,
    });
  }
  return NextResponse.json(null);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await req.json();
  const allowed = [
    "businessName", "businessNameEn", "phone", "address",
    "aiProvider", "aiModel", "systemPrompt", "botLanguage", "botTone", "botMode",
    "deliveryInsideDhaka", "deliveryOutsideDhaka", "codEnabled",
    "bkashNumber", "nagadNumber", "rocketNumber",
    "fbPageId", "fbPageToken", "fbVerifyToken", "fbConnected",
    "waPhoneNumberId", "waAccessToken", "waVerifyToken", "waConnected",
  ];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    update,
    create: { userId: user.id, ...update },
  });
  return NextResponse.json({ ok: true });
}
