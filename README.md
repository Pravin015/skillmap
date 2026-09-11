# CorpGurus

Marketplace and professional network for freelance corporate trainers. Companies and training partners post requirements; trainers ask questions in public, apply with a rate, get shortlisted and awarded; both sides rate each other.

## Stack

Next.js 16 (App Router, TypeScript, server actions) · Tailwind CSS 4 · PostgreSQL 16 in Docker · Prisma 6 · session cookies signed with `jose` · `bcryptjs` passwords · `lucide-react` icons.

## Run locally

```bash
pnpm install          # also runs prisma generate
pnpm db:up            # starts Postgres on localhost:5433 (Docker Desktop must be running)
pnpm db:push          # applies prisma/schema.prisma
pnpm db:seed          # demo data: 8 trainers, 4 companies, 9 requirements, staff accounts
pnpm dev -p 3210
```

`pnpm db:reset` wipes and reseeds. Uploaded certificates, logos and avatars land in `public/uploads/` (git-ignored).

## Demo accounts

All passwords: `Password@123`

| Role | Email |
|---|---|
| Super admin | pravin@corpgurus.demo |
| Administrator | admin@corpgurus.demo |
| Trainer (verified) | ananya@corpgurus.demo, rohit@corpgurus.demo, sana@corpgurus.demo |
| Company owner (direct) | rahul@techsphere.demo, ishaan@novafintech.demo |
| Company recruiter | kavya@techsphere.demo, sandeep@skillbridge.demo |
| Training partner owner | meera@skillbridge.demo, lakshmi@quantumedge.demo |

## Roles and what they can do

- **Trainer** – public profile, skills, certifications (verified by staff), day rate visible to companies only, apply / withdraw, comment, connect, message.
- **Company member** – company page; *Owner* also manages members. Post public or invite-only requirements, answer comments, shortlist / award / decline, save trainers, invite trainers.
- **Training partner** – a company type; exempt from the free open-requirement limit.
- **Administrator** – verification queue (certs, company domains), moderation (comments, requirements), suspend users. Every action is audit-logged.
- **Super admin** – everything above plus administrators, plan limits and settings, domains and skills taxonomy, full audit log.

## Map

```
src/app
  page.tsx                      landing
  login, signup                 auth
  trainers, trainers/[slug]     directory + public profile
  companies, companies/[slug]   directory + company page
  requirements                  list · [id] detail with comments & apply · new
  dashboard                     role-aware home · applications · requirements/[id]/applicants · notifications
  messages, messages/[id]       inbox and conversation
  network                       connections
  settings                      trainer profile / company page / team / password
  admin                         queue · users · requirements · platform (super admin)
src/lib
  auth.ts                       session, requireUser / requireRole
  actions/*.ts                  server actions (auth, profile, requirements, network, admin)
  messaging.ts                  who may message whom
  notify.ts                     notifications + audit log
prisma/schema.prisma            data model · prisma/seed.ts demo data
```

## Feed

`/feed` shows posts from followed people, followed companies and accepted connections ("Following"), or everything ("Everyone"). Posts take text plus an optional image (8 MB) or document (15 MB). Likes, comments, reposts with a note, and follow buttons on trainer and company pages. Staff remove posts from the admin console; removals are audit-logged and the author is notified. `pnpm db:seed:feed` adds demo posts to an existing database.

## Subscriptions (Razorpay)

Plans live in `src/lib/billing.ts`: Trainer Pro (₹999/mo), Company Growth (₹4,999/mo), Training Partner (₹14,999/mo), each with a yearly price at 10x monthly. Razorpay plan objects are created on first checkout and cached in the Setting table, so only the keys are needed:

```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx   # set when creating the webhook in the dashboard
```

Webhook URL: `https://<your-domain>/api/billing/webhook` with events `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `subscription.expired`, `payment.captured`. For local testing expose port 3210 with a tunnel (for example `ngrok http 3210`) and use that URL.

Flow: `/pricing` → `startCheckout` creates the Razorpay subscription → Checkout.js modal → success handler posts the payment id and signature to `confirmCheckout`, which verifies `HMAC_SHA256(payment_id|subscription_id)` → the webhook moves the subscription to `ACTIVE` and records each charge → `/settings/billing` shows status, history and cancel (at cycle end).

Without keys in development the pricing page runs a **simulator** that activates plans locally so limits and badges can be tested. Plan limits are enforced in `entitlementsFor()`: applications per month, open requirements, team size, direct messaging and featured search placement.

## Phase 2 backlog

Recommendations, LinkedIn profile import, email delivery (Resend), S3-compatible uploads, Meilisearch, Stripe for USD billing.

## Google and LinkedIn sign-in

Both use OpenID Connect and are implemented in `src/lib/oauth.ts` plus the route handlers under `src/app/api/auth/[provider]/`. The buttons on the sign-in and sign-up pages activate automatically once keys are present in `.env`; until then they render disabled.

**Google** - [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) > Create credentials > OAuth client ID > Web application. Add the authorised redirect URI, then copy the client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

**LinkedIn** - [linkedin.com/developers](https://www.linkedin.com/developers/apps) > Create app (needs a LinkedIn Page) > Products > add **Sign In with LinkedIn using OpenID Connect** > Auth tab: add the redirect URL, copy the client ID and secret into `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.

Redirect URIs (replace the origin with your domain in production; it must match `NEXT_PUBLIC_APP_URL`):

```
http://localhost:3210/api/auth/google/callback
http://localhost:3210/api/auth/linkedin/callback
```

Flow: `/api/auth/<provider>/start` sets a state cookie and redirects to the provider. `/api/auth/<provider>/callback` exchanges the code, reads the userinfo endpoint, then (1) signs in a previously linked account, (2) links to an existing account with the same verified email, or (3) sends a new member to `/signup/complete` to choose trainer or company. Members without a password can set one from Settings; unlinking the last provider is blocked until a password exists.
