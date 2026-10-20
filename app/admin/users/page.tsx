"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  businessName: string;
  productCount: number;
  orderCount: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "ফ্রি",
  starter: "স্টার্টার",
  pro: "প্রো",
};

const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280",
  starter: "#2563eb",
  pro: "#d97706",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, body: Record<string, unknown>) => {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert(d.error || "আপডেট ব্যর্থ হয়েছে।");
      return;
    }
    load();
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("bn-BD") : "—";

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const cell: React.CSSProperties = { padding: 12, verticalAlign: "top" };

  return (
    <div>
      <h1>👥 ব্যবহারকারী ({users.length})</h1>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 নাম বা ইমেইল দিয়ে খুঁজুন…"
        style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8, width: "100%", maxWidth: 400, marginBottom: 16 }}
      />
      {loading ? (
        <p>লোড হচ্ছে…</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={cell}>ব্যবহারকারী</th>
                <th style={cell}>প্ল্যান</th>
                <th style={cell}>মেয়াদ শেষ</th>
                <th style={cell}>স্ট্যাটাস</th>
                <th style={cell}>প্রোডাক্ট/অর্ডার</th>
                <th style={cell}>যোগদান</th>
                <th style={cell}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={cell}>
                    <div style={{ fontWeight: 700 }}>{u.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>{u.email}</div>
                    {u.businessName && <div style={{ color: "#6b7280", fontSize: 12 }}>🏪 {u.businessName}</div>}
                    {u.role === "admin" && <div style={{ fontSize: 12, color: "#d97706", fontWeight: 700 }}>👑 অ্যাডমিন</div>}
                  </td>
                  <td style={cell}>
                    <select
                      value={u.plan}
                      onChange={(e) => update(u.id, { plan: e.target.value })}
                      style={{ padding: 6, borderRadius: 6, border: "1px solid #d1d5db", background: PLAN_COLORS[u.plan] || "#6b7280", color: "#fff", fontWeight: 700 }}
                    >
                      <option value="free">ফ্রি</option>
                      <option value="starter">স্টার্টার</option>
                      <option value="pro">প্রো</option>
                    </select>
                  </td>
                  <td style={cell}>
                    <input
                      type="date"
                      defaultValue={u.planExpiresAt ? u.planExpiresAt.slice(0, 10) : ""}
                      onChange={(e) => update(u.id, { planExpiresAt: e.target.value || null })}
                      style={{ padding: 6, borderRadius: 6, border: "1px solid #d1d5db" }}
                    />
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{fmtDate(u.planExpiresAt)}</div>
                  </td>
                  <td style={cell}>
                    <button
                      onClick={() => update(u.id, { isActive: !u.isActive })}
                      style={{
                        padding: "6px 10px", borderRadius: 999, border: "none", cursor: "pointer",
                        background: u.isActive ? "#dcfce7" : "#fee2e2",
                        color: u.isActive ? "#166534" : "#b91c1c", fontWeight: 700, fontSize: 12,
                      }}
                    >
                      {u.isActive ? "✅ সক্রিয়" : "⛔ নিষ্ক্রিয়"}
                    </button>
                  </td>
                  <td style={cell}>
                    {u.productCount} প্রোডাক্ট<br />{u.orderCount} অর্ডার
                  </td>
                  <td style={cell}>{fmtDate(u.createdAt)}</td>
                  <td style={cell}>
                    <button
                      onClick={() => {
                        if (confirm(`${u.name}-কে প্ল্যানের মেয়াদ ৩০ দিন বাড়াবেন?`)) {
                          const base = u.planExpiresAt && new Date(u.planExpiresAt).getTime() > Date.now()
                            ? new Date(u.planExpiresAt)
                            : new Date();
                          base.setDate(base.getDate() + 30);
                          update(u.id, { planExpiresAt: base.toISOString() });
                        }
                      }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}
                    >
                      ➕ ৩০ দিন বাড়ান
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filtered.length === 0 && <p style={{ color: "#6b7280" }}>কোনো ব্যবহারকারী পাওয়া যায়নি।</p>}
    </div>
  );
}
