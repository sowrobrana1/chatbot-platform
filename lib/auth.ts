import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 7;

function secretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.uid === "string" ? payload.uid : null;
  } catch {
    return null;
  }
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: Date | null;
  isActive: boolean;
}

/** Read the session cookie and return the logged-in user (or null). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = await verifySessionToken(token);
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    isActive: user.isActive,
  };
}

/** Set the session cookie on a NextResponse. */
export function setSessionCookieValue(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

/** Check whether a user's plan is currently active (paid, not expired). */
export function isPlanActive(plan: string, planExpiresAt: Date | null): boolean {
  if (plan === "free") return false;
  if (!planExpiresAt) return false;
  return planExpiresAt.getTime() > Date.now();
}

/** Free/Starter/Pro product limits. */
export function productLimitForPlan(plan: string): number {
  if (plan === "starter") return 200;
  if (plan === "pro") return Infinity;
  return 20; // free
}

export const ADMIN_EMAIL = "sowrobhasanrana39@gmail.com";

export const PLAN_LABELS: Record<string, string> = {
  free: "ফ্রি",
  starter: "স্টার্টার",
  pro: "প্রো",
};

export const PLAN_PRICES: Record<string, string> = {
  free: "৳০/মাস",
  starter: "৳৪৯৯/মাস",
  pro: "৳১,৪৯৯/মাস",
};
