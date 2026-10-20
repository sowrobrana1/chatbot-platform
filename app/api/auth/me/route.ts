import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      isActive: user.isActive,
    },
  });
}
