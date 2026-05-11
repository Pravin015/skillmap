"use client";

// Shared invite-link generator. Slotted into:
//   - Admin dashboard       (allowedKinds = all four)
//   - Institution dashboard (allowedKinds = ["INSTITUTE_STUDENT"])
//   - HR dashboard          (allowedKinds = ["CANDIDATE"])
//   - Company dashboard     (allowedKinds = ["HR"])
//
// Permission is enforced server-side too — this prop just controls what
// the inviter sees in the UI.
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

export type InviteKind = "MENTOR" | "HR" | "INSTITUTE_STUDENT" | "CANDIDATE";

interface InviteLink {
  id: string;
  token: string;
  kind: InviteKind;
  role: string;
  organisation: string | null;
  collegeName: string | null;
  label: string | null;
  expiresAt: string;
  usedCount: number;
  revokedAt: string | null;
  createdAt: string;
}

const KIND_LABEL: Record<InviteKind, string> = {
  MENTOR: "Mentor",
  HR: "HR",
  INSTITUTE_STUDENT: "Institute student",
  CANDIDATE: "Candidate",
};

const KIND_DESC: Record<InviteKind, string> = {
  MENTOR: "Sign-up link for new mentors. They land on a pre-filled signup with role MENTOR.",
  HR: "Sign-up link for HR users at your company. Their organisation is auto-filled.",
  INSTITUTE_STUDENT: "Sign-up link for students of your institution. Their college is auto-linked.",
  CANDIDATE: "Sign-up link for a candidate you want on the platform. They join under your company.",
};

export default function InviteLinksManager({ allowedKinds, defaultKind }: { allowedKinds: InviteKind[]; defaultKind?: InviteKind }) {
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<InviteKind>(defaultKind || allowedKinds[0]);
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { fetchLinks(); }, []);

  async function fetchLinks() {
    try {
      const r = await fetch("/api/invites/links");
      const d = await r.json();
      setLinks(d.links || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setCreating(true);
    try {
      const r = await fetch("/api/invites/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label: label.trim() || null }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed to create"); return; }
      setLabel("");
      fetchLinks();
    } catch { setError("Network error"); }
    finally { setCreating(false); }
  }

  async function revoke(token: string) {
    if (!confirm("Revoke this invite link? Recipients won't be able to use it anymore.")) return;
    await fetch(`/api/invites/links/${token}`, { method: "DELETE" });
    fetchLinks();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  const visibleLinks = links.filter((l) => allowedKinds.includes(l.kind));

  return (
    <div className="space-y-5">
      <div>
        <h3 className={`${heading} font-bold text-base`}>Invite links</h3>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Generate a shareable link. Reusable for 14 days, then it expires automatically.
        </p>
      </div>

      <form onSubmit={createLink} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "white" }}>
        {allowedKinds.length > 1 && (
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${heading}`}>Invite type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as InviteKind)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
              {allowedKinds.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </div>
        )}

        <p className="text-xs" style={{ color: "var(--muted)" }}>{KIND_DESC[kind]}</p>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${heading}`}>Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            placeholder='e.g. "CSE Batch 2025" or "October hiring drive"'
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        {error && <div className="text-xs rounded-lg p-2" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626" }}>{error}</div>}

        <button type="submit" disabled={creating} className={`px-4 py-2 rounded-lg ${heading} font-bold text-xs disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
          {creating ? "Generating..." : "Generate link"}
        </button>
      </form>

      <div>
        <h4 className={`${heading} font-bold text-sm mb-3`}>Active links</h4>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
        ) : visibleLinks.length === 0 ? (
          <p className="text-sm rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "white", color: "var(--muted)" }}>
            No invite links yet. Generate one above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {visibleLinks.map((l) => {
              const isRevoked = !!l.revokedAt;
              const isExpired = !isRevoked && new Date(l.expiresAt) < new Date();
              const isLive = !isRevoked && !isExpired;
              const url = typeof window !== "undefined" ? `${window.location.origin}/invite/${l.token}` : `/invite/${l.token}`;
              return (
                <div key={l.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "white", opacity: isLive ? 1 : 0.6 }}>
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {KIND_LABEL[l.kind]}
                    </span>
                    {l.label && <span className="text-xs font-medium">{l.label}</span>}
                    {l.organisation && <span className="text-[11px]" style={{ color: "var(--muted)" }}>· {l.organisation}</span>}
                    {l.collegeName && <span className="text-[11px]" style={{ color: "var(--muted)" }}>· {l.collegeName}</span>}
                    <span className="text-[11px] ml-auto" style={{ color: isLive ? "#16a34a" : "#dc2626" }}>
                      {isRevoked ? "Revoked" : isExpired ? "Expired" : `Expires ${new Date(l.expiresAt).toLocaleDateString()}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input readOnly value={url} className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono" style={{ borderColor: "var(--border)", background: "var(--surface)" }} onFocus={(e) => e.currentTarget.select()} />
                    <button onClick={() => copyLink(l.token)} disabled={!isLive} className={`px-3 py-2 rounded-lg ${heading} font-bold text-xs disabled:opacity-50`} style={{ background: copied === l.token ? "#16a34a" : "var(--ink)", color: "white" }}>
                      {copied === l.token ? "Copied!" : "Copy"}
                    </button>
                    {isLive && (
                      <button onClick={() => revoke(l.token)} className={`px-3 py-2 rounded-lg ${heading} font-bold text-xs border`} style={{ borderColor: "var(--border)", color: "#dc2626" }}>
                        Revoke
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
                    {l.usedCount} signup{l.usedCount === 1 ? "" : "s"} · created {new Date(l.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
