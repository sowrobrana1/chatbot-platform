import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

const DEMO_USER_ID = "demo-user";

export async function GET() {
  const settings = await prisma.settings.findUnique({
    where: { userId: DEMO_USER_ID },
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
  const data = await req.json();
  const allowed = [
    "businessName", "businessNameEn", "phone", "address",
    "aiProvider", "aiModel", "systemPrompt", "botLanguage", "botTone",
    "deliveryInsideDhaka", "deliveryOutsideDhaka", "codEnabled",
    "fbPageId", "fbPageToken", "fbVerifyToken", "fbConnected",
    "waPhoneNumberId", "waAccessToken", "waVerifyToken", "waConnected",
  ];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (data[k] !== undefined) update[k] = data[k];
  }
  const settings = await prisma.settings.upsert({
    where: { userId: DEMO_USER_ID },
    update,
    create: { userId: DEMO_USER_ID, ...update },
  });
  return NextResponse.json({ ok: true });
}
