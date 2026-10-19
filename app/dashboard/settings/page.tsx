"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [s, setS] = useState<any>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setS(d || {}));
  }, []);

  const save = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaved("✅ সেভ হয়েছে!");
    setTimeout(() => setSaved(""), 2000);
  };

  if (!s) return <p>লোড হচ্ছে…</p>;

  const field = (key: string, label: string, type = "text") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>{label}</label>
      {type === "textarea" ? (
        <textarea value={s[key] || ""} onChange={(e) => setS({ ...s, [key]: e.target.value })}
          rows={4} style={{ width: "100%", maxWidth: 560, padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }} />
      ) : type === "checkbox" ? (
        <input type="checkbox" checked={!!s[key]} onChange={(e) => setS({ ...s, [key]: e.target.checked })} />
      ) : (
        <input type={type} value={s[key] || ""} onChange={(e) => setS({ ...s, [key]: e.target.value })}
          style={{ width: "100%", maxWidth: 560, padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }} />
      )}
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb", marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div>
      <h1>⚙️ সেটিংস</h1>

      {section("🏪 ব্যবসার তথ্য", <>
        {field("businessName", "ব্যবসার নাম (বাংলা)")}
        {field("businessNameEn", "Business Name (English)")}
        {field("phone", "ফোন")}
        {field("address", "ঠিকানা")}
      </>)}

      {section("🤖 AI কনফিগ", <>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>AI প্রোভাইডার</label>
          <select value={s.aiProvider || "anthropic"} onChange={(e) => setS({ ...s, aiProvider: e.target.value })}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db" }}>
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT (OpenAI)</option>
          </select>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            TODO: .env-এ ANTHROPIC_API_KEY / OPENAI_API_KEY বসান (DEPLOY.md দেখুন)
          </div>
        </div>
        {field("aiModel", "মডেল (যেমন claude-3-5-sonnet-20240620)")}
        {field("systemPrompt", "অতিরিক্ত নির্দেশনা (system prompt)", "textarea")}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>বটের ভাষা</label>
          <select value={s.botLanguage || "bn"} onChange={(e) => setS({ ...s, botLanguage: e.target.value })}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #d1d5db" }}>
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </div>
      </>)}

      {section("🚚 ডেলিভারি", <>
        {field("deliveryInsideDhaka", "ঢাকার ভিতরে চার্জ ৳", "number")}
        {field("deliveryOutsideDhaka", "ঢাকার বাইরে চার্জ ৳", "number")}
        <label><input type="checkbox" checked={!!s.codEnabled} onChange={(e) => setS({ ...s, codEnabled: e.target.checked })} /> ক্যাশ অন ডেলিভারি চালু</label>
      </>)}

      {section("📘 Facebook Messenger", <>
        {field("fbPageId", "Page ID")}
        {field("fbPageToken", "Page Access Token (খালি রাখলে আগেরটা থাকবে)")}
        <label><input type="checkbox" checked={!!s.fbConnected} onChange={(e) => setS({ ...s, fbConnected: e.target.checked })} /> সংযুক্ত</label>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Webhook URL: <code>https://YOUR-DOMAIN/api/webhooks/facebook</code><br />
          সেটআপ ধাপ DEPLOY.md-এ।
        </div>
      </>)}

      {section("💚 WhatsApp Cloud API", <>
        {field("waPhoneNumberId", "Phone Number ID")}
        {field("waAccessToken", "Access Token (খালি রাখলে আগেরটা থাকবে)")}
        <label><input type="checkbox" checked={!!s.waConnected} onChange={(e) => setS({ ...s, waConnected: e.target.checked })} /> সংযুক্ত</label>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Webhook URL: <code>https://YOUR-DOMAIN/api/webhooks/whatsapp</code><br />
          সেটআপ ধাপ DEPLOY.md-এ।
        </div>
      </>)}

      <button onClick={save} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 16, cursor: "pointer" }}>
        💾 সেভ করুন
      </button>
      {saved && <span style={{ marginLeft: 12, color: "#16a34a" }}>{saved}</span>}
    </div>
  );
}
