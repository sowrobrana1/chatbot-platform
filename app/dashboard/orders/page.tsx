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
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const confirmAdvance = async (id: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advanceStatus: "confirmed" }),
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
                {o.items.map((i: any) => {
                  const nm = i.productName || i.product?.nameBn || "প্রোডাক্ট";
                  const variant = [i.color, i.size].filter(Boolean).join(", ");
                  return `${nm}${variant ? ` (${variant})` : ""} × ${i.quantity}`;
                }).join(", ")}
              </div>
              {o.advanceAmount > 0 && (
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  {o.advanceStatus === "pending" && (
                    <span style={{ background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: 999 }}>
                      ⚠️ অগ্রিম বাকি: ৳{o.advanceAmount} (ডেলিভারি চার্জ)
                    </span>
                  )}
                  {o.advanceStatus === "claimed" && (
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 999 }}>
                        🧾 পেমেন্ট দাবি: ৳{o.advanceAmount}
                        {o.advanceTrxId ? ` · TrxID: ${o.advanceTrxId}` : ""}
                        {o.advanceSender ? ` · নম্বর: ${o.advanceSender}` : ""}
                      </span>
                      <button onClick={() => confirmAdvance(o.id)}
                        style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                        ✅ টাকা পেয়েছি — কনফার্ম
                      </button>
                    </span>
                  )}
                  {o.advanceStatus === "confirmed" && (
                    <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 999 }}>
                      ✅ অগ্রিম পাওয়া গেছে: ৳{o.advanceAmount}
                    </span>
                  )}
                </div>
              )}
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
