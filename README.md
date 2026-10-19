# 🤖 AI Chatbot Platform

বাংলাদেশের ব্যবসার জন্য AI চ্যাটবট প্ল্যাটফর্ম — Facebook Messenger ও WhatsApp-এ বাংলা বট।

Bangladesh AI chatbot platform for Facebook & WhatsApp — like Insaf AI.

## ✨ ফিচার / Features

- 🏠 বাংলা ল্যান্ডিং পেজ (লাইভ বট ডেমোসহ)
- 📊 ড্যাশবোর্ড — বিক্রি, অর্ডার, মেসেজ
- 🛍️ প্রোডাক্ট ক্যাটালগ (CRUD)
- 📦 অর্ডার ম্যানেজমেন্ট
- 🤖 বট স্টুডিও — AI উত্তর টেস্ট
- 📈 অ্যানালিটিক্স
- ⚙️ সেটিংস — Facebook/WhatsApp/AI কনফিগ
- 🌐 বাংলা/English টগল

## 🚀 দ্রুত শুরু / Quick Start

```bash
# 1. Install
npm install

# 2. Env setup
cp .env.example .env
# .env-এ DATABASE_URL বসান

# 3. Database
npx prisma db push

# 4. Run
npm run dev
# → http://localhost:3000
```

## 🔑 API Keys (TODO)

| Key | কোথায় পাবেন |
|-----|--------------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `DATABASE_URL` | PostgreSQL (Supabase/Neon/Railway) |

বিস্তারিত সেটআপ: **DEPLOY.md** দেখুন।

## 📁 স্ট্রাকচার

```
app/
  page.tsx              → ল্যান্ডিং পেজ
  dashboard/            → ড্যাশবোর্ড
  api/
    bot/                → বট রিপ্লাই API
    products/           → প্রোডাক্ট CRUD
    orders/             → অর্ডার CRUD
    settings/           → সেটিংস
    stats/              → ড্যাশবোর্ড stats
    webhooks/
      facebook/         → Messenger webhook
      whatsapp/         → WhatsApp webhook
lib/
  ai.ts                 → Claude/OpenAI ইন্টিগ্রেশন
  facebook.ts           → Messenger Send API
  whatsapp.ts           → WhatsApp Cloud API
  db.ts                 → Prisma client
  i18n.ts               → বাংলা/English
prisma/schema.prisma    → ডাটাবেস স্কিমা
```

## ⚠️ নোট

- প্রথম রানে ডেমো ইউজার auto-create হয় (`demo-user`)। Production-এ NextAuth যোগ করুন।
- Webhook-গুলো HTTPS ডোমেইন চায় — Vercel/Railway-এ deploy করুন।

## 📄 লাইসেন্স

MIT
