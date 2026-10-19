"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string; nameBn: string; nameEn: string; price: number; stock: number; sku: string; active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ nameBn: "", nameEn: "", price: "", stock: "", sku: "" });

  const load = () => fetch("/api/products").then((r) => r.json()).then(setProducts);
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameBn || !form.price) return alert("নাম ও দাম দিন");
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    setForm({ nameBn: "", nameEn: "", price: "", stock: "", sku: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  const input = (k: string) => ({
    value: (form as any)[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
    style: { padding: 8, border: "1px solid #d1d5db", borderRadius: 8 } as React.CSSProperties,
    placeholder: k,
  });

  return (
    <div>
      <h1>প্রোডাক্ট ক্যাটালগ</h1>
      <form onSubmit={add} style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input {...input("nameBn")} placeholder="নাম (বাংলা)" required />
        <input {...input("nameEn")} placeholder="Name (English)" />
        <input {...input("price")} placeholder="দাম ৳" type="number" required />
        <input {...input("stock")} placeholder="স্টক" type="number" />
        <input {...input("sku")} placeholder="SKU" />
        <button type="submit" style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>+ যোগ করুন</button>
      </form>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 700 }}>{p.nameBn}</div>
            {p.nameEn && <div style={{ color: "#6b7280", fontSize: 13 }}>{p.nameEn}</div>}
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a", margin: "8px 0" }}>৳{p.price.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: p.stock <= 5 ? "#dc2626" : "#6b7280" }}>স্টক: {p.stock}{p.stock <= 5 && " ⚠️"}</div>
            {p.sku && <div style={{ fontSize: 12, color: "#9ca3af" }}>SKU: {p.sku}</div>}
            <button onClick={() => remove(p.id)} style={{ marginTop: 8, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>ডিলিট</button>
          </div>
        ))}
      </div>
      {products.length === 0 && <p style={{ color: "#6b7280" }}>কোনো প্রোডাক্ট নেই — উপরে ফর্ম থেকে যোগ করুন।</p>}
    </div>
  );
}
