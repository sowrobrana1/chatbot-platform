import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createSessionToken,
  setSessionCookieValue,
  ADMIN_EMAIL,
} from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    const nameStr = typeof name === "string" ? name.trim() : "";
    const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordStr = typeof password === "string" ? password : "";

    if (!nameStr || !emailStr || !passwordStr) {
      return NextResponse.json(
        { error: "নাম, ইমেইল এবং পাসওয়ার্ড — সবকিছু দিন।" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return NextResponse.json(
        { error: "সঠিক ইমেইল ঠিকানা দিন।" },
        { status: 400 }
      );
    }
    if (passwordStr.length < 6) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: emailStr } });
    if (existing) {
      return NextResponse.json(
        { error: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে। লগইন করুন।" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(passwordStr);
    const role = emailStr === ADMIN_EMAIL ? "admin" : "user";

    const user = await prisma.user.create({
      data: {
        name: nameStr,
        email: emailStr,
        password: hashed,
        role,
        plan: "free",
        settings: { create: {} },
      },
    });

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan },
    });
    res.cookies.set(setSessionCookieValue(token));
    return res;
  } catch (e) {
    console.error("signup failed:", e);
    return NextResponse.json(
      { error: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
