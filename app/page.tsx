"use client";

import { useState } from "react";

type Lang = "bn" | "en";

const STR: Record<Lang, Record<string, string>> = {
  bn: {
    badge: "🚀 বাংলাদেশের সেরা AI অটোমেশন প্ল্যাটফর্ম",
    title: "Facebook ও WhatsApp-এর জন্য AI চ্যাটবট",
    sub: "আপনার Facebook Page ও WhatsApp-এ বাংলা AI চ্যাটবট বসান। অর্ডার নিন, প্রশ্নের উত্তর দিন, বিক্রি বাড়ান — সম্পূর্ণ অটোমেটিক, ২৪/৭।",
    cta1: "ফ্রি শুরু করুন →",
    cta2: "ড্যাশবোর্ড দেখুন",
    f1t: "🤖 স্মার্ট AI রিপ্লাই",
    f1d: "Claude, GPT-4, Gemini — পছন্দের মডেল বেছে নিন। বাংলা বোঝে, প্রসঙ্গ ধরে উত্তর দেয়।",
    f2t: "💬 মাল্টি-প্ল্যাটফর্ম ইনবক্স",
    f2d: "Facebook Messenger, WhatsApp, Instagram — সব কথোপকথন এক ড্যাশবোর্ডে।",
    f3t: "🛍️ প্রোডাক্ট ক্যাটালগ",
    f3d: "ছবি, দাম, স্টকসহ প্রোডাক্ট আপলোড করুন। বট নিজেই কাস্টমারকে দেখাবে ও অর্ডার নেবে।",
    f4t: "📦 অর্ডার ম্যানেজমেন্ট",
    f4d: "কনফার্ম থেকে ডেলিভারি পর্যন্ত ট্র্যাক করুন।",
    f5t: "📊 অ্যানালিটিক্স",
    f5d: "মেসেজ, কনভার্সন, বিক্রি — ডেটা দেখে সিদ্ধান্ত নিন।",
    f6t: "🧠 স্মার্ট ফলো-আপ",
    f6d: "অটো ফলো-আপ মেসেজে কাস্টমার ফিরিয়ে আনুন।",
    demoTitle: "লাইভ ডেমো — বটকে প্রশ্ন করুন",
    demoPh: "লিখুন: শাড়ির দাম কত?",
    demoSend: "পাঠান",
    priceTitle: "প্যাকেজ",
    p1: "স্টার্টার", p1p: "৳৪৯৯/মাস",
    p2: "বিজনেস", p2p: "৳১,৪৯৯/মাস",
    p3: "এন্টারপ্রাইজ", p3p: "৳৪,৯৯৯/মাস",
    faqTitle: "সাধারণ প্রশ্ন",
    q1: "সেটআপ করতে কতক্ষণ লাগে?",
    a1: "মাত্র ৫ মিনিট। Facebook Page লিংক করুন, প্রোডাক্ট যোগ করুন — বট লাইভ!",
    q2: "বাংলায় উত্তর দেবে?",
    a2: "হ্যাঁ, সম্পূর্ণ বাংলায় — এমনকি বাংলিশ মিশিয়েও বোঝে।",
    q3: "কোন AI মডেল ব্যবহার হয়?",
    a3: "Claude, GPT-4, Gemini — ড্যাশবোর্ড থেকে বেছে নিতে পারবেন।",
    footer: "© ২০২৬ AI Chatbot Platform — ঢাকা, বাংলাদেশ",
  },
  en: {
    badge: "🚀 Bangladesh's Leading AI Automation Platform",
    title: "AI Chatbot for Facebook & WhatsApp",
    sub: "Set up a Bangla AI chatbot on your Facebook Page and WhatsApp. Take orders, answer questions, grow sales — fully automatic, 24/7.",
    cta1: "Get Started Free →",
    cta2: "View Dashboard",
    f1t: "🤖 Smart AI Replies",
    f1d: "Claude, GPT-4, Gemini — pick your model. Understands Bangla, replies with context.",
    f2t: "💬 Multi-Platform Inbox",
    f2d: "Facebook Messenger, WhatsApp, Instagram — all in one dashboard.",
    f3t: "🛍️ Product Catalog",
    f3d: "Upload products with photos, prices, stock. The bot shows them and takes orders.",
    f4t: "📦 Order Management",
    f4d: "Track from confirm to delivery.",
    f5t: "📊 Analytics",
    f5d: "Messages, conversion, sales — decide with data.",
    f6t: "🧠 Smart Follow-ups",
    f6d: "Auto follow-up messages win customers back.",
    demoTitle: "Live Demo — Ask the Bot",
    demoPh: "Type: What is the saree price?",
    demoSend: "Send",
    priceTitle: "Pricing",
    p1: "Starter", p1p: "৳499/mo",
    p2: "Business", p2p: "৳1,499/mo",
    p3: "Enterprise", p3p: "৳4,999/mo",
    faqTitle: "FAQ",
    q1: "How long does setup take?",
    a1: "Just 5 minutes. Link your Facebook Page, add products — bot is live!",
    q2: "Does it reply in Bangla?",
    a2: "Yes, fully in Bangla — even mixed Banglish.",
    q3: "Which AI models are used?",
    a3: "Claude, GPT-4, Gemini — choose from the dashboard.",
    footer: "© 2026 AI Chatbot Platform — Dhaka, Bangladesh",
  },
};

const DEMO_PRODUCTS = [
  { nameBn: "জামদানি শাড়ি", nameEn: "Jamdani Saree", price: 2500, stock: 15 },
  { nameBn: "সুতি পাঞ্জাবি", nameEn: "Cotton Panjabi", price: 1250, stock: 20 },
];

function fakeBotReply(q: string, lang: Lang): string {
  const s = q.toLowerCase();
  if (/দাম|price|cost|কত/.test(s)) {
    return lang === "bn"
      ? "জামদানি শাড়ি ৳২,৫০০ এবং সুতি পাঞ্জাবি ৳১,২৫০। অর্ডার করতে নাম, ফোন ও ঠিকানা দিন।"
      : "Jamdani Saree is ৳2,500 and Cotton Panjabi is ৳1,250. To order, share your name, phone and address.";
  }
  if (/ডেলিভারি|delivery/.test(s)) {
    return lang === "bn"
      ? "ডেলিভারি চার্জ: ঢাকার ভিতরে ৳৬০, বাইরে ৳১২০। ক্যাশ অন ডেলিভারি আছে।"
      : "Delivery: ৳60 inside Dhaka, ৳120 outside. Cash on delivery available.";
  }
  return lang === "bn"
    ? "আসসালামু আলাইকুম! আমি সাহায্য করতে পারি — দাম বা ডেলিভারি সম্পর্কে জিজ্ঞেস করুন।"
    : "Hello! I can help — ask me about prices or delivery.";
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("bn");
  const [msgs, setMsgs] = useState<{ from: string; text: string }[]>([
    { from: "bot", text: lang === "bn" ? "আসসালামু আলাইকুম! কী জানতে চান?" : "Hello! What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const S = STR[lang];

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMsgs((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "bot", text: fakeBotReply(q, lang) }]);
    }, 600);
  };

  const chips = lang === "bn"
    ? ["শাড়ির দাম কত?", "ডেলিভারি চার্জ কত?", "অর্ডার করবো কীভাবে?"]
    : ["Saree price?", "Delivery charge?", "How to order?"];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
        <strong style={{ fontSize: 20 }}>🤖 AI Chatbot</strong>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", background: "#fff", cursor: "pointer" }}>
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
          <a href="/login" style={{ border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 8, textDecoration: "none", color: "#111827" }}>{lang === "bn" ? "লগইন" : "Login"}</a>
          <a href="/signup" style={{ background: "#16a34a", color: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>{S.cta1}</a>
        </div>
      </header>

      <section style={{ textAlign: "center", padding: "64px 24px", background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)" }}>
        <div style={{ display: "inline-block", background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: 999, fontSize: 14, marginBottom: 16 }}>{S.badge}</div>
        <h1 style={{ fontSize: 40, margin: "0 0 16px" }}>{S.title}</h1>
        <p style={{ fontSize: 18, color: "#4b5563", maxWidth: 640, margin: "0 auto 24px" }}>{S.sub}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <a href="/signup" style={{ background: "#16a34a", color: "#fff", padding: "12px 24px", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}>{S.cta1}</a>
          <a href="#demo" style={{ border: "1px solid #d1d5db", padding: "12px 24px", borderRadius: 10, textDecoration: "none", color: "#111827" }}>{S.liveDemo}</a>
        </div>
      </section>

      <section id="demo" style={{ maxWidth: 560, margin: "48px auto", padding: "0 24px" }}>
        <h2 style={{ textAlign: "center" }}>{S.demoTitle}</h2>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ height: 300, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, background: "#f9fafb" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                background: m.from === "user" ? "#16a34a" : "#fff",
                color: m.from === "user" ? "#fff" : "#111827",
                padding: "8px 12px", borderRadius: 12, maxWidth: "80%",
                border: m.from === "bot" ? "1px solid #e5e7eb" : "none",
              }}>{m.text}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, padding: 8, flexWrap: "wrap", borderTop: "1px solid #e5e7eb" }}>
            {chips.map((c) => (
              <button key={c} onClick={() => { setInput(c); }}
                style={{ fontSize: 12, border: "1px solid #d1d5db", borderRadius: 999, padding: "4px 10px", background: "#fff", cursor: "pointer" }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", borderTop: "1px solid #e5e7eb" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={S.demoPh}
              style={{ flex: 1, border: "none", padding: 12, outline: "none" }} />
            <button onClick={send} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "0 20px", cursor: "pointer" }}>{S.demoSend}</button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: "48px auto", padding: "0 24px" }}>
        <h2 style={{ textAlign: "center" }}>{S.features}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {[[S.f1t, S.f1d], [S.f2t, S.f2d], [S.f3t, S.f3d], [S.f4t, S.f4d], [S.f5t, S.f5d], [S.f6t, S.f6d]].map(([t_, d]) => (
            <div key={t_} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: "0 0 8px" }}>{t_}</h3>
              <p style={{ color: "#4b5563", margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: "48px auto", padding: "0 24px" }}>
        <h2 style={{ textAlign: "center" }}>{S.priceTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {[[S.p1, S.p1p, false], [S.p2, S.p2p, true], [S.p3, S.p3p, false]].map(([n, p, hot]) => (
            <div key={n as string} style={{ border: hot ? "2px solid #16a34a" : "1px solid #e5e7eb", borderRadius: 12, padding: 24, textAlign: "center" }}>
              <h3>{n}</h3>
              <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0" }}>{p}</div>
              <a href="/signup" style={{ display: "inline-block", background: "#16a34a", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>{S.cta1}</a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 700, margin: "48px auto", padding: "0 24px" }}>
        <h2 style={{ textAlign: "center" }}>{S.faqTitle}</h2>
        {[[S.q1, S.a1], [S.q2, S.a2], [S.q3, S.a3]].map(([q, a]) => (
          <details key={q as string} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{q}</summary>
            <p style={{ color: "#4b5563" }}>{a}</p>
          </details>
        ))}
      </section>

      <footer style={{ textAlign: "center", padding: 24, borderTop: "1px solid #e5e7eb", color: "#6b7280" }}>
        {S.footer} · <a href="/dashboard" style={{ color: "#16a34a" }}>{S.dashboard}</a>
      </footer>
    </div>
  );
}
