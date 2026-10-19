"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <p>লোড হচ্ছে…</p>;

  const max = Math.max(1, ...Object.values(stats.ordersByDay) as number[]);

  return (
    <div>
      <h1>📈 অ্যানালিটিক্স</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
        {[["💬 মোট কথোপকথন", stats.totalConversations], ["✉️ মোট মেসেজ", stats.totalMessages],
          ["📦 মোট অর্ডার", stats.totalOrders], ["💰 মোট বিক্রি", `৳${stats.revenue.toLocaleString()}`]].map(([l, v]) => (
          <div key={l as string} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
            <div style={{ color: "#6b7280", fontSize: 14 }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
      <h2>দৈনিক অর্ডার (৭ দিন)</h2>
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
        {Object.entries(stats.ordersByDay).map(([day, count]) => (
          <div key={day} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 90, fontSize: 13, color: "#6b7280" }}>{day}</div>
            <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 4, height: 20 }}>
              <div style={{ width: `${((count as number) / max) * 100}%`, background: "#16a34a", height: "100%", borderRadius: 4 }} />
            </div>
            <div style={{ width: 30, textAlign: "right" }}>{count as number}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
