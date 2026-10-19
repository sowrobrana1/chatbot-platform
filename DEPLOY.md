# 🚀 DEPLOY Guide — AI Chatbot Platform

সম্পূর্ণ সেটআপ গাইড: Facebook App, WhatsApp API, AI Keys, এবং Deploy।

---

## ধাপ ১: AI API Key নিন

### Claude (Anthropic) — প্রাইমারি
1. যান: https://console.anthropic.com/
2. Sign up → API Keys → **Create Key**
3. `.env`-এ বসান:
   ```
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

### OpenAI — ফলব্যাক (ঐচ্ছিক)
1. যান: https://platform.openai.com/api-keys
2. Create new secret key
3. `.env`-এ বসান:
   ```
   OPENAI_API_KEY="sk-..."
   ```

---

## ধাপ ২: Facebook App তৈরি (Messenger বটের জন্য)

1. **App তৈরি করুন:**
   - যান: https://developers.facebook.com/apps/
   - **Create App** → **Business** টাইপ → নাম দিন (যেমন "My Shop Bot")

2. **Messenger Product যোগ করুন:**
   - Dashboard → **Add Product** → **Messenger** → Set up

3. **Page সংযুক্ত করুন:**
   - Messenger → Settings → **Add or Remove Pages** → আপনার Facebook Page সিলেক্ট করুন
   - **Generate Token** → **Page Access Token** কপি করুন
   - ড্যাশবোর্ড → Settings → Facebook অংশে বসান:
     - Page ID (Page Settings → Page ID)
     - Page Access Token
     - ✅ সংযুক্ত টিক দিন → সেভ

4. **Webhook সেট করুন:**
   - Messenger → Settings → **Webhooks** → **Add Callback URL**
   - Callback URL: `https://YOUR-DOMAIN/api/webhooks/facebook`
   - Verify Token: `.env`-এর `FB_VERIFY_TOKEN`-এর মান (নিজে একটা random string বসান)
   - **Verify and Save**
   - **Add Subscriptions** → Page → টিক দিন: `messages`, `messaging_postbacks`

5. **App Secret (ঐচ্ছিক কিন্তু রেকমেন্ডেড):**
   - App Settings → Basic → **App Secret** → Show → কপি
   - `.env`-এ: `FB_APP_SECRET="..."`

6. **App Live করুন:**
   - App Review → **Make app public** (না করলে শুধু admin/tester-রা মেসেজ পাবেন)

---

## ধাপ ৩: WhatsApp Cloud API সেটআপ

1. **একই Facebook App-এ WhatsApp যোগ করুন:**
   - Dashboard → **Add Product** → **WhatsApp** → Set up

2. **Test নম্বর বা নিজের নম্বর:**
   - WhatsApp → API Setup
   - **Phone Number ID** কপি করুন
   - **Temporary access token** — Generate (২৪ ঘণ্টা মেয়াদ) বা **System User** দিয়ে permanent token বানান:
     - Business Settings → System Users → Add → Assets-এ App যোগ → Generate Token (whatsapp_business_messaging)

3. **ড্যাশবোর্ডে বসান** (Settings → WhatsApp):
   - Phone Number ID
   - Access Token
   - ✅ সংযুক্ত → সেভ

4. **Webhook:**
   - WhatsApp → Configuration → **Edit** Callback URL:
   - URL: `https://YOUR-DOMAIN/api/webhooks/whatsapp`
   - Verify Token: `.env`-এর `WA_VERIFY_TOKEN`
   - **Verify and save** → **Subscribe** → `messages` ফিল্ড

---

## ধাপ ৪: Database

ফ্রি PostgreSQL অপশন:

### Supabase (রেকমেন্ডেড)
1. https://supabase.com/ → New Project
2. Project Settings → Database → **Connection string** কপি
3. `.env`: `DATABASE_URL="postgresql://..."`

### Neon
1. https://neon.tech/ → New Project → Connection string কপি

তারপর:
```bash
npx prisma db push
```

---

## ধাপ ৫: Deploy

### Option A: Vercel (সহজতম)
```bash
npm i -g vercel
vercel
```
- Vercel Dashboard → Project → **Environment Variables**-এ সব `.env` মান বসান
- **Storage** → Postgres যোগ করলে `DATABASE_URL` auto-set হয়
- Deploy → `prisma migrate deploy` build-এ auto-run হয় (vercel.json-এ সেট আছে)

### Option B: Railway
1. https://railway.app/ → New Project → **Deploy from GitHub**
2. **Add PostgreSQL** plugin → `DATABASE_URL` auto-set
3. Variables-এ বাকি env বসান
4. Deploy

### Option C: VPS (Docker)
```bash
# সার্ভারে
git clone <repo>
cd chatbot-platform-deploy
cp .env.example .env
# .env এডিট করুন
docker build -t chatbot .
docker run -d -p 3000:3000 --env-file .env chatbot
```
- Nginx reverse proxy + SSL (Certbot) সেট করুন
- Webhook URL হবে `https://your-domain.com/api/webhooks/...`

---

## ধাপ ৬: টেস্ট করুন

1. **ল্যান্ডিং ডেমো:** `https://YOUR-DOMAIN/` → চ্যাট ডেমোতে প্রশ্ন করুন
2. **বট স্টুডিও:** `/dashboard/bot-studio` → AI উত্তর টেস্ট
3. **Messenger:** আপনার Page-এ মেসেজ পাঠান → বট উত্তর দেবে
4. **WhatsApp:** সংযুক্ত নম্বরে মেসেজ পাঠান

---

## 🔧 সমস্যা সমাধান

| সমস্যা | সমাধান |
|--------|--------|
| Webhook verify fail | Verify Token হুবহু মিলছে কিনা দেখুন |
| বট উত্তর দিচ্ছে না | `ANTHROPIC_API_KEY` সেট কিনা দেখুন; fallback উত্তর আসলে key missing |
| FB-তে শুধু admin পাচ্ছে | App-কে **Live** করুন (App Review) |
| DB error | `npx prisma db push` চালান; `DATABASE_URL` চেক করুন |

---

## ✅ চেকলিস্ট

- [ ] AI API key বসানো
- [ ] Database connected + `prisma db push`
- [ ] Deploy সফল (Vercel/Railway/VPS)
- [ ] Facebook webhook verified + subscribed
- [ ] WhatsApp webhook verified + subscribed
- [ ] Page Access Token ড্যাশবোর্ডে সেভ
- [ ] Test মেসেজে বট উত্তর দিচ্ছে
- [ ] প্রোডাক্ট যোগ করা হয়েছে
