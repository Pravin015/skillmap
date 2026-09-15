import { redirect } from "next/navigation";
import { KeyRound, Webhook } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addWebhook, createApiKey, deleteWebhook, revokeApiKey, sendTestWebhook, toggleWebhook } from "@/lib/actions/api-keys";
import { SecretForm } from "@/components/secret-form";
import { SubmitButton } from "@/components/form-bits";
import { Badge, Button, ButtonLink, Card, Field, Input, PageHeader } from "@/components/ui";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { appUrl } from "@/lib/oauth";
import { fmtDate, timeAgo } from "@/lib/utils";
import { companyCan } from "@/lib/permissions";
import { featureEnabled } from "@/lib/features";

export const metadata = { title: "Developers · API and webhooks" };

export default async function DevelopersPage() {
  const user = await requireUser("/settings/developers");
  if (!user.membership || !companyCan(user.membership.role, "api_keys") || !(await featureEnabled("api"))) redirect("/settings");
  const companyId = user.membership.company.id;
  const [keys, endpoints] = await Promise.all([
    db.apiKey.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } }),
    db.webhookEndpoint.findMany({ where: { companyId }, include: { deliveries: { orderBy: { createdAt: "desc" }, take: 5 } }, orderBy: { createdAt: "asc" } }),
  ]);
  const base = `${appUrl()}/api/v1`;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Company" title="Developers · API and webhooks" body="Connect your LMS, HRMS or vendor-management system. Create requirements, read applications and work orders, and receive events as they happen." actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound size={18} className="text-violet" /> API keys</h2>
        <p className="mt-1 text-sm text-muted">Keys act as your company. Anyone holding a key can read your requirements, applications and work orders and post new requirements. Store them like passwords.</p>
        <SecretForm action={createApiKey} className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Key name" className="min-w-56 flex-1"><Input name="name" placeholder="e.g. SAP SuccessFactors integration" maxLength={60} /></Field>
          <SubmitButton variant="violet" pendingText="Creating…">Create key</SubmitButton>
        </SecretForm>
        {keys.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Key</th><th className="py-2 pr-3">Created</th><th className="py-2 pr-3">Last used</th><th className="py-2 pr-3">Status</th><th className="py-2" /></tr></thead>
              <tbody>{keys.map((k) => (
                <tr key={k.id} className="border-b border-line/60">
                  <td className="py-2 pr-3 font-medium">{k.name}</td><td className="mono py-2 pr-3 text-xs">{k.prefix}…</td><td className="py-2 pr-3 text-muted">{fmtDate(k.createdAt)}</td><td className="py-2 pr-3 text-muted">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Never"}</td>
                  <td className="py-2 pr-3">{k.revokedAt ? <Badge tone="neutral">Revoked</Badge> : <Badge tone="lime">Active</Badge>}</td>
                  <td className="py-2 text-right">{k.revokedAt ? null : <form action={revokeApiKey}><input type="hidden" name="id" value={k.id} /><Button variant="danger" size="sm">Revoke</Button></form>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="mt-4 text-sm text-muted">No keys yet.</p>}
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Webhook size={18} className="text-violet" /> Webhooks</h2>
        <p className="mt-1 text-sm text-muted">We POST a JSON event to your URL and sign it with the endpoint&apos;s secret. Failed deliveries are recorded here for 200 events per endpoint.</p>
        <SecretForm action={addWebhook} className="mt-4 space-y-3">
          <Field label="Endpoint URL" hint="HTTPS required (localhost allowed for testing)"><Input name="url" type="url" required placeholder="https://hooks.example.com/corpgurus" /></Field>
          <div>
            <p className="text-sm font-medium">Events</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="events" value="*" className="accent-violet" /> All events</label>
              {WEBHOOK_EVENTS.filter((e) => e !== "test").map((e) => <label key={e} className="flex items-center gap-2 text-sm"><input type="checkbox" name="events" value={e} className="accent-violet" /> <span className="mono text-xs">{e}</span></label>)}
            </div>
          </div>
          <SubmitButton variant="violet" pendingText="Adding…">Add endpoint</SubmitButton>
        </SecretForm>
        {endpoints.length ? (
          <ul className="mt-5 space-y-3">{endpoints.map((ep) => (
            <li key={ep.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono min-w-0 flex-1 truncate text-sm">{ep.url}</span>
                {ep.active ? <Badge tone="lime">Active</Badge> : <Badge tone="neutral">Paused</Badge>}
                <form action={sendTestWebhook}><input type="hidden" name="id" value={ep.id} /><Button variant="secondary" size="sm">Send test</Button></form>
                <form action={toggleWebhook}><input type="hidden" name="id" value={ep.id} /><Button variant="secondary" size="sm">{ep.active ? "Pause" : "Resume"}</Button></form>
                <form action={deleteWebhook}><input type="hidden" name="id" value={ep.id} /><Button variant="danger" size="sm">Delete</Button></form>
              </div>
              <p className="mt-1 text-xs text-muted">Events: {ep.events.join(", ")} · added {fmtDate(ep.createdAt)}</p>
              {ep.deliveries.length ? <ul className="mt-2 divide-y divide-line/60 text-xs">{ep.deliveries.map((d) => <li key={d.id} className="flex flex-wrap items-center gap-2 py-1"><span className="mono">{d.event}</span><span className={d.status === "delivered" ? "text-lime" : "text-rose"}>{d.status}{d.responseCode ? ` · HTTP ${d.responseCode}` : ""}{d.error ? ` · ${d.error}` : ""}</span><span className="ml-auto text-dim">{timeAgo(d.createdAt)}</span></li>)}</ul> : <p className="mt-2 text-xs text-dim">No deliveries yet.</p>}
            </li>
          ))}</ul>
        ) : <p className="mt-4 text-sm text-muted">No endpoints yet.</p>}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">API reference (v1)</h2>
        <p className="mt-1 text-sm text-muted">Base URL <code className="mono text-xs">{base}</code>. Authenticate with <code className="mono text-xs">Authorization: Bearer cg_live_…</code>. All responses are JSON. Lists return <code className="mono text-xs">data</code> and <code className="mono text-xs">next_cursor</code>; pass it back as <code className="mono text-xs">?cursor=</code>. 600 requests per minute per key.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-3">Method</th><th className="py-2 pr-3">Path</th><th className="py-2">What it does</th></tr></thead>
            <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_tr]:border-b [&_tr]:border-line/60">
              <tr><td className="mono text-xs">GET</td><td className="mono text-xs">/requirements?status=OPEN</td><td>Your requirements, newest first.</td></tr>
              <tr><td className="mono text-xs">POST</td><td className="mono text-xs">/requirements</td><td>Create a requirement. Body: title, description, category (slug), skills[] (slugs), mode, city, start_date, end_date, participants, budget_min, budget_max, currency, language, visibility, posted_by_email.</td></tr>
              <tr><td className="mono text-xs">GET</td><td className="mono text-xs">/requirements/:id</td><td>One requirement with applications and the work order.</td></tr>
              <tr><td className="mono text-xs">PATCH</td><td className="mono text-xs">/requirements/:id</td><td>Change status: OPEN, CANCELLED or COMPLETED.</td></tr>
              <tr><td className="mono text-xs">GET</td><td className="mono text-xs">/applications?requirement_id=&amp;status=</td><td>Applications across your requirements with trainer summaries.</td></tr>
              <tr><td className="mono text-xs">GET</td><td className="mono text-xs">/work-orders?status=ACCEPTED</td><td>Work orders with batches, signatures and invoices.</td></tr>
              <tr><td className="mono text-xs">GET</td><td className="mono text-xs">/purchase-orders?status=ACCEPTED</td><td>Purchase orders with line items, GST breakup and the invoices raised against them.</td></tr>
              <tr><td className="mono text-xs">GET</td><td className="mono text-xs">/invoices?status=SENT</td><td>GST invoices from trainers with lines, CGST/SGST/IGST split and PO reference.</td></tr>
              <tr><td className="mono text-xs">GET · POST</td><td className="mono text-xs">/webhooks</td><td>List or subscribe webhook endpoints (REST hooks for Zapier/Make).</td></tr>
              <tr><td className="mono text-xs">GET · DELETE</td><td className="mono text-xs">/webhooks/:id</td><td>Inspect deliveries or unsubscribe.</td></tr>
            </tbody>
          </table>
        </div>
        <h3 className="mt-6 font-display font-semibold">Example</h3>
        <pre className="mono mt-2 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 text-xs">{`curl ${base}/requirements \\
  -H "Authorization: Bearer cg_live_XXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Kubernetes for platform engineers","description":"3-day hands-on workshop for 20 SREs covering cluster operations, networking and observability. Lab environment provided.","category":"cloud-devops","skills":["kubernetes"],"mode":"VIRTUAL","start_date":"2026-11-10","end_date":"2026-11-12","participants":20,"budget_max":45000}'`}</pre>
        <h3 className="mt-6 font-display font-semibold">Zapier, Make and REST hooks</h3>
        <p className="mt-1 text-sm text-muted">Any automation tool that speaks REST works with the API key. Use <code className="mono text-xs">POST /webhooks</code> to subscribe a Zap or Make scenario (body: <code className="mono text-xs">{`{ "url": "…", "events": ["application.created"] }`}</code>, returns the signing secret once), <code className="mono text-xs">DELETE /webhooks/:id</code> to unsubscribe, <code className="mono text-xs">GET /purchase-orders</code> and <code className="mono text-xs">GET /invoices</code> to sync POs and GST invoices into your finance system, and the list endpoints above as polling triggers or &ldquo;perform list&rdquo; samples. Zapier&apos;s &ldquo;Catch Hook&rdquo; URL can be subscribed directly.</p>
        <h3 className="mt-6 font-display font-semibold">Verifying webhook signatures</h3>
        <p className="mt-1 text-sm text-muted">Each delivery carries <code className="mono text-xs">X-CorpGurus-Event</code>, <code className="mono text-xs">X-CorpGurus-Timestamp</code> (ms since epoch) and <code className="mono text-xs">X-CorpGurus-Signature</code>. Compute HMAC-SHA256 over <code className="mono text-xs">{"{timestamp}.{raw body}"}</code> with the endpoint secret and compare to the header value after <code className="mono text-xs">sha256=</code>. Reject timestamps older than five minutes.</p>
        <pre className="mono mt-2 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 text-xs">{`// Node.js
const expected = "sha256=" + crypto.createHmac("sha256", SECRET).update(\`\${req.headers["x-corpgurus-timestamp"]}.\${rawBody}\`).digest("hex");
const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(req.headers["x-corpgurus-signature"]));`}</pre>
        <p className="mt-3 text-sm text-muted">Payload: <code className="mono text-xs">{`{ "id": "evt_…", "event": "application.created", "createdAt": "…", "data": { … } }`}</code>. Events: {WEBHOOK_EVENTS.filter((e) => e !== "test").map((e) => <code key={e} className="mono mr-1 text-xs">{e}</code>)}.</p>
      </Card>
    </div>
  );
}
