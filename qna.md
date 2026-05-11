# Open questions — gamify ↔ AstraaHire integration

Two things I need before the lab-gating end-to-end loop can go live in production. Both block the same thing: AstraaHire being able to mint launch JWTs that gamify will accept, AND AstraaHire being able to list the lab catalog so HR can attach labs to jobs.

I've read the gamify codebase locally (`C:\Users\Administrator\Desktop\gamify\src`) so the questions below are concrete, not guessing.

---

## Q1. What's gamify's public deployed base URL?

The admin UI shows the client email as `client_ce671c8c@api.outerlayerx.local`. That `.local` looks like an internal hostname, not the URL my Railway-hosted AstraaHire would call to.

What is the actual public URL where gamify is reachable? Examples:
- `https://gamify.up.railway.app`
- `https://outerlayerx.com`
- `https://labs.astraahire.com`
- something else?

That value goes into `GAMIFY_API_URL` in Railway. Without it, my JWT launch URL has no base to attach to.

### ✅ Answer

**`GAMIFY_API_URL = https://outerlayerx.com`**

That's the public-facing base. Concretely:
- VPS: `187.127.143.50` (path: `/opt/outerlayerx/`)
- Fronted by nginx with Let's Encrypt → terminates TLS on `outerlayerx.com`
- pm2 process `outerlayerx` listens on `127.0.0.1:5000` (or similar) behind nginx

The `*.outerlayerx.local` in the client `email` is purely a synthetic placeholder used when the seed/admin route creates API clients without a real human email — it has nothing to do with the network address. Ignore it.

Quick smoke test from anywhere on the internet:
```
curl -s https://outerlayerx.com/api/labs | head -c 200
```
You should get back the public lab catalog (currently 270 labs, no auth required for that anonymous listing endpoint — but `GET /api/v1/labs` is the authenticated LMS variant, that's the one Q2 is about).

---

## Q2. Can I drop the legacy `apiKey` requirement on `GET /api/v1/labs`?

**Context.** Gamify has two auth flows wired up in parallel:

- **Legacy** (`src/lib/api-auth.ts`): clients pass `Authorization: Bearer sk_live_<…>` where `sk_live_…` is the `User.apiKey` field. Used by:
  - `POST /api/v1/sessions` (start a session directly server-side)
  - `GET  /api/v1/sessions` (list past sessions)
  - `GET  /api/v1/labs` (list the published lab catalog) ← **this is the one I need**

- **Modern launch flow** (`src/lib/lms-launch.ts` + `/launch?token=<jwt>`): LMS mints a JWT signed HS256 with `apiClient.launchSecret`, students open `<gamify>/launch?token=<jwt>`, gamify verifies and redirects them to the lab. No apiKey needed here.

**The problem.** The gamify admin UI (`src/app/admin/api-keys/page.tsx`) only exposes three secrets — `launchSecret`, `webhookSecret`, `statusToken`. The `apiKey` is generated server-side in `src/app/api/admin/api-clients/route.ts` line 62 but never shown back to the operator. So I have **no way** to call `GET /api/v1/labs` from AstraaHire's server.

**Two clean fixes — pick one:**

### Option A (preferred — small change on gamify side)
In `gamify/src/app/api/v1/labs/route.ts`, replace `authenticateApiKey(req)` with auth that **also accepts the `statusToken`**. Since `/api/v1/labs` is a read-only catalog endpoint, accepting either credential is safe.

Concretely add a helper alongside `authenticateApiKey`:

```ts
// gamify/src/lib/api-auth.ts
export async function authenticateClient(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  // Try apiKey first (legacy)
  let client = await prisma.user.findUnique({ where: { apiKey: token }, select: { … } });
  // Fall back to statusToken
  if (!client) client = await prisma.user.findUnique({ where: { statusToken: token }, select: { … } });
  if (!client || client.role !== "API_CLIENT") return null;
  return client;
}
```

Swap that into `/api/v1/labs/route.ts`. Then AstraaHire calls `/api/v1/labs` with `Authorization: Bearer ${GAMIFY_STATUS_TOKEN}` and everything works.

### Option B (UI change instead)
Expose the `apiKey` value in the gamify admin's api-keys page so operators can copy it. Then on AstraaHire side I keep using the legacy Bearer flow exactly as it works today — just need the value pasted into `GAMIFY_API_KEY` env var.

This is more code to keep in sync (two auth models forever) and re-exposes a "god-tier" key (`apiKey` also authenticates write endpoints like `POST /api/v1/sessions`). I'd recommend Option A.

**Which one do you want to do?**

### ✅ Answer: **Option A.** Your analysis is correct — go with the gamify-side fix.

Reasons in order of weight:
1. `statusToken` is already a per-client, narrowly-scoped credential (already meant for read-only polling of `/api/v1/launches/:jti/status`). Extending it to also read the catalog keeps it on the "read-only" rail, which is the right blast-radius.
2. `apiKey` is intentionally write-capable (it can `POST /api/v1/sessions`). Exposing it in the admin UI just so HR can list labs is an over-grant. Once it's pasted into an env var on Railway, you've now got a god-tier secret with no rotation story.
3. Option A is genuinely tiny — one new helper, one route swap. Easier to review, easier to audit later.
4. Single auth model going forward, no "which credential do I use for which endpoint" matrix to maintain.

**Implementation note — one thing to add to your sketch:** the `statusToken` lookup needs a unique constraint or at least an index. Check `prisma/schema.prisma`:

```ts
// in User model
statusToken String? @unique
```

If that `@unique` is already there (it should be — `findUnique({ where: { statusToken: token } })` requires it), you're good. If not, add it before deploying.

Otherwise the `authenticateClient` helper you sketched is exactly right. Drop it in `src/lib/api-auth.ts`, swap line 14 of `src/app/api/v1/labs/route.ts` from `authenticateApiKey(req)` to `authenticateClient(req)`, ship it.

**Bonus** — while you're in `api-auth.ts`, consider tightening:
- The two `findUnique` calls in `authenticateClient` happen serially even when only one will match. Acceptable for a low-traffic endpoint, but if you start seeing load, switch to `findFirst` with `OR: [{apiKey: token}, {statusToken: token}]` — single query.
- Both branches should still enforce `role === "API_CLIENT"` (your sketch has it after the fallback, which is right).

I can write the patch for gamify side if you want — it's ~30 lines including the migration check. Just confirm and I'll make the edits.

---

## Once Q1 + Q2 are answered, AstraaHire-side refactor takes ~30 min:

1. `lib/integrations/gamify-labs.ts` — rip out the Bearer-apiKey wrapper; replace with:
   - `listLabs()` → fetch `${GAMIFY_API_URL}/api/v1/labs` with `Authorization: Bearer ${GAMIFY_STATUS_TOKEN}` (assuming Option A above).
   - `mintLaunchUrl({ studentId, labSlug, email?, name? })` → sign a JWT with `GAMIFY_LAUNCH_SECRET` (HS256, payload `{ iss, sub, exp, iat, jti, lab, email, name, aud }`), return `${GAMIFY_API_URL}/launch?token=<jwt>`.
   - `getLaunchStatus(jti)` → fetch `${GAMIFY_API_URL}/api/v1/launches/${jti}/status` with `Bearer ${GAMIFY_STATUS_TOKEN}` (already wired correctly on gamify side).
2. `app/api/external-labs/[slug]/start/route.ts` — instead of calling gamify and getting back `embedUrl`, just return the locally-minted launch URL.
3. `/labs` page — open the launch URL in a new tab as today; gamify's `/launch` page already wraps the lab in a CSP-protected iframe.
4. Webhook receiver `/api/integrations/gamify-webhook` — already verifies `webhookSecret` and writes `ExternalLabAttempt`. Signature header is `X-Outerlayerx-Signature: sha256=<hex>` per gamify code line 106. No change needed.

---

## Env vars to keep on AstraaHire side (Railway)

```
GAMIFY_API_URL         = <answer to Q1>                          # base URL
GAMIFY_CLIENT_ID       = cmp102qkb0000kwemmtuj93kg               # visible in UI
GAMIFY_LAUNCH_SECRET   = <copy from "LAUNCH SECRET" field>       # for minting JWTs
GAMIFY_WEBHOOK_SECRET  = <copy from "WEBHOOK SECRET" field>      # already in use
GAMIFY_STATUS_TOKEN    = <copy from "STATUS BEARER TOKEN" field> # for catalog + polling
```

Drop the old `GAMIFY_API_KEY` if it was set — under Option A, we never need it.
