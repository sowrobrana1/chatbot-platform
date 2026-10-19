"use client";

import { useEffect, useState } from "react";

export default function DashboardHome() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const cards = stats
    ? [
        ["💰 মোট বিক্রি", `৳${stats.revenue.toLocaleString()}`],
        ["📦 মোট অর্ডার", stats.totalOrders],
        ["⏳ পেন্ডিং অর্ডার", stats.pendingOrders],
        ["🛍️ প্রোডাক্ট", stats.totalProducts],
        ["⚠️ লো স্টক", stats.lowStock],
        ["💬 মেসেজ", stats.totalMessages],
      ]
    : [];

  return (
    <div>
      <h1>ড্যাশবোর্ড</h1>
      {!stats ? (
        <p>লোড হচ্ছে…</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            {cards.map(([label, value]) => (
              <div key={label as string} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: 32 }}>শেষ ৭ দিনের অর্ডার</h2>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
              {Object.entries(stats.ordersByDay).map(([day, count]) => (
                <div key={day} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    background: "#16a34a", borderRadius: "4px 4px 0 0",
                    height: `${Math.max(4, (count as number) * 24)}px`,
                  }} />
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>{day.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
