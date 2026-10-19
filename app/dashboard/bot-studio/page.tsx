"use client";

import { useState } from "react";

export default function BotStudioPage() {
  const [msgs, setMsgs] = useState<{ from: string; text: string }[]>([
    { from: "bot", text: "বট স্টুডিও টেস্ট — প্রশ্ন লিখুন!" },
  ]);
  const [input, setInput] = useState("");
  const [bizName, setBizName] = useState("ডেমো শপ");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setMsgs((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          context: { businessName: bizName, products: [], language: "bn" },
          history: msgs.filter((m) => m.from !== "bot" || !m.text.includes("টেস্ট")).map((m) => ({
            role: m.from === "bot" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });
      const data = await r.json();
      setMsgs((m) => [...m, { from: "bot", text: data.reply || "…" }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "এরর — API চেক করুন।" }]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>🤖 বট স্টুডিও</h1>
      <p style={{ color: "#6b7280" }}>
        এখানে বটের উত্তর টেস্ট করুন। আসল Facebook/WhatsApp মেসেজে একই ইঞ্জিন উত্তর দেবে।
        <br />TODO: <code>.env</code>-এ <code>ANTHROPIC_API_KEY</code> বসান — না বসালে ফলব্যাক উত্তর আসবে।
      </p>
      <div style={{ marginBottom: 12 }}>
        <label>ব্যবসার নাম: </label>
        <input value={bizName} onChange={(e) => setBizName(e.target.value)}
          style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }} />
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", maxWidth: 560, background: "#fff" }}>
        <div style={{ height: 320, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              background: m.from === "user" ? "#16a34a" : "#f3f4f6",
              color: m.from === "user" ? "#fff" : "#111827",
              padding: "8px 12px", borderRadius: 12, maxWidth: "80%",
            }}>{m.text}</div>
          ))}
          {loading && <div style={{ color: "#6b7280" }}>লিখছে…</div>}
        </div>
        <div style={{ display: "flex", borderTop: "1px solid #e5e7eb" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="প্রশ্ন লিখুন…"
            style={{ flex: 1, border: "none", padding: 12, outline: "none" }} />
          <button onClick={send} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "0 20px", cursor: "pointer" }}>পাঠান</button>
        </div>
      </div>
    </div>
  );
}
