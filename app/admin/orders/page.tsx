import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "⏳ পেন্ডিং",
  confirmed: "✅ কনফার্মড",
  shipped: "🚚 শিপড",
  delivered: "📦 ডেলিভারড",
  cancelled: "❌ ক্যানসেল",
};

export default async function AdminOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true, settings: { select: { businessName: true } } } },
      items: true,
    },
  });

  const cell: React.CSSProperties = { padding: 12, verticalAlign: "top" };

  return (
    <div>
      <h1>📦 সব অর্ডার (সাম্প্রতিক ৫০টি)</h1>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th style={cell}>ব্যবসা / মালিক</th>
              <th style={cell}>কাস্টমার</th>
              <th style={cell}>চ্যানেল</th>
              <th style={cell}>স্ট্যাটাস</th>
              <th style={cell}>মোট</th>
              <th style={cell}>তারিখ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={cell}>
                  <div style={{ fontWeight: 700 }}>{o.user.settings?.businessName || o.user.name}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{o.user.email}</div>
                </td>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{o.customerPhone}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{o.items.length} আইটেম</div>
                </td>
                <td style={cell}>{o.channel}</td>
                <td style={cell}>{STATUS_LABELS[o.status] || o.status}</td>
                <td style={{ ...cell, fontWeight: 700, color: "#16a34a" }}>৳{o.total.toLocaleString()}</td>
                <td style={cell}>{new Date(o.createdAt).toLocaleDateString("bn-BD")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && <p style={{ color: "#6b7280", marginTop: 16 }}>এখনো কোনো অর্ডার আসেনি।</p>}
    </div>
  );
}
