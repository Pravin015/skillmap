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

## Platform features added after Phase 1

- **Availability calendar** (`/settings/availability`): trainers block booked, tentative or unavailable dates; awards block dates automatically and cancellations release them; profiles and the company bench show a 12-week strip; applying warns about clashes.
- **Course catalogue** (`/settings/courses`): published courses appear on the trainer profile and in search; "Request this course" opens `/requirements/new?course=<id>` prefilled and auto-invites the trainer on publish.
- **Participant feedback**: after an award, the company or trainer creates a link (`/feedback/<token>`, 30 days, anonymous, one response per device). Responses roll up into the trainer's public learner score.
- **Profile analytics**: daily profile views and search appearances (`TrainerStatDaily`) on the trainer dashboard.
- **Reports** (`/admin/reports`): members flag posts, requirements, comments or members; admins act, resolve or dismiss; reporters are notified.
- **Bench** (`/dashboard/bench`): every trainer a company has awarded or saved, with availability and one-click invites.
- **Global search** (`/search`) across trainers, courses, requirements, companies and posts. Mobile navigation menu.
- **Recommendations**: company members who awarded a trainer, or accepted connections, write a recommendation on the profile (one per author, editable). Trainers can hide any and can ask eligible contacts for one.
- **Work orders** (`/requirements/<id>/work-order`): after an award the company issues a versioned work order prefilled from the requirement and the accepted rate (dates, day rate, total, participants, venue, deliverables, provided items, payment and cancellation terms). The trainer accepts or requests changes with notes; the company revises and resends (version bumps). Full event history, print-to-PDF view, cancel and reopen.

- **Gallery** (`/settings/gallery`): training photos with caption, date and company tag, optional share to feed; Gallery tab on the profile.
- **Trainer page tabs**: Overview, Courses, Recommendations, Feedback (client ratings + anonymous participant comments), Posts, Gallery; badges; similar trainers.
- **Badge levels** (`src/lib/badges.ts`): trainers earn Identity verified (staff review of a privately stored ID), verified certs, Top rated, Learner favourite, completed-engagement count, Trainer Pro. Companies earn Domain verified, GST verified, Trusted hirer, engagement count, plan badges. Admin queue handles identity documents and GSTINs; private files are served only to staff via `/api/private/...`.
- **Categories** (`/categories`, `/categories/<slug>`): skills belong to categories with optional vendor; pages list trainers, courses and open requirements. Category strip on the home page.
- **Analytics** (`/dashboard/analytics`): trainers see views, search appearances, funnel rates, earnings from accepted work orders and ratings; companies see posting volume, days to shortlist and award, spend, top trainers and skills.
- **Purchase orders** (`/dashboard/purchase-orders`, `/purchase-orders/<id>`): a company issues a numbered PO to the trainer from an accepted work order (one line per batch, plus lab/travel lines), with SAC code, place of supply, training period, end-client reference, payment terms and T&Cs. Numbers run per financial year with a company prefix (`TECHSPHERE/26-27/0001`, Settings → Purchase orders). Issuing emails the PDF to the trainer; the trainer accepts (typed name recorded) or requests changes; revisions bump the version. Invoices are capped at the PO value and tracked against it; the PO closes automatically when fully paid. Webhooks `purchase_order.issued` / `purchase_order.accepted`; API `GET /api/v1/purchase-orders`.
- **Invoicing** (`/dashboard/invoices`, `/dashboard/invoices/new`, `/invoices/<id>`): trainers raise a GST tax invoice against an accepted work order or PO with line items (qty × unit × rate), automatic CGST/SGST vs IGST from both parties' state codes, SAC 999293, amount in words, bank details from the encrypted account on file, notes and declaration. Invoice numbers run per financial year with the trainer's prefix (Settings → Invoicing details) or can be typed. The PDF (`/api/documents/invoice/<id>`, react-pdf) is emailed to the company's finance/hiring contacts; companies record payment with a reference; overdue tracking; Zoho Books / Tally exports carry the PO number; API `GET /api/v1/invoices`.
- **Email** (`src/lib/email.ts`): Resend for application, work order, invoice, invitation, billing and verification notifications. Without `RESEND_API_KEY` emails are recorded in `EmailLog` instead of sent. Members can switch email off in Settings.

- **Data export** (Settings): CSV downloads at `/api/export/<kind>` for applications, work orders, invoices, feedback (trainers) or requirements, applicants, work orders, invoices (companies), plus a JSON bundle.
- **Trainer CV** (`/trainers/<slug>/cv`): print-ready one-pager built from verified data, with a copyable share link.
- **Bulk import** (`/requirements/import`): CSV template, validation preview with per-row errors, confirm to create up to 50 requirements; respects plan limits and triggers skill and saved-search alerts.
- **Saved searches** (`/dashboard/saved-searches`): save trainer or requirement filters; new matches notify in-app and by email (trainer alerts throttled to once a day per search).
- **Interviews**: companies propose up to three slots for an applicant with format, duration and link; trainers confirm one or decline with a note; confirmation emails both sides a calendar (.ics) invite, also downloadable at `/api/interviews/<id>/ics`.

- **Daily jobs** (`/api/cron/daily`, header `x-cron-secret`): certificate expiry reminders 30 days out, automatic expiry (badge drops when no verified cert remains), weekly overdue-invoice nudges, interview reminders 24 h ahead, completion nudges. Super admin can run them from Platform; history in `JobRun`.
- **Live messaging**: conversations and the header badges refresh automatically (polling every 3 s in a conversation, 20 s elsewhere); file attachments in chat.
- **Referrals** (`/dashboard/referrals`): every member has a code; `/signup?ref=CODE` links the new account; when the referred trainer's first certificate is verified or the referred company posts its first requirement, the referrer gets 30 days of Trainer Pro or Company Growth.
- **Installable app**: web manifest, service worker with offline page and cached assets, browser push via VAPID (`npx web-push generate-vapid-keys`, then set `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`). Install and push controls sit in the footer.
- **WhatsApp / SMS** (`src/lib/sms.ts`): Twilio WhatsApp sender with SMS fallback for shortlists, awards, work orders, invoices and invitations; opt-in with a phone number in Settings; logged when keys are absent.
- **Production hardening**: S3-compatible uploads when `S3_*` is set (R2, MinIO, AWS), in-memory rate limits on sign-up, sign-in and feedback, security headers, `output: standalone`, `Dockerfile`, `docker-compose.prod.yml` (app + Postgres + cron sidecar), `/api/health`.

- **LinkedIn import** (`/settings/import`): upload the PDF LinkedIn generates from a profile (or paste text); the parser (`src/lib/linkedin-parse.ts`) extracts headline, about, skills, languages, certifications and work history; the trainer ticks what to apply. Certifications arrive as pending; work history lives in `Experience` and shows on the Overview tab.
- **Stripe (USD)**: the pricing page has an INR/USD toggle. USD plans use Stripe Checkout (hosted); prices/products are created lazily and cached in Setting. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; register `https://<domain>/api/billing/stripe/webhook` for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`. Without keys the USD buttons use the simulator.

- **Support view (impersonation)**: super admins open any member's view from Admin → Users; the session carries the real actor, a red banner shows on every page, and start/stop are audit-logged.
- **Announcement banner**: super admin sets text, style, link and expiry on Platform; members dismiss per browser.
- **Time zones**: each member picks a time zone in Settings; interview slots are entered in the proposer's zone, stored as instants, and shown to each side in their own zone (reminders too).
- **Work-order e-signature**: the company types a name to send, the trainer types a name to accept; names, timestamps and a reference hash appear on the document and print view.
- **Multi-batch work orders**: a work order can be split into batches (label, dates, participants, city); days and participants total automatically and the batch table prints on the document.
- **Completion certificates**: after an award, the company or trainer pastes participant names (with optional emails) on the requirement page; each participant gets a unique code and a public, printable, verifiable page at `/certificates/<code>` (emailed when an address is given). Certificates can be revoked.
- **Learning paths** (`/dashboard/learning-paths`): companies plan a sequence of trainings for one audience (steps with days, participants, skills, outcome), post any step as a requirement (`/requirements/new?step=<id>` prefills and links it back) and watch progress roll up as engagements complete.
- **Trainer teams** (`/settings/teams`, public page `/teams/<slug>`): a lead creates a team and invites trainers by email; accepted members show on the team page and on each profile. Leads can apply "as team", the application and work order list the members, and the lead signs and invoices.
- **Escrow / managed payments**: after a work order is accepted the company funds the total with CorpGurus (Razorpay payment link when keys are set, simulated in development), releases it after delivery, and staff record the bank payout on `/admin/escrow`. Platform fee from Setting `escrow_fee_percent` (default 5%). Refunds for cancelled work orders. Webhook `payment_link.paid` and `/api/escrow/return` mark deposits funded.
- **Hindi interface** (`src/lib/i18n.ts`): footer language switch (cookie `cg_lang`) translates the navigation, footer, home page and sign-in page; untranslated strings fall back to English. Add keys to the `en` dictionary and translations to `hi`.
- **Legal pages** (`/legal/terms`, `/legal/privacy`, `/legal/refunds`) and `/contact`, linked from the footer and the sign-up form. Written for Indian law (DPDP Act 2023, IT Rules 2021) and the escrow/subscription model; review with a lawyer before launch.
- **Integrations** (all optional, each degrades gracefully without keys):
  - *Calendar sync* (Google Calendar, Outlook/Microsoft 365): connect from Settings → Availability (trainers) or Settings (companies). Busy days of 4h+ become unavailable dates; confirmed interviews and accepted work orders are added to connected calendars; tokens are encrypted at rest.
  - *Meeting links*: when a trainer confirms a video interview, a Zoom (Server-to-Server app), Google Meet or Teams link is created per the company's preference and shown on both sides, in the emails and the .ics invite.
  - *RazorpayX payouts*: trainers add bank details (encrypted); escrow releases create a payout automatically and the `payout.*` webhooks finalise it. Without RazorpayX, staff record payouts manually as before.
  - *GSTIN / PAN verification* (Sandbox API): companies verify their GSTIN from Settings and get the badge instantly; staff have a "Verify via API" button in the queue; trainers verify PAN for an identity badge. Without the provider, format and check-digit validation still run. DigiLocker is not integrated (requires partner onboarding).
- **Workspace notifications**: companies add a Slack or Teams incoming webhook in Settings; applications, work orders, invoices, requirement changes and team events post to the channel with a link back.
- **Accounting exports**: invoices download as a Zoho Books import CSV or Tally Prime XML vouchers from the Invoices page (`/api/export/invoices/zoho|tally`).
- **SSO**: Microsoft sign-in alongside Google and LinkedIn (`MS_CLIENT_ID`/`MS_CLIENT_SECRET`); a verified company can let colleagues from its email domain join automatically as viewers when they sign up with Google or Microsoft.
- **Zapier / Make**: REST-hook endpoints `POST/GET /api/v1/webhooks` and `GET/DELETE /api/v1/webhooks/:id` let automation tools subscribe with the API key; documented on the developers page.
- **Analytics and errors**: PostHog page views and server events (sign-up, requirement posted, application sent, award, escrow funded) with hashed ids when `NEXT_PUBLIC_POSTHOG_KEY` is set; server errors go to Sentry via `instrumentation.ts` when `SENTRY_DSN` is set.
- **Dashboards**: trainers get a pipeline strip (applied → paid), earnings with overdue and escrow figures, a peer day-rate benchmark and a "next best action" card. Companies get an approvals queue filtered by their role (new applications, interview proposals, change requests, invoices due, escrow to release), a hiring board by status, spend this quarter, time-to-fill, fill rate, bench health, upcoming batches, team activity and suggested trainers. Staff land on `/admin/overview`: sign-ups, marketplace and revenue KPIs (GMV, MRR, escrow fees), verification SLA, quality flags, feature flags and staff activity, with CSV exports of users, companies, requirements, invoices and subscriptions.
- **Feature flags** (`src/lib/features.ts`, Platform page): escrow, teams, learning paths, API, certificates and referrals can be switched off platform-wide.
- **Roles and multi-company membership**: company roles Owner, Admin, Hiring manager, Finance and Viewer with a permission matrix (`src/lib/permissions.ts`) enforced in every company action (posting, awarding, work orders, escrow, invoices, team, settings, API keys, billing) and shown in Settings → Team, where owners/admins change roles. A person can belong to several companies and a trainer can also sit on company teams; the account menu switches between trainer view and each company (`User.activeCompanyId`). Platform staff roles Super admin, Administrator, Moderator, Finance and Support gate each admin page and action (`requireStaff`); super admins assign staff roles on the Platform page; Support can use the support view.
- **Onboarding wizards** (`/onboarding/trainer`, `/onboarding/company`): five steps each, reached right after sign-up (password or Google/LinkedIn). Trainers: identity and photo, skills by domain plus up to three certifications with duplicate-ID checks, delivery modes and cities with a peer day-rate benchmark, work history and a signature course, then review with a completeness score and live matches. Companies: basics and logo, GSTIN and automatic domain verification when the work-email domain matches the website, hiring profile that seeds trainer alerts, team invites, and a first-requirement choice with suggested trainers. Every step can be skipped; the dashboard shows a resume banner until the wizard is finished. Progress is stored in `User.onboardingStep` / `onboardingCompletedAt`.
- **Onboarding checklists** on both dashboards: eight steps each for trainers and companies, computed live from the profile, each linking to where it is completed; collapses to a one-line banner when complete.
- **SEO** (see `SEO.md`): site-wide metadata with canonicals and social cards, JSON-LD (Organization, WebSite, FAQ, Person, JobPosting, Breadcrumb), `robots.txt`, dynamic `sitemap.xml`, generated Open Graph image, and programmatic landing pages `/hire/<skill>` and `/hire/<skill>/<city>` cross-linked from the home page, category pages and footer.
- **Public API v1 + webhooks** (`/settings/developers`): companies create API keys (`cg_live_…`, stored hashed, shown once) and call `GET/POST /api/v1/requirements`, `GET/PATCH /api/v1/requirements/:id`, `GET /api/v1/applications`, `GET /api/v1/work-orders` (cursor pagination, 600 req/min per key). Webhook endpoints receive signed JSON (`X-CorpGurus-Signature: sha256=HMAC(secret, "{timestamp}.{body}")`) for `application.created`, `application.status_changed`, `requirement.status_changed`, `work_order.sent`, `work_order.accepted`, `invoice.created`, `invoice.paid`; deliveries are logged with status and error, and a "Send test" button exists per endpoint.

## Phase 2 backlog

Redis-backed rate limiting for multi-instance deployments. Email delivery (Resend), S3-compatible uploads, Meilisearch, Stripe for USD billing.

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
