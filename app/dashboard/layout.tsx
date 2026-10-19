"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "📊 ড্যাশবোর্ড" },
  { href: "/dashboard/products", label: "🛍️ প্রোডাক্ট" },
  { href: "/dashboard/orders", label: "📦 অর্ডার" },
  { href: "/dashboard/bot-studio", label: "🤖 বট স্টুডিও" },
  { href: "/dashboard/analytics", label: "📈 অ্যানালিটিক্স" },
  { href: "/dashboard/settings", label: "⚙️ সেটিংস" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      <aside style={{ width: 220, background: "#111827", color: "#fff", padding: 16, flexShrink: 0 }}>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>🤖 AI Chatbot</Link>
        <nav style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              style={{
                color: "#fff", textDecoration: "none", padding: "10px 12px",
                borderRadius: 8, background: path === n.href ? "#16a34a" : "transparent",
              }}>{n.label}</Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24, background: "#f9fafb" }}>{children}</main>
    </div>
  );
}
