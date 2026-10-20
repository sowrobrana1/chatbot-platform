"use client";

import { useEffect, useRef, useState } from "react";

interface ProdImage { url: string; color: string }
interface Product {
  id: string; nameBn: string; nameEn: string; price: number; stock: number; sku: string;
  imageUrl: string; images: string; colors: string; sizes: string;
  freeDelivery: boolean; deliveryAdvance: boolean; active: boolean;
}

interface FormState {
  nameBn: string; nameEn: string; price: string; stock: string; sku: string;
  colors: string; sizes: string; freeDelivery: boolean; deliveryAdvance: boolean;
  images: ProdImage[];
}

const EMPTY: FormState = {
  nameBn: "", nameEn: "", price: "", stock: "", sku: "",
  colors: "", sizes: "", freeDelivery: false, deliveryAdvance: false, images: [],
};

/** Downscale a picked image to a compact JPEG data URI (max 900px) for storage. */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const cx = canvas.getContext("2d");
      if (!cx) { URL.revokeObjectURL(url); reject(new Error("canvas")); return; }
      cx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load")); };
    img.src = url;
  });
}

function parseImages(p: Product): ProdImage[] {
  try {
    const arr = JSON.parse(p.images || "[]");
    if (Array.isArray(arr) && arr.length) {
      return arr.filter((x: any) => x?.url).map((x: any) => ({ url: x.url, color: x.color || "" }));
    }
  } catch { /* fall through */ }
  return p.imageUrl ? [{ url: p.imageUrl, color: "" }] : [];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => fetch("/api/products").then((r) => r.json()).then(setProducts);
  useEffect(() => { load(); }, []);

  const pickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const uris: ProdImage[] = [];
      for (const f of files) uris.push({ url: await fileToDataUri(f), color: "" });
      setForm((s) => ({ ...s, images: [...s.images, ...uris] }));
    } catch {
      alert("কোনো ছবি পড়া যায়নি — আবার চেষ্টা করুন");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const payload = () => ({
    nameBn: form.nameBn,
    nameEn: form.nameEn,
    price: form.price,
    stock: form.stock,
    sku: form.sku,
    colors: form.colors,
    sizes: form.sizes,
    freeDelivery: form.freeDelivery,
    deliveryAdvance: form.deliveryAdvance,
    images: form.images,
    imageUrl: form.images[0]?.url || "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameBn || !form.price) return alert("নাম ও দাম দিন");
    const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return alert(j.error || "সেভ করা যায়নি");
    }
    setForm(EMPTY);
    setEditingId(null);
    load();
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      nameBn: p.nameBn, nameEn: p.nameEn, price: String(p.price), stock: String(p.stock),
      sku: p.sku, colors: p.colors || "", sizes: p.sizes || "",
      freeDelivery: !!p.freeDelivery, deliveryAdvance: !!p.deliveryAdvance,
      images: parseImages(p),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY); };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  const text = (k: keyof FormState, placeholder: string, type = "text", required = false) => (
    <input
      value={String(form[k] ?? "")}
      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      placeholder={placeholder}
      type={type}
      required={required}
      style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }}
    />
  );

  const badge = (bg: string, color: string, label: string) => (
    <span style={{ background: bg, color, fontSize: 12, padding: "2px 8px", borderRadius: 999 }}>{label}</span>
  );

  return (
    <div>
      <h1>প্রোডাক্ট ক্যাটালগ</h1>
      <form onSubmit={submit} style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {text("nameBn", "নাম (বাংলা)", "text", true)}
          {text("nameEn", "Name (English)")}
          {text("price", "দাম ৳", "number", true)}
          {text("stock", "স্টক", "number")}
          {text("sku", "SKU")}
          {text("colors", "কালার (কমা দিয়ে: কমলা, কালো)")}
          {text("sizes", "সাইজ (কমা দিয়ে: M, L, XL)")}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={form.freeDelivery} onChange={(e) => setForm({ ...form, freeDelivery: e.target.checked })} /> 🎁 ডেলিভারি ফ্রি (অফার)
          </label>
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={form.deliveryAdvance} onChange={(e) => setForm({ ...form, deliveryAdvance: e.target.checked })} /> 💳 ডেলিভারি চার্জ অগ্রিম লাগবে
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px dashed #9ca3af", borderRadius: 8, cursor: "pointer", color: "#374151", fontSize: 14 }}>
            📷 ছবি যোগ করুন (একাধিক সিলেক্ট করা যাবে)
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickImages} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            প্রতিটা কালারের জন্য আলাদা ছবি দিন এবং ছবির নিচে কালারের নাম লিখুন — কাস্টমার স্ক্রিনশট পাঠালে AI ছবি ও কালার মিলিয়ে প্রোডাক্ট চিনবে।
          </div>
          {form.images.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              {form.images.map((im, i) => (
                <div key={i} style={{ width: 96 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <input
                    value={im.color}
                    onChange={(e) => {
                      const next = [...form.images];
                      next[i] = { ...next[i], color: e.target.value };
                      setForm({ ...form, images: next });
                    }}
                    placeholder="কালার"
                    style={{ width: "100%", padding: 4, marginTop: 4, border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }}
                  />
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                    style={{ width: "100%", marginTop: 4, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
                    বাদ দিন
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button type="submit" style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
            {editingId ? "💾 এডিট সেভ করুন" : "+ যোগ করুন"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={{ background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
              বাতিল
            </button>
          )}
        </div>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
        {products.map((p) => {
          const imgs = parseImages(p);
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
              {imgs.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto" }}>
                  {imgs.map((im, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={im.url} alt={im.color || p.nameBn} title={im.color}
                      style={{ width: i === 0 ? "100%" : 56, height: i === 0 ? 140 : 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  ))}
                </div>
              )}
              <div style={{ fontWeight: 700 }}>{p.nameBn}</div>
              {p.nameEn && <div style={{ color: "#6b7280", fontSize: 13 }}>{p.nameEn}</div>}
              <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a", margin: "8px 0" }}>৳{p.price.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: p.stock <= 5 ? "#dc2626" : "#6b7280" }}>স্টক: {p.stock}{p.stock <= 5 && " ⚠️"}</div>
              {p.colors && <div style={{ fontSize: 13, color: "#374151" }}>কালার: {p.colors}</div>}
              {p.sizes && <div style={{ fontSize: 13, color: "#374151" }}>সাইজ: {p.sizes}</div>}
              {p.sku && <div style={{ fontSize: 12, color: "#9ca3af" }}>SKU: {p.sku}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {p.freeDelivery && badge("#dcfce7", "#166534", "🎁 ফ্রি ডেলিভারি")}
                {p.deliveryAdvance && badge("#fef9c3", "#854d0e", "💳 অগ্রিম লাগবে")}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => startEdit(p)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>✏️ এডিট</button>
                <button onClick={() => remove(p.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>ডিলিট</button>
              </div>
            </div>
          );
        })}
      </div>
      {products.length === 0 && <p style={{ color: "#6b7280" }}>কোনো প্রোডাক্ট নেই — উপরে ফর্ম থেকে যোগ করুন।</p>}
    </div>
  );
}
