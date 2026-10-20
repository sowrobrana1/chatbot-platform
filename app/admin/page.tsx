import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, isPlanActive } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  free: "ফ্রি",
  starter: "স্টার্টার",
  pro: "প্রো",
};

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [users, productsCount, ordersCount, orders, recentSignups] = await Promise.all([
    prisma.user.findMany(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({ where: { status: { not: "cancelled" } }, select: { total: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const activePaid = users.filter((u) => isPlanActive(u.plan, u.planExpiresAt)).length;
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  const card = (title: string, value: string | number, color: string) => (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
      <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  return (
    <div>
      <h1>📊 অ্যাডমিন ওভারভিউ</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {card("মোট ব্যবহারকারী", users.length, "#111827")}
        {card("সক্রিয় পেইড সাবস্ক্রিপশন", activePaid, "#16a34a")}
        {card("মোট প্রোডাক্ট", productsCount, "#2563eb")}
        {card("মোট অর্ডার", ordersCount, "#7c3aed")}
        {card("মোট রেভিনিউ", `৳${revenue.toLocaleString()}`, "#d97706")}
      </div>

      <h2>🆕 সাম্প্রতিক ৫টি সাইনআপ</h2>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th style={{ padding: 12 }}>নাম</th>
              <th style={{ padding: 12 }}>ইমেইল</th>
              <th style={{ padding: 12 }}>প্ল্যান</th>
              <th style={{ padding: 12 }}>যোগদান</th>
            </tr>
          </thead>
          <tbody>
            {recentSignups.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: 12 }}>{u.name}</td>
                <td style={{ padding: 12 }}>{u.email}</td>
                <td style={{ padding: 12 }}>{PLAN_LABELS[u.plan] || u.plan}</td>
                <td style={{ padding: 12 }}>{new Date(u.createdAt).toLocaleDateString("bn-BD")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
