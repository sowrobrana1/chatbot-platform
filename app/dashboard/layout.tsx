"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "📊 ড্যাশবোর্ড" },
  { href: "/dashboard/products", label: "🛍️ প্রোডাক্ট" },
  { href: "/dashboard/orders", label: "📦 অর্ডার" },
  { href: "/dashboard/bot-studio", label: "🤖 বট স্টুডিও" },
  { href: "/dashboard/analytics", label: "📈 অ্যানালিটিক্স" },
  { href: "/dashboard/settings", label: "⚙️ সেটিংস" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "ফ্রি",
  starter: "স্টার্টার",
  pro: "প্রো",
};

interface MeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280",
  starter: "#2563eb",
  pro: "#d97706",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      <aside style={{ width: 220, background: "#111827", color: "#fff", padding: 16, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>🤖 AI Chatbot</Link>
        <nav style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              style={{
                color: "#fff", textDecoration: "none", padding: "10px 12px",
                borderRadius: 8, background: path === n.href ? "#16a34a" : "transparent",
              }}>{n.label}</Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin"
              style={{ color: "#fbbf24", textDecoration: "none", padding: "10px 12px", borderRadius: 8 }}>
              👑 অ্যাডমিন প্যানেল
            </Link>
          )}
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid #374151", paddingTop: 12 }}>
          {user ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", wordBreak: "break-all" }}>{user.email}</div>
              <span style={{
                display: "inline-block", marginTop: 8, padding: "2px 10px", borderRadius: 999,
                background: PLAN_COLORS[user.plan] || "#6b7280", color: "#fff", fontSize: 12, fontWeight: 700,
              }}>
                {PLAN_LABELS[user.plan] || user.plan} প্ল্যান
              </span>
              <button onClick={logout} style={{
                display: "block", width: "100%", marginTop: 12, background: "#374151", color: "#fff",
                border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer",
              }}>🚪 লগআউট</button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#9ca3af" }}>লোড হচ্ছে…</div>
          )}
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, background: "#f9fafb" }}>{children}</main>
    </div>
  );
}
