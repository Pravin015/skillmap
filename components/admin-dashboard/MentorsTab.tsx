"use client";
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

const statusBadge: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  UNVERIFIED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-gray-100 text-gray-700",
};

interface Mentor {
  id: string; mentorNumber: string; status: string;
  currentCompany: string | null; currentRole: string | null;
  yearsOfExperience: number; menteesHelped: number; compensation: string;
  areaOfExpertise: string[];
  user: { name: string; email: string };
}

export default function MentorsTab() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { fetchMentors(); }, []);

  async function fetchMentors() {
    const res = await fetch("/api/admin/mentors");
    const data = await res.json();
    setMentors(data.mentors || []);
    setLoading(false);
  }

  async function updateStatus(mentorId: string, status: string) {
    if (!confirm(`Set mentor status to ${status}?`)) return;
    await fetch("/api/admin/mentors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, status }),
    });
    fetchMentors();
  }

  const filtered = filter === "ALL" ? mentors : mentors.filter((m) => m.status === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Mentor Management</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Review, verify, and manage mentor accounts</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "VERIFIED", "UNVERIFIED", "SUSPENDED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-xs ${heading} font-bold`} style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--primary)" : "var(--muted)", border: filter === s ? "none" : "1px solid var(--border)" }}>
            {s === "ALL" ? "All" : s} ({s === "ALL" ? mentors.length : mentors.filter((m) => m.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🧑‍🏫</div>
          <p className={`${heading} font-bold text-base mb-1`}>No mentors {filter !== "ALL" ? `with status "${filter}"` : "registered"}</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Mentors will appear here after onboarding</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${heading} font-bold text-sm text-white shrink-0`} style={{ background: "var(--ink)" }}>
                  {m.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`${heading} font-bold`}>{m.user.name}</span>
                    <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${statusBadge[m.status] || ""}`}>{m.status}</span>
                    <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{m.compensation}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {m.currentRole} at {m.currentCompany || "—"} · {m.yearsOfExperience} yrs · {m.menteesHelped} mentees
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{m.user.email} · ID: {m.mentorNumber}</div>
                  {m.areaOfExpertise.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {m.areaOfExpertise.map((a) => (
                        <span key={a} className="text-[0.6rem] px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {m.status !== "VERIFIED" && (
                    <button onClick={() => updateStatus(m.id, "VERIFIED")} className={`px-3 py-1.5 rounded-lg ${heading} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Verify</button>
                  )}
                  {m.status !== "SUSPENDED" && m.status !== "UNVERIFIED" && (
                    <button onClick={() => updateStatus(m.id, "SUSPENDED")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Suspend</button>
                  )}
                  {m.status === "SUSPENDED" && (
                    <button onClick={() => updateStatus(m.id, "PENDING")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Reactivate</button>
                  )}
                  <a href={`/mentor/${m.mentorNumber}`} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
