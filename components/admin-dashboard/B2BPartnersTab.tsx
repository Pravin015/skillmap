"use client";
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

interface Partner {
  id: string;
  name: string;
  apiKeyPrefix: string;
  apiKeyLast4: string;
  allowedOrigins: string[];
  rateLimit: number;
  scope: string[];
  isActive: boolean;
  ownerEmail: string | null;
  notes: string | null;
  webhookUrl: string | null;
  webhookEvents: string[];
  lastUsedAt: string | null;
  createdAt: string;
  _count: { apiCalls: number; webhookDeliveries: number };
}

interface JustCreated {
  plaintextApiKey: string;
  webhookSecret: string | null;
}

export default function B2BPartnersTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<JustCreated | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ calls: Array<{ id: string; endpoint: string; method: string; status: number; latencyMs: number; createdAt: string; errorDetail: string | null; ip: string | null }>; webhooks: Array<{ id: string; event: string; status: string; attemptCount: number; lastStatus: number | null; lastError: string | null; createdAt: string }> } | null>(null);

  // create-form state
  const [cName, setCName] = useState("");
  const [cOwner, setCOwner] = useState("");
  const [cOrigins, setCOrigins] = useState("");
  const [cRateLimit, setCRateLimit] = useState("120");
  const [cWebhookUrl, setCWebhookUrl] = useState("");
  const [cEnv, setCEnv] = useState<"live" | "test">("live");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchPartners(); }, []);

  async function fetchPartners() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/b2b-partners");
      const d = await r.json();
      setPartners(d.partners || []);
    } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await fetch("/api/admin/b2b-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cName,
          ownerEmail: cOwner || undefined,
          allowedOrigins: cOrigins.split(",").map((s) => s.trim()).filter(Boolean),
          rateLimit: parseInt(cRateLimit, 10) || 120,
          webhookUrl: cWebhookUrl || undefined,
          env: cEnv,
        }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Failed"); return; }
      setCreated({ plaintextApiKey: d.plaintextApiKey, webhookSecret: d.webhookSecret });
      setShowCreate(false);
      setCName(""); setCOwner(""); setCOrigins(""); setCRateLimit("120"); setCWebhookUrl("");
      fetchPartners();
    } finally { setCreating(false); }
  }

  async function rotate(id: string, env: "live" | "test") {
    if (!confirm("Rotate this API key? The current key will stop working immediately.")) return;
    const r = await fetch(`/api/admin/b2b-partners/${id}/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ env }),
    });
    const d = await r.json();
    if (r.ok) { setCreated({ plaintextApiKey: d.plaintextApiKey, webhookSecret: null }); fetchPartners(); }
    else alert(d.error || "Failed");
  }

  async function toggleActive(p: Partner) {
    const r = await fetch(`/api/admin/b2b-partners/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (r.ok) fetchPartners();
  }

  async function openLogs(id: string) {
    if (expanded === id) { setExpanded(null); setLogs(null); return; }
    setExpanded(id);
    setLogs(null);
    const r = await fetch(`/api/admin/b2b-partners/${id}/logs`);
    const d = await r.json();
    setLogs(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${heading} font-bold text-xl`}>B2B Partners</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            External institutes/portals consuming the job catalog via <code>/api/v1/partner/*</code>
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs`} style={{ background: "var(--primary)", color: "white" }}>
          + Create Partner
        </button>
      </div>

      {/* One-time-secret reveal modal */}
      {created && (
        <div className="rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: "#16a34a", background: "rgba(34,197,94,0.05)" }}>
          <div className="flex items-center justify-between">
            <h3 className={`${heading} font-bold text-base`} style={{ color: "#16a34a" }}>🔑 Save these secrets NOW — they will never be shown again</h3>
            <button onClick={() => setCreated(null)} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: "var(--border)" }}>Dismiss</button>
          </div>
          <div>
            <div className="text-[11px] font-bold mb-1">API Key</div>
            <div className="flex gap-2">
              <input readOnly value={created.plaintextApiKey} className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono" style={{ borderColor: "var(--border)", background: "white" }} onFocus={(e) => e.currentTarget.select()} />
              <button onClick={() => { navigator.clipboard.writeText(created.plaintextApiKey); }} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "var(--ink)", color: "white" }}>Copy</button>
            </div>
          </div>
          {created.webhookSecret && (
            <div>
              <div className="text-[11px] font-bold mb-1">Webhook Secret (for HMAC verification)</div>
              <div className="flex gap-2">
                <input readOnly value={created.webhookSecret} className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono" style={{ borderColor: "var(--border)", background: "white" }} onFocus={(e) => e.currentTarget.select()} />
                <button onClick={() => { navigator.clipboard.writeText(created.webhookSecret!); }} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "var(--ink)", color: "white" }}>Copy</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border bg-white p-5 space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3">
            <input required value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Partner name (e.g. Ashpranix Institute)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
            <input value={cOwner} onChange={(e) => setCOwner(e.target.value)} placeholder="Owner email (optional)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
          <input value={cOrigins} onChange={(e) => setCOrigins(e.target.value)} placeholder="Allowed origins (comma-separated, leave blank for server-to-server only)" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
          <div className="grid grid-cols-3 gap-3">
            <input value={cRateLimit} onChange={(e) => setCRateLimit(e.target.value)} type="number" min={1} placeholder="Rate limit (req/min)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
            <input value={cWebhookUrl} onChange={(e) => setCWebhookUrl(e.target.value)} placeholder="Webhook URL (optional)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} />
            <select value={cEnv} onChange={(e) => setCEnv(e.target.value as "live" | "test")} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              <option value="live">Live (ah_live_…)</option>
              <option value="test">Test (ah_test_…)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className={`px-4 py-2 rounded-lg ${heading} font-bold text-xs disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
              {creating ? "Creating..." : "Create partner"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border text-xs" style={{ borderColor: "var(--border)" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Partner table */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      ) : partners.length === 0 ? (
        <p className="text-sm rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "white", color: "var(--muted)" }}>No partners yet.</p>
      ) : (
        <div className="space-y-2">
          {partners.map((p) => (
            <div key={p.id} className="rounded-xl border bg-white" style={{ borderColor: "var(--border)" }}>
              <div className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <div className={`${heading} font-bold text-sm`}>{p.name}</div>
                  <div className="text-[11px] mt-0.5 font-mono" style={{ color: "var(--muted)" }}>
                    {p.apiKeyPrefix}…{p.apiKeyLast4}
                  </div>
                  {p.ownerEmail && <div className="text-[11px]" style={{ color: "var(--muted)" }}>{p.ownerEmail}</div>}
                </div>
                <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                  <div>{p.rateLimit}/min · {p.scope.join(", ")}</div>
                  <div>{p._count.apiCalls} calls · {p._count.webhookDeliveries} webhooks</div>
                  {p.lastUsedAt && <div>Last used {new Date(p.lastUsedAt).toLocaleString()}</div>}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: p.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.isActive ? "#16a34a" : "#dc2626" }}>
                  {p.isActive ? "Active" : "Revoked"}
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => openLogs(p.id)} className="text-[11px] px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                    {expanded === p.id ? "Hide" : "Logs"}
                  </button>
                  <button onClick={() => rotate(p.id, "live")} className="text-[11px] px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)" }}>Rotate</button>
                  <button onClick={() => toggleActive(p)} className="text-[11px] px-2.5 py-1.5 rounded-lg" style={{ background: p.isActive ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: p.isActive ? "#dc2626" : "#16a34a" }}>
                    {p.isActive ? "Revoke" : "Re-enable"}
                  </button>
                </div>
              </div>
              {expanded === p.id && logs && (
                <div className="border-t p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div>
                    <div className={`${heading} font-bold text-xs mb-1.5`}>Recent API calls</div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {logs.calls.length === 0 ? (
                        <p className="text-[11px]" style={{ color: "var(--muted)" }}>No calls yet.</p>
                      ) : logs.calls.map((c) => (
                        <div key={c.id} className="text-[11px] flex gap-2 items-center font-mono">
                          <span className="px-1.5 py-0.5 rounded" style={{ background: c.status >= 400 ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: c.status >= 400 ? "#dc2626" : "#16a34a" }}>{c.status}</span>
                          <span>{c.method}</span>
                          <span className="flex-1 truncate">{c.endpoint}</span>
                          <span style={{ color: "var(--muted)" }}>{c.latencyMs}ms</span>
                          <span style={{ color: "var(--muted)" }}>{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={`${heading} font-bold text-xs mb-1.5`}>Recent webhook deliveries</div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {logs.webhooks.length === 0 ? (
                        <p className="text-[11px]" style={{ color: "var(--muted)" }}>No deliveries yet.</p>
                      ) : logs.webhooks.map((w) => (
                        <div key={w.id} className="text-[11px] flex gap-2 items-center font-mono">
                          <span className="px-1.5 py-0.5 rounded" style={{ background: w.status === "DELIVERED" ? "rgba(34,197,94,0.1)" : w.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: w.status === "DELIVERED" ? "#16a34a" : w.status === "FAILED" ? "#dc2626" : "#d97706" }}>{w.status}</span>
                          <span>{w.event}</span>
                          <span style={{ color: "var(--muted)" }}>att.{w.attemptCount}</span>
                          {w.lastStatus && <span style={{ color: "var(--muted)" }}>HTTP {w.lastStatus}</span>}
                          <span className="flex-1 truncate" style={{ color: "var(--muted)" }}>{w.lastError || ""}</span>
                          <span style={{ color: "var(--muted)" }}>{new Date(w.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
