# Ashpranix ↔ AstraaHire job-feed integration

**Status**: ✅ **Shipped on both sides.** Awaiting credential handoff to flip the feed live.

**Owning chats**: Ashpranix Institute (`C:\Users\Administrator\Desktop\ashpanix-institute`) + AstraaHire (`C:\Users\Administrator\Desktop\crmlms`).

**Goal**: expose AstraaHire's job catalog to partner institutes so they can curate which openings to display to their students. Students click "Apply" → land on AstraaHire's own listing page where they sign up / apply natively. AstraaHire owns the application surface end-to-end; Ashpranix is a read-only consumer plus a per-tenant curation layer.

**Data direction**: AstraaHire → Ashpranix (one-way). Plus webhook callbacks for lifecycle events.

**Last to-do**: AstraaHire admin issues the prod + staging API keys (one-time reveal) and shares them via the Ashpranix chat. Ashpranix admin drops them into env vars (§"What Ashpranix needs from AstraaHire" below) + tells AstraaHire to set the webhook receiver URL (§"What AstraaHire needs from Ashpranix"). After that the feed is live.

---

## What's live on AstraaHire (TL;DR for the Ashpranix chat)

Production-grade, versioned, authed, rate-limited. All routes return the same error envelope and rate-limit headers documented at the bottom.

| Surface | Path | Purpose |
|---|---|---|
| Health | `GET /api/v1/partner/health` | Auth sanity check |
| Jobs list | `GET /api/v1/partner/jobs` | Paginated, filterable catalog (ExternalJob feed) |
| Single job | `GET /api/v1/partner/jobs/:id` | Same row shape as list |
| Sources | `GET /api/v1/partner/sources` | Upstream scrapers list (for source filter UI) |
| Job detail page | `/jobs/external/:id` | What `externalUrl` and `applyUrl` point to |
| Referral tracking | `POST /api/b2b/track-referral` | Auto-fired by the detail page on mount when `?ref=` present |

**Admin surface**: `/admin` → Integrations → **B2B Partners**. Create partner → API key + webhook secret are shown **exactly once**, then never again. Rotate / revoke / inspect logs from the same tab.

**Cron**:
- `POST /api/cron/retry-webhooks` — every 1 min, retries failed webhook deliveries with backoff (1m / 5m / 30m / 2h / 12h)
- `POST /api/cron/expire-jobs` — daily, flips stale ExternalJobs to `isActive=false` and fires `job.expired` to subscribers
  Both auth with `x-cron-secret: $CRON_SECRET`.

---

## What's live on Ashpranix (TL;DR for the AstraaHire chat)

Consumer-side build is complete and pushed (commit `50f2516`). All routes return JSON-bodied errors and never expose AstraaHire's API key to the browser — every upstream call is server-to-server.

| Surface | Path | Purpose |
|---|---|---|
| Admin catalog | `GET /api/admin/jobs/catalog` | Live AstraaHire fetch + per-tenant curation join |
| Admin curation | `PUT /api/admin/jobs/curation` | Publish / dismiss / tag courses (single row upsert) |
| Student feed | `GET /api/student/jobs` | Filtered to student's enrolled courses, applyUrl decorated with `?ref=ashpranix&institute=<slug>&student=<sha256>` |
| Webhook receiver | `POST /api/webhooks/astraahire/jobs` | HMAC-verified, 5-min skew window, dedupes on `X-AstraaHire-Delivery` via the shared `ProcessedWebhookEvent` table |
| Admin page | `/dashboard/admin/jobs` | Table with publish modal (course-checkbox picker), state filter chips, "Expired" pills |
| Student page | `/dashboard/student/jobs` | Card grid with Apply (deep-links to AstraaHire) + Details buttons |

**Schema**: one new model `JobOpeningCuration` keyed `(tenantId, externalJobId)` — `published`, `dismissed`, `isActiveUpstream`, `relevantCourseIds[]`, audit fields. No data ever cached or snapshotted — catalog is read live on every request, joined with curation rows at the resolver layer.

**Sidebar**: admin gets "Job Openings" under the Placement section; student gets "Job Openings" under Learning.

**Webhook dispatch table** (handled in the receiver):
- `job.expired` / `job.closed` / `job.deleted` → flips `isActiveUpstream=false` on every tenant's curation row for that `externalJobId` (Postgres `updateMany`). Students stop seeing it on next page load; admins keep seeing it with an "Expired" pill so they can unpublish manually.
- `job.updated` → no-op acknowledgement. Live-fetch on every render means the freshest data is already served; nothing to invalidate.

**Failure modes are non-fatal**: missing env vars → admin page shows "AstraaHire feed isn't configured" empty state; student page shows "Job feed unavailable"; webhook receiver returns 503. The integration is safe to deploy before credentials are issued.

---

## Decisions (locked, don't re-debate)

1. **Webhooks**: yes — `job.expired`, `job.closed`, `job.updated`, `job.deleted`. See §6 for the contract. Currently only `job.expired` has an automatic firing path (the daily expiry sweep). `job.updated` / `.deleted` / `.closed` are wired in the dispatcher and will fire when those admin actions are added — call sites just need to invoke `fireJobEvent({...})` from `lib/b2b-webhooks.ts`.
2. **Filtering on Ashpranix side**: students see jobs matched to their enrolled **course**, not their `domain`. AstraaHire just exposes the catalog; the course-mapping happens on Ashpranix side via the curation row.
3. **Expired jobs**: AstraaHire continues returning them when the caller passes `includeInactive=true` (so the institute admin can decide whether to unpublish manually). Students never see them — Ashpranix's curation resolver drops `isActive=false` rows from the student view.
4. **`applyUrl` vs `externalUrl`**: **both point to AstraaHire's own detail page.** AstraaHire owns the conversion. `applyUrl` is the same page with `?action=apply` so the detail page auto-fires the redirect to the source's posting on mount. (Answer to spec §Open Q1.)
5. **Webhook idempotency**: `X-AstraaHire-Delivery` is unique per **delivery row** and reused across retries of the same logical event. A retry of attempt 2 sends the same delivery id as attempt 1, so the receiver can dedupe. (Answer to §Open Q2.)
6. **CORS rejection**: 403 + body, not silent. (Answer to §Open Q3.)
7. **`/api/external-jobs`** left untouched. Public, no breaking changes. The B2B surface is fully separate. (Answer to §Open Q4.)

---

## What Ashpranix needs from AstraaHire (5 items, one handoff)

Send these via the Ashpranix chat:

1. **Production base URL** — `https://<your-railway-prod-domain>` (whatever AstraaHire's prod `NEXTAUTH_URL` is)
2. **Staging base URL** — Railway preview env URL or dev tunnel
3. **Production API key** — Admin → B2B Partners → "+ Create Partner" with `env=live`. Name it `Ashpranix Institute`. Copy the `ah_live_…` value shown ONCE.
4. **Staging API key** — same flow with `env=test`. Copy the `ah_test_…` value shown ONCE.
5. **Webhook secret** — the create flow generates one automatically and reveals it in the same modal. Copy it.

When creating the partner row, fill these fields:
- `allowedOrigins`: Ashpranix's prod + staging domains, comma-separated (defence-in-depth; Ashpranix calls server-to-server so Origin is usually absent anyway)
- `webhookUrl`: see next section — Ashpranix will tell you the exact URL
- `webhookEvents`: all four — `job.expired`, `job.closed`, `job.updated`, `job.deleted`
- `rateLimit`: leave at default 120/min unless you have a reason to raise

Already verified, no action needed:
- ✅ `ExternalJob.id` stability — `scripts/job-scraper/lib/run.ts` lines 109–119 do "match by `sourceJobId` or `dedupeHash`, update existing row id, insert only if no match". IDs are stable across re-scrapes.

## What AstraaHire needs from Ashpranix (1 item)

Set the partner row's `webhookUrl` to:

```
Production:  https://<ashpranix-prod-domain>/api/webhooks/astraahire/jobs
Staging:     https://<ashpranix-staging-domain>/api/webhooks/astraahire/jobs
```

The receiver is live as of Ashpranix commit `50f2516`. It:
- Verifies `X-AstraaHire-Signature: t=<unix>,v1=<hex>` using `HMAC_SHA256(ASTRAAHIRE_WEBHOOK_SECRET, "{t}.{rawBody}")`, constant-time compared
- Rejects requests with `|now - t| > 5 min` (401 — replay protection)
- Dedupes on `X-AstraaHire-Delivery` via the shared `ProcessedWebhookEvent` table (source tag `astraahire`), so retries of the same logical event short-circuit with `200 { ok: true, deduped: true }`
- Returns 401 on bad signature (so AstraaHire stops retrying — means OUR secret is wrong, not transient)
- Returns 500 on transient errors so the retry policy (1m / 5m / 30m / 2h / 12h) kicks in
- Subscribed to all four events; `job.updated` is a documented no-op on our side (we live-fetch the catalog on every render so cache invalidation isn't needed)

## Env vars Ashpranix will set (FYI)

```
ASTRAAHIRE_API_BASE_URL=https://<their-railway-prod-url>
ASTRAAHIRE_API_KEY=ah_live_xxx              # ah_test_xxx in staging
ASTRAAHIRE_WEBHOOK_SECRET=<hex secret from partner row>
```

No other env vars needed on Ashpranix side. The student-hash that decorates `applyUrl` is derived per-(tenant, student) from a server-side SHA-256, no shared secret required for that.

---

## Build status

### 1. `B2BPartner` model + admin UI — **DONE**

Schema in `prisma/schema.prisma`. Three new models + one referral model:

- `B2BPartner` — `apiKeyHash` (bcrypt), `apiKeyPrefix` (16 chars, indexed), `apiKeyLast4`, `allowedOrigins[]`, `rateLimit` (default 120/min), `scope[]` (default `["jobs:read"]`), `isActive`, `webhookUrl`, `webhookSecret`, `webhookEvents[]`, `lastUsedAt`, `createdById`.
- `B2BApiCallLog` — per-call audit (`endpoint`, `method`, `status`, `latencyMs`, `ip`, `userAgent`, `errorDetail` truncated 200 chars). Indexed by `(partnerId, createdAt)`.
- `B2BWebhookDelivery` — persistent delivery log (`deliveryId` uuid, `payload`, `attemptCount`, `status` PENDING/DELIVERED/FAILED, `lastStatus`, `lastError` truncated 500, `nextAttemptAt`). Powers the retry cron.
- `JobReferral` — `ref`, `institute`, `studentHash` (never raw student id), `externalJobId`, `landedAt`, `appliedAt`, `applicationId`, `ip`. For attribution.

Admin UI lives at `/admin` → sidebar **Integrations → B2B Partners**:
- Table of partners with `name`, `prefix…last4`, status pill, `lastUsedAt`, request counts, scope, rate limit.
- "Create Partner" form: name, owner email, allowedOrigins (comma-separated), rate limit, webhook URL, env (`live`/`test`).
- One-time green reveal box: plaintext API key + webhook secret, with copy buttons. After dismissing, never shown again.
- Rotate, Revoke (sets `isActive=false`), Re-enable, Logs (inline expand showing last 50 API calls + last 30 webhook deliveries).

Key format: `ah_live_<48 chars base64url>` or `ah_test_<48 chars base64url>`. Total ~56 chars. Prefix used for cheap index lookup; bcrypt-compared against `apiKeyHash`.

### 2. B2B API surface — **DONE**

Endpoints below all live under `/api/v1/partner/*`. Separate from `/api/external-jobs` (which stays public for the internship portal).

#### `GET /api/v1/partner/health`
```json
{ "ok": true, "partnerName": "Ashpranix Institute", "scopes": ["jobs:read"], "version": "v1" }
```

#### `GET /api/v1/partner/jobs`

All query params optional. Same names as the original spec, all implemented:

| Param | Type | Notes |
|---|---|---|
| `vertical` | `INTERNSHIP` / `FULLTIME` / `ALL` | Default `ALL` |
| `q` | string | Free-text on `title` OR `company` OR `skills` (array contains) |
| `location` | string | Substring (case-insensitive) |
| `workMode` | string | Exact match |
| `domain` | string | Exact match |
| `source` | string | Source slug filter |
| `experienceLevel` | string | Substring (case-insensitive) |
| `minSalary` / `maxSalary` | int | LPA bounds |
| `postedAfter` / `since` | ISO timestamp | Lower bound on `postedAt`, accepts either name |
| `includeInactive` | `true` / `false` | Default `false` |
| `limit` | int | 1–200, default 50 |
| `offset` | int | Default 0 |

Invalid params return `400 { error: { code: "BAD_REQUEST", message } }`.

**Response envelope** (matches spec exactly):
```json
{
  "data": [
    {
      "id": "ext_abc123",
      "title": "Frontend Engineer Intern",
      "company": "Acme Corp",
      "companyLogoUrl": "https://...",
      "location": "Bengaluru, India",
      "workMode": "Hybrid",
      "jobType": "Full-time",
      "experienceLevel": "Entry",
      "salaryText": "₹6 — 10 LPA",
      "salaryMin": 600000,
      "salaryMax": 1000000,
      "domain": "Engineering",
      "description": "...",
      "skills": ["React", "TypeScript"],
      "vertical": "FULLTIME",
      "externalUrl": "https://astraahire.com/jobs/external/ext_abc123",
      "applyUrl":    "https://astraahire.com/jobs/external/ext_abc123?action=apply",
      "source": { "id": "src_xyz", "slug": "internshala", "name": "Internshala", "logoUrl": null, "vertical": "INTERNSHIP" },
      "postedAt":  "2026-05-12T10:30:00.000Z",
      "expiresAt": "2026-06-12T10:30:00.000Z",
      "isActive": true
    }
  ],
  "meta": { "total": 1234, "limit": 50, "offset": 0, "hasMore": true },
  "version": "v1"
}
```

Single source of truth for the row shape: `lib/b2b-job-shape.ts` → `shapeExternalJob()`. List, detail, and webhook payloads all use it so they can't drift.

**Tracking forwarding**: the detail page reads `?ref=&institute=&student=` from the URL and POSTs them to `/api/b2b/track-referral` on mount. Persisted in `JobReferral` with the externalJobId. Future conversion attribution (when a referred student applies) can update the same row.

#### `GET /api/v1/partner/jobs/:id`
Single job, same row shape. `404 { error: { code: "NOT_FOUND" } }` on miss.

#### `GET /api/v1/partner/sources`
```json
{
  "data": [
    { "id": "src_xyz", "slug": "internshala", "name": "Internshala", "logoUrl": null, "vertical": "INTERNSHIP" }
  ],
  "version": "v1"
}
```
Only returns `enabled=true` sources.

### 3. Authentication middleware — **DONE**

Implementation: `lib/b2b-auth.ts`.

Flow for every request to `/api/v1/partner/*`:

1. Read `Authorization: Bearer <key>`. Missing → `401 UNAUTHORIZED`.
2. Reject obviously-wrong format (no `ah_live_` / `ah_test_` prefix, or too short) before doing bcrypt work.
3. Extract first-16-char prefix. Query `B2BPartner` rows where `apiKeyPrefix` matches (indexed).
4. `bcrypt.compare(key, partner.apiKeyHash)` for each candidate. On hit:
   - `!partner.isActive` → `403 FORBIDDEN "API key has been revoked"`
   - `Origin` set AND not in `allowedOrigins` (and `allowedOrigins` non-empty) → `403 FORBIDDEN`
   - Required scope not in `partner.scope` → `403 FORBIDDEN`
   - Rate-limit exceeded → `429 RATE_LIMITED` with `Retry-After: 60`
5. Bump `lastUsedAt` async.
6. After handler completes, write `B2BApiCallLog` row async (status, latency, ip, userAgent, errorDetail truncated 200 chars).

**Error envelope** (used across all auth + handler failures):
```json
{ "error": { "code": "UNAUTHORIZED|FORBIDDEN|RATE_LIMITED|NOT_FOUND|BAD_REQUEST|INTERNAL", "message": "...", "retryAfter": 30 } }
```

### 4. Rate limiting — **DONE**

Per-partner, configurable via `B2BPartner.rateLimit` (default 120/min). Uses the existing `lib/rate-limit.ts` hybrid limiter (Upstash if `UPSTASH_REDIS_REST_URL` set, else in-memory). Key: `b2b:<partnerId>`.

Standard headers on every response:
```
X-RateLimit-Limit:     120
X-RateLimit-Remaining: 117
X-RateLimit-Reset:     1715600060
```

429 adds:
```
Retry-After: 60
```

### 5. CORS — **DONE**

- `OPTIONS` preflight handler on every route: echoes Origin back, allows the requested method + headers, 10-min `Max-Age`. Preflight doesn't send credentials so we can't check allowlist there — the actual call does enforce it.
- Real call: if `Origin` header is set, must be in `partner.allowedOrigins`. Mismatch → `403 FORBIDDEN` with body (not silent). Server-to-server (no Origin) is always allowed.
- On success: `Access-Control-Allow-Origin: <origin>`, `Vary: Origin`, `Access-Control-Allow-Credentials: true`.

### 6. Webhook out — **DONE** (dispatcher + retry; firing paths partial)

Implementation: `lib/b2b-webhooks.ts`.

**Events**:
- `job.expired` — automatic via `/api/cron/expire-jobs` (flips `isActive=false` when `expiresAt < now` OR `lastSeenAt > 30 days ago`).
- `job.closed`, `job.updated`, `job.deleted` — dispatcher is ready. Wire by calling `fireJobEvent({ event, data })` from the relevant admin action. Currently no AstraaHire admin endpoint mutates ExternalJobs by hand, so these don't fire automatically yet.

> ℹ️ **Heads-up re: `job.updated`** — Ashpranix's receiver currently no-ops this event because their consumer is live-fetch (no local cache to invalidate). When AstraaHire wires `fireJobEvent({ event: "job.updated", ... })` from a future admin edit endpoint, it's still worth firing — other future partners may cache and need it. Today's only subscriber just ack's.

**Delivery**:
```
POST <partner.webhookUrl>
Content-Type: application/json
X-AstraaHire-Signature: t=1715600000,v1=<hex hmac-sha256>
X-AstraaHire-Event: job.expired
X-AstraaHire-Delivery: <uuid>
User-Agent: AstraaHire-Webhook/v1
```

Body:
```json
{
  "event": "job.expired",
  "occurredAt": "2026-05-12T10:30:00.000Z",
  "data": {
    "id": "ext_abc123",
    "title": "...",
    "company": "...",
    "location": "...",
    "isActive": false,
    "expiresAt": "...",
    "lastSeenAt": "..."
  }
}
```

`v1` signature is `HMAC_SHA256(secret, "{timestamp}.{rawBody}")`. Stripe-style. Receiver should reject if `t` is more than 5 min off wall-clock.

**Retry schedule** (in minutes after the previous failed attempt):
```
attempt 1 (immediate) → +1m → +5m → +30m → +2h → +12h → FAILED
```

Persisted in `B2BWebhookDelivery` so retries survive restarts. `/api/cron/retry-webhooks` (run every minute) picks up rows with `status=PENDING` AND `nextAttemptAt <= now()` and retries them. Rows are stamped `DELIVERED` on a 2xx, `FAILED` after the 6th non-2xx, and stay `PENDING` with updated `nextAttemptAt` between.

Webhook timeout: 10s per attempt.

### 7. `ExternalJob.id` stability — **VERIFIED** ✅

Scraper code in `scripts/job-scraper/lib/run.ts`:

```ts
const existing = await prisma.externalJob.findFirst({
  where: { OR: [{ sourceId, sourceJobId: raw.sourceJobId }, { dedupeHash }] },
  select: { id: true },
});
if (existing) {
  await prisma.externalJob.update({ where: { id: existing.id }, data });
  return "updated";
}
await prisma.externalJob.create({ data: { ...data, firstSeenAt: new Date() } });
```

Same row id reused across re-scrapes. Ashpranix curation rows can safely foreign-key to `ExternalJob.id`.

### 8. Audit log — **DONE**

Every `/api/v1/partner/*` call writes a `B2BApiCallLog` row (async, never blocks the response). Admin UI surfaces them inline per partner ("Logs" button on each row). Filterable by partner — date range / status filtering can be added later if needed.

`errorDetail` is truncated to 200 chars. Request bodies are **never** logged (will matter when write endpoints are added).

---

## Defer pile (not blocking — call out if/when needed)

### 9. Keyset pagination
Offset works fine up to ~5k rows. Bump to `cursor=` when the catalog grows.

### 10. SSO handoff for the apply flow
Today: student clicks Apply on Ashpranix → AstraaHire detail page → redirect to source. If we want them to land already-authed inside AstraaHire to do an internal apply, build a one-shot sign-handoff endpoint. Defer until volume merits.

### 11. Application-status callback webhook
When a student successfully applies on AstraaHire, fire a webhook back so Ashpranix can show "Applied" on the card. Requires #10 first (need to identify the Ashpranix student inside AstraaHire). Defer.

---

## API contract summary

```
GET  /api/v1/partner/health              → { ok, partnerName, scopes, version }
GET  /api/v1/partner/jobs                → { data: ExternalJob[], meta: {total,limit,offset,hasMore}, version }
GET  /api/v1/partner/jobs/:id            → { data: ExternalJob, version } | 404
GET  /api/v1/partner/sources             → { data: Source[], version }

All errors:    { error: { code, message, retryAfter? } }
Auth:          Authorization: Bearer ah_(live|test)_xxxx
On every res:  X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
On 429:        Retry-After

Webhooks out:
POST <partner.webhookUrl>
  X-AstraaHire-Signature: t=<unix>,v1=<hex>
  X-AstraaHire-Event:     job.expired | job.closed | job.updated | job.deleted
  X-AstraaHire-Delivery:  <uuid>      (reused across retries of same event)
  User-Agent:             AstraaHire-Webhook/v1
  Body:                   { event, occurredAt, data }
```

---

## Smoke test commands

```bash
# Sanity check
curl https://astraahire.com/api/v1/partner/health \
  -H "Authorization: Bearer ah_live_xxx..."

# First 50 internships
curl 'https://astraahire.com/api/v1/partner/jobs?vertical=INTERNSHIP&limit=50' \
  -H "Authorization: Bearer ah_live_xxx..."

# Delta sync
curl 'https://astraahire.com/api/v1/partner/jobs?since=2026-05-12T00:00:00Z' \
  -H "Authorization: Bearer ah_live_xxx..."

# Verify rate-limit headers
curl -I 'https://astraahire.com/api/v1/partner/jobs?limit=1' \
  -H "Authorization: Bearer ah_live_xxx..."

# Single job
curl https://astraahire.com/api/v1/partner/jobs/ext_abc123 \
  -H "Authorization: Bearer ah_live_xxx..."

# Sources
curl https://astraahire.com/api/v1/partner/sources \
  -H "Authorization: Bearer ah_live_xxx..."

# Expected 401 with wrong key
curl -i https://astraahire.com/api/v1/partner/health \
  -H "Authorization: Bearer ah_live_bogus_key"

# Expected 403 with revoked key (after admin revokes)
# Expected 429 if you hammer past the partner's rateLimit
```

---

## Ashpranix consumer build — what actually shipped (commit `50f2516`)

This used to be a TODO list. Ashpranix has finished the consumer side; the section below documents what's in their repo so future-you on the AstraaHire side knows what to expect on the wire.

### Architecture choice: live-fetch, no local cache

Ashpranix made a deliberate call **not** to cache or snapshot the AstraaHire catalog locally. Every admin / student request hits AstraaHire's `/api/v1/partner/jobs` server-to-server and joins the result with the local `JobOpeningCuration` table at the resolver. Consequences:
- **`job.updated` is a no-op on their side** — they don't have stale data to invalidate. They just acknowledge with 200 and move on.
- **No 30-min full-catalog sync cron** — same reason. Defer until they actually cache.
- **No retry on 5xx with a snapshot fallback** — if AstraaHire is down, their admin + student pages render a clean "Job feed unavailable" empty state. They don't try to serve stale data.

This means the only mutation events that meaningfully affect them are `job.expired` / `job.closed` / `job.deleted`, all of which flip `isActiveUpstream=false` on the curation rows so admins still see them flagged "Expired" while students stop seeing them on next render.

### Schema (Ashpranix Prisma — for reference only, lives in their repo)

```prisma
model JobOpeningCuration {
  id                String   @id @default(cuid())
  tenantId          String
  externalJobId     String                       // pins to AstraaHire ExternalJob.id (stable, verified)
  published         Boolean  @default(false)
  dismissed         Boolean  @default(false)     // admin explicitly hid it; never re-shown until un-dismissed
  isActiveUpstream  Boolean  @default(true)      // mirror of AstraaHire's isActive — flipped by webhook
  relevantCourseIds String[]
  notes             String?
  publishedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  @@unique([tenantId, externalJobId])
  @@index([tenantId, published])
}
```

Diverges from the original spec in three places:
- `hidden` renamed to `dismissed` to make the workflow semantics clearer (dismiss = "no thanks, never show this", vs. just unpublishing).
- `isActiveUpstream` added so the student view can drop expired rows without needing to re-hit AstraaHire just to read the `isActive` flag.
- `publishedAt` added for the admin "recently published" sort.

### Surfaces

| Path | Notes |
|---|---|
| `GET /api/admin/jobs/catalog` | Server fetches `/api/v1/partner/jobs?includeInactive=true&limit=200`, then upserts skeleton curation rows for any new externalJobIds + returns each AstraaHire row joined with its curation state. |
| `PUT /api/admin/jobs/curation` | Single-row upsert keyed `(tenantId, externalJobId)`. Body: `{ externalJobId, published, dismissed, relevantCourseIds }`. |
| `GET /api/student/jobs` | Reads student → enrolled course ids → curation rows where `published=true AND isActiveUpstream=true AND NOT dismissed AND relevantCourseIds && studentCourseIds`. Pulls those externalJobIds from AstraaHire in one batch. Each returned row has `applyUrl` decorated with `?ref=ashpranix&institute=<slug>&student=<sha256>`. |
| `POST /api/webhooks/astraahire/jobs` | See "Webhook receiver behaviour" below. |
| `/dashboard/admin/jobs` | Admin UI — table with publish modal (course checkboxes), filter chips (All / Published / Dismissed / Unreviewed / Expired), "Expired" pill on rows where `isActiveUpstream=false`. |
| `/dashboard/student/jobs` | Card grid; Apply button goes to AstraaHire detail page (server-decorated URL), Details opens a modal. |

### Webhook receiver behaviour

Endpoint: `POST /api/webhooks/astraahire/jobs`. AstraaHire-side action item: set the partner row's `webhookUrl` to `https://<ashpranix-prod>/api/webhooks/astraahire/jobs` (or the staging equivalent).

Behaviour:
1. Reads raw body **before** `JSON.parse` — needed for signature verification.
2. Parses `X-AstraaHire-Signature: t=<unix>,v1=<hex>`. Rejects with `401` if missing or malformed.
3. Computes `HMAC_SHA256(env.ASTRAAHIRE_WEBHOOK_SECRET, "${t}.${rawBody}")` and constant-time compares against `v1`. Mismatch → `401`. **AstraaHire treats 401 as terminal and stops retrying** — by design, since 401 means our secret is wrong, not transient.
4. Rejects with `401` if `|now - t| > 5 min` (replay protection).
5. Dedupes on `X-AstraaHire-Delivery` via the shared `ProcessedWebhookEvent` table (source tag `astraahire`). Replays of the same delivery id return `200 { ok: true, deduped: true }` and short-circuit before any state change.
6. Dispatches by event:
   - `job.expired` / `job.closed` / `job.deleted` → `prisma.jobOpeningCuration.updateMany({ where: { externalJobId }, data: { isActiveUpstream: false } })`. Tenant-agnostic (every institute's curation row for that job gets flipped at once).
   - `job.updated` → no-op, `200 { ok: true, noop: true }`.
7. On any unexpected error: returns `500`. AstraaHire-side retry policy (1m / 5m / 30m / 2h / 12h) kicks in.

### Failure modes — non-fatal by design

- **`ASTRAAHIRE_API_KEY` missing** → admin page renders "AstraaHire feed isn't configured" empty state. Student page renders "Job feed unavailable". Webhook receiver returns `503`.
- **AstraaHire 5xx / timeout** → same empty states. No stale-data fallback (they don't cache).
- **Webhook arrives for a never-curated `externalJobId`** → `updateMany` matches zero rows, returns `200 { ok: true, affected: 0 }`. AstraaHire doesn't retry.

### Env vars on Ashpranix side

```
ASTRAAHIRE_API_BASE_URL=https://<astraahire-prod-or-staging>
ASTRAAHIRE_API_KEY=ah_live_xxx              # ah_test_xxx in staging
ASTRAAHIRE_WEBHOOK_SECRET=<hex secret from partner row>
```

No other env vars. The `student=<sha256>` hash in the decorated `applyUrl` is computed server-side per-(tenantId, studentId); no shared salt.

### Smoke test (post-credential-handoff)

From an Ashpranix shell with env vars set:

```bash
curl "$ASTRAAHIRE_API_BASE_URL/api/v1/partner/health" \
  -H "Authorization: Bearer $ASTRAAHIRE_API_KEY"
# → { "ok": true, "partnerName": "Ashpranix Institute", "scopes": ["jobs:read"], "version": "v1" }
```

Then load `/dashboard/admin/jobs` on Ashpranix — should populate. Once AstraaHire sets the `webhookUrl` on the partner row, trigger the daily expiry cron manually and confirm the Ashpranix `ProcessedWebhookEvent` table gets a row for each delivery.

---

## File map (AstraaHire side, for future-you)

```
prisma/schema.prisma                              ← B2BPartner, B2BApiCallLog, B2BWebhookDelivery, JobReferral
lib/b2b-auth.ts                                   ← bearer auth, scope, origin, rate-limit, audit log, key gen
lib/b2b-webhooks.ts                               ← HMAC sign, dispatch, persisted retry worker
lib/b2b-job-shape.ts                              ← canonical v1 row shape (single source of truth)
app/api/v1/partner/health/route.ts                ← health check
app/api/v1/partner/jobs/route.ts                  ← list + filters + pagination
app/api/v1/partner/jobs/[id]/route.ts             ← single job
app/api/v1/partner/sources/route.ts               ← upstream sources list
app/api/admin/b2b-partners/route.ts               ← list + create (returns plaintext once)
app/api/admin/b2b-partners/[id]/route.ts          ← patch + delete (soft-revoke)
app/api/admin/b2b-partners/[id]/rotate/route.ts   ← rotate key (returns plaintext once)
app/api/admin/b2b-partners/[id]/logs/route.ts     ← recent calls + webhook deliveries
app/api/b2b/track-referral/route.ts               ← writes JobReferral rows
app/api/cron/expire-jobs/route.ts                 ← daily sweep + fires job.expired
app/api/cron/retry-webhooks/route.ts              ← every-1-min retry worker
app/jobs/external/[id]/page.tsx                   ← canonical externalUrl/applyUrl target
components/ExternalJobActions.tsx                 ← client-side track + apply
components/admin-dashboard/B2BPartnersTab.tsx     ← admin UI
app/admin/page.tsx                                ← added Integrations → B2B Partners sidebar item
```

---

_Last updated: May 2026 — both sides shipped. Awaiting credential handoff (5 items from AstraaHire → Ashpranix, 1 URL from Ashpranix → AstraaHire) for the feed to go live._
_Maintainer: shared between AstraaHire + Ashpranix integration teams._
_Ashpranix consumer build: commit `50f2516` on master._
