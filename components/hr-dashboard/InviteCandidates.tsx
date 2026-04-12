"use client";
import { useEffect, useState } from "react";
const syne = "font-[family-name:var(--font-syne)]";

const statusBadge: Record<string, string> = { SENT: "bg-blue-100 text-blue-700", VIEWED: "bg-yellow-100 text-yellow-700", ACCEPTED: "bg-green-100 text-green-700", DECLINED: "bg-red-100 text-red-700", EXPIRED: "bg-gray-100 text-gray-700" };

interface Invite { id: string; status: string; message: string | null; candidateName: string; candidateEmail: string; jobTitle: string | null; createdAt: string }

export default function InviteCandidates() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/invites").then((r) => r.json()).then((d) => setInvites(d.invites || [])).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className={`${syne} font-bold text-xl`}>Sent Invitations</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{invites.length} invites sent · Use <strong>AI JD Match</strong> tab to find and invite candidates</p></div>

      {invites.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">✉️</div>
          <p className={`${syne} font-bold text-base mb-1`}>No invites sent yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Go to <strong>AI JD Match</strong> → paste JD → select candidates → send invites</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((inv) => (
            <div key={inv.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>{inv.candidateName?.charAt(0) || "?"}</div>
              <div className="flex-1 min-w-0">
                <div className={`${syne} font-bold text-sm`}>{inv.candidateName}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{inv.candidateEmail}{inv.jobTitle ? ` · For: ${inv.jobTitle}` : ""}</div>
                {inv.message && <div className="text-xs mt-0.5 italic" style={{ color: "var(--muted)" }}>&quot;{inv.message}&quot;</div>}
              </div>
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge[inv.status] || ""}`}>{inv.status}</span>
              <div className="text-xs shrink-0" style={{ color: "var(--muted)" }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
