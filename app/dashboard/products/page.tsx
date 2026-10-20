"use client";

import { useEffect, useRef, useState } from "react";

interface Product {
  id: string; nameBn: string; nameEn: string; price: number; stock: number; sku: string; imageUrl: string; active: boolean;
}

/** Downscale a picked image to a compact JPEG data URI (max 900px) for storage. */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const cx = canvas.getContext("2d");
      if (!cx) { URL.revokeObjectURL(url); reject(new Error("canvas")); return; }
      cx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load")); };
    img.src = url;
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ nameBn: "", nameEn: "", price: "", stock: "", sku: "", imageUrl: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => fetch("/api/products").then((r) => r.json()).then(setProducts);
  useEffect(() => { load(); }, []);

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const uri = await fileToDataUri(f);
      setForm((s) => ({ ...s, imageUrl: uri }));
    } catch {
      alert("ছবিটি পড়া যায়নি — অন্য ছবি চেষ্টা করুন");
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameBn || !form.price) return alert("নাম ও দাম দিন");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error || "যোগ করা যায়নি");
    }
    setForm({ nameBn: "", nameEn: "", price: "", stock: "", sku: "", imageUrl: "" });
    if (fileRef.current) fileRef.current.value = "";
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
      <form onSubmit={add} style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input {...input("nameBn")} placeholder="নাম (বাংলা)" required />
        <input {...input("nameEn")} placeholder="Name (English)" />
        <input {...input("price")} placeholder="দাম ৳" type="number" required />
        <input {...input("stock")} placeholder="স্টক" type="number" />
        <input {...input("sku")} placeholder="SKU" />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px dashed #9ca3af", borderRadius: 8, cursor: "pointer", color: "#374151", fontSize: 14 }}>
          📷 {form.imageUrl ? "ছবি বদলান" : "প্রোডাক্টের ছবি দিন"}
          <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
        </label>
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="product" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
        )}
        <button type="submit" style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>+ যোগ করুন</button>
        <div style={{ width: "100%", fontSize: 12, color: "#6b7280" }}>
          ছবি দিলে কাস্টমার স্ক্রিনশট পাঠালে AI ছবি মিলিয়ে প্রোডাক্ট চিনে দাম বলে দেবে।
        </div>
      </form>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.nameBn} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
            )}
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
