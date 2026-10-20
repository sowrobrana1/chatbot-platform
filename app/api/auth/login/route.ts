import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookieValue,
} from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordStr = typeof password === "string" ? password : "";

    if (!emailStr || !passwordStr) {
      return NextResponse.json(
        { error: "ইমেইল ও পাসওয়ার্ড দিন।" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: emailStr } });
    if (!user) {
      return NextResponse.json(
        { error: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" },
        { status: 401 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। সাপোর্টে যোগাযোগ করুন।" },
        { status: 403 }
      );
    }
    const ok = await verifyPassword(passwordStr, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan },
    });
    res.cookies.set(setSessionCookieValue(token));
    return res;
  } catch (e) {
    console.error("login failed:", e);
    return NextResponse.json(
      { error: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
