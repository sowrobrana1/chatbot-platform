"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "লগইন ব্যর্থ হয়েছে।");
        return;
      }
      const next = params.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  const field = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 16,
  } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", fontFamily: "system-ui,sans-serif", padding: 16 }}>
      <form onSubmit={submit} style={{ background: "#fff", padding: 32, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", fontSize: 28, marginBottom: 8 }}>🤖</div>
        <h1 style={{ textAlign: "center", margin: "0 0 8px" }}>লগইন</h1>
        <p style={{ textAlign: "center", color: "#6b7280", margin: "0 0 24px" }}>আপনার ড্যাশবোর্ডে প্রবেশ করুন</p>
        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>
        )}
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>ইমেইল</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ ...field, marginBottom: 14 }} placeholder="you@example.com" />
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>পাসওয়ার্ড</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ ...field, marginBottom: 20 }} placeholder="••••••" />
        <button type="submit" disabled={busy} style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
          {busy ? "অপেক্ষা করুন…" : "লগইন করুন"}
        </button>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 14 }}>
          অ্যাকাউন্ট নেই? <Link href="/signup" style={{ color: "#16a34a", fontWeight: 600 }}>সাইন আপ করুন</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 8 }}>
          <Link href="/" style={{ color: "#6b7280", fontSize: 13 }}>← হোমে ফিরুন</Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>লোড হচ্ছে…</div>}>
      <LoginForm />
    </Suspense>
  );
}
