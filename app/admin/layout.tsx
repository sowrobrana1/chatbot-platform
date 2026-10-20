import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "📊 ওভারভিউ" },
  { href: "/admin/users", label: "👥 ব্যবহারকারী" },
  { href: "/admin/orders", label: "📦 সব অর্ডার" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      <aside style={{ width: 220, background: "#111827", color: "#fff", padding: 16, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <Link href="/dashboard" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>👑 অ্যাডমিন</Link>
        <nav style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              style={{ color: "#fff", textDecoration: "none", padding: "10px 12px", borderRadius: 8 }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid #374151", paddingTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", wordBreak: "break-all" }}>{user.email}</div>
          <Link href="/dashboard" style={{ display: "inline-block", marginTop: 10, color: "#93c5fd", fontSize: 13, textDecoration: "none" }}>
            ← ইউজার ড্যাশবোর্ডে যান
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, background: "#f9fafb" }}>{children}</main>
    </div>
  );
}
