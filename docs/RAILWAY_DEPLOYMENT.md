# Railway Deployment Checklist — AstraaHire

> **Order matters.** Follow the sequence below. Some env vars depend on
> the URL you'll get from Railway (NEXTAUTH_URL, webhook URLs).

---

## 0. Before you start

You need accounts at:

| Service | What for | Cost at launch |
|---|---|---|
| [Railway](https://railway.app) | Hosting + Postgres | Free tier OK; ~$5/mo when active |
| [Resend](https://resend.com) | OTP / password emails | Free 3,000/mo |
| [Razorpay](https://razorpay.com) | Premium subscriptions | KYC required, ~2% + ₹3/txn |
| [Anthropic](https://console.anthropic.com) | Claude AI features | Pay-as-you-go, ~$0.50–5/day expected |
| [Google Cloud](https://console.cloud.google.com) | File storage (GCS) | Free 5GB tier |
| [Adzuna Developer](https://developer.adzuna.com) | Job scraper | Free 1000 calls/day |
| Domain registrar | astraahire.com | ~₹800/year |

---

## 1. Create the Railway project

1. New Project → "Deploy from GitHub" → pick `Pravin015/skillmap`
2. Add a **Postgres** plugin from the Railway marketplace
3. Copy `DATABASE_URL` from the Postgres plugin's "Connect" tab → Railway will autoinject this if you reference it

---

## 2. Set env vars

Open the **Variables** tab on your service. Paste each block from
`.env.production.example`. **Do not commit real values to git.**

### Quick generation commands

```bash
# NEXTAUTH_SECRET + CRON_SECRET (run locally)
openssl rand -hex 32

# Both should be different — never re-use
```

### Each service's setup

#### Anthropic
- console.anthropic.com → Settings → API Keys → Create
- Enable workspace billing first (otherwise calls 401)
- Set spend limit ($50/mo recommended for early launch)

#### Razorpay
- Dashboard → Settings → API Keys → Generate Test Keys (use these first)
- Switch to Live keys after KYC + 1-day approval
- Settings → Webhooks → Create:
  - URL: `https://your-railway-url.up.railway.app/api/payments/webhook`
  - Active events: `payment.captured`, `payment.failed`, `payment.authorized`, `refund.processed`
  - Copy the webhook signing secret → `RAZORPAY_WEBHOOK_SECRET`

#### Resend
- Add domain `astraahire.com` (or wherever you point DNS)
- Add the DNS records (TXT + MX) Resend gives you
- Wait for "Verified" status (usually 5–30 min)
- Generate API key with "Sending access" scope
- Set `RESEND_FROM_EMAIL` to a verified sender on that domain

#### Google Cloud Storage
1. Create new project: `astraahire-prod`
2. Enable Cloud Storage API
3. Create bucket `astraahire-prod` (region: `asia-south1`, uniform access, public read)
4. IAM → Service accounts → Create:
   - Name: `astraahire-railway`
   - Role: `Storage Object Admin` (scoped to bucket)
5. Keys tab → Add Key → JSON → download
6. Convert to single-line string (paste into a JSON minifier or run `cat key.json | tr -d '\n'`)
7. Paste into `GCS_KEY_JSON` env var
8. Set `GCS_BUCKET=astraahire-prod`

#### Adzuna
- developer.adzuna.com/signup → fill 4 fields → instant approval
- Copy `app_id` and `app_key`
- Free tier: 1000 calls/day. Each scrape run = ~6 calls. We're nowhere near the limit.

---

## 3. First deploy

1. After all env vars are set, hit **Deploy** in Railway
2. Watch the logs — first deploy compiles ~6–8 min
3. Note the auto-assigned URL (e.g. `astraahire-production-abcd.up.railway.app`)
4. **Set `NEXTAUTH_URL` to this URL** (no trailing slash) and redeploy
5. Open the URL — you should see the homepage with cream background

---

## 4. Post-deploy DB setup

```bash
# Locally, with DATABASE_URL pointing at your Railway Postgres
DATABASE_URL=<railway-db-url> npx prisma db push
DATABASE_URL=<railway-db-url> npx prisma db seed       # if you have seed data
DATABASE_URL=<railway-db-url> npx tsx scripts/job-scraper/seed-sources.ts
```

Or do it inside Railway's web shell:

```
railway run npx prisma db push
railway run npm run scrape:seed
```

---

## 5. Configure cron (job scraper)

Railway → New → Cron Job
- **Schedule:** `0 */6 * * *`  (every 6 hours)
- **Command:**

```bash
curl -fsS -X POST https://your-domain/api/cron/scrape-jobs \
  -H "x-cron-secret: $CRON_SECRET"
```

Railway auto-passes env vars into cron jobs, so `$CRON_SECRET` resolves.

---

## 6. Custom domain (optional but recommended)

1. Buy `astraahire.com` (or your preferred domain)
2. Railway → Settings → Domains → Add
3. Point your DNS:
   - `A` record → Railway IP shown in dashboard
   - or `CNAME` → `<service>.up.railway.app`
4. Wait 5–60 min for SSL cert
5. **Update `NEXTAUTH_URL` to `https://astraahire.com`**
6. Update Razorpay webhook URL to use the custom domain
7. Redeploy

---

## 7. Smoke test

Open these URLs and verify each works:

| URL | Expected |
|---|---|
| `/` | Homepage with cream + violet theme |
| `/auth/signup` | Sign up form, sends OTP, account created |
| `/auth/login` | Returning login works |
| `/dashboard` | Logged-in student dashboard |
| `/jobs` | Job listing grid |
| `/jobs/external` | Empty initially. After first cron run, shows aggregated jobs |
| `/admin/scrape-runs` | (admin login) Trigger one source manually, watch run succeed |
| `/api/cron/scrape-jobs` POST with secret | Returns `{ok: true, results: [...]}` |
| `/pricing` | Click "Go premium" → Razorpay checkout opens (test mode) |
| `/forms/contact` | Submit a test form, lands in admin "Forms" tab |

---

## 8. Things commonly missed

- **NEXTAUTH_URL with trailing slash** — breaks OAuth. No `/` at end.
- **GCS_KEY_JSON with literal newlines** — must be one line. Run `tr -d '\n'`.
- **Razorpay webhook URL using Railway-generated domain after switching to custom** — update both.
- **Resend from-email on unverified domain** — emails silently dropped.
- **Anthropic billing not enabled** — every Claude call returns 401, AI features dead.
- **CRON_SECRET = NEXTAUTH_SECRET** — fine to do, but don't share between systems for safety.

---

## 9. Cost ceiling estimates (monthly, beta scale ~500 users)

| Service | Cost |
|---|---|
| Railway (web + Postgres) | ~$8 |
| Anthropic | ~$30 (heavy use), ~$5 (light) |
| Resend | $0 (within free tier) |
| Razorpay | 2% × revenue (no fixed cost) |
| GCS | $0 (within free tier) |
| Adzuna | $0 (free tier) |
| Domain | ~₹70/mo amortised |
| **Total** | **~$15–40 / month** |

Past 5,000 active users you'll need to scale Postgres ($20/mo) and bump Resend ($20/mo). Call it `~$80/mo` then.
