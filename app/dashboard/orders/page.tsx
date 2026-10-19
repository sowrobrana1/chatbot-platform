"use client";

import { useEffect, useState } from "react";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_BN: Record<string, string> = {
  pending: "⏳ পেন্ডিং", confirmed: "✅ কনফার্মড", shipped: "🚚 শিপড",
  delivered: "📦 ডেলিভার্ড", cancelled: "❌ বাতিল",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  const load = () => {
    fetch(`/api/orders${filter ? `?status=${filter}` : ""}`)
      .then((r) => r.json()).then(setOrders);
  };
  useEffect(load, [filter]);

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <h1>অর্ডার ম্যানেজমেন্ট</h1>
      <div style={{ marginBottom: 12 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db" }}>
          <option value="">সব স্ট্যাটাস</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_BN[s]}</option>)}
        </select>
      </div>
      {orders.map((o) => (
        <div key={o.id} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>{o.customerName}</strong> · {o.customerPhone}
              <div style={{ fontSize: 13, color: "#6b7280" }}>{o.customerAddress} · {o.channel}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {o.items.map((i: any) => `${i.product.nameBn} × ${i.quantity}`).join(", ")}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>৳{o.total.toLocaleString()}</div>
              <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}
                style={{ marginTop: 6, padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_BN[s]}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p style={{ color: "#6b7280" }}>কোনো অর্ডার নেই।</p>}
    </div>
  );
}
