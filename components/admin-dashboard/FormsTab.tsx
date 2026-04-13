"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

const statusBadge: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", REVIEWED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
};

const formLabels: Record<string, { label: string; icon: string }> = {
  CONTACT: { label: "Contact Us", icon: "✉️" },
  PARTNER: { label: "Partner Requests", icon: "🤝" },
  HIRE_FROM_US: { label: "Hire From Us", icon: "🎯" },
  JOB_POSTING: { label: "Job Postings", icon: "💼" },
  MENTOR_ONBOARDING: { label: "Mentor Onboarding", icon: "🧑‍🏫" },
  COMPANY_ONBOARDING: { label: "Company Onboarding", icon: "🏢" },
  INSTITUTION_ONBOARDING: { label: "Institution Onboarding", icon: "🏫" },
};

interface Submission { id: string; type: string; status: string; name: string; email: string; phone: string | null; data: string; createdAt: string }

export default function FormsTab() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accountMsg, setAccountMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function createAccountFromForm(submission: Submission) {
    let parsedData: Record<string, string> = {};
    try { parsedData = JSON.parse(submission.data); } catch { /* */ }

    setAccountMsg(null);
    try {
      if (submission.type === "MENTOR_ONBOARDING") {
        const res = await fetch("/api/admin/add-mentor", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parsedData.name || submission.name, email: parsedData.officialEmail || parsedData.email || submission.email,
            phone: parsedData.phone || submission.phone, currentCompany: parsedData.currentCompany,
            currentRole: parsedData.currentDesignation, yearsOfExperience: parsedData.experience?.match(/\d+/)?.[0],
            areaOfExpertise: parsedData.domain ? [parsedData.domain] : [], compensation: parsedData.compensation === "volunteer" ? "VOLUNTEER" : "PAID",
            linkedinUrl: parsedData.linkedin,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setAccountMsg({ id: submission.id, type: "error", text: data.error }); return; }
        setAccountMsg({ id: submission.id, type: "success", text: `Mentor account created! ID: ${data.mentorNumber} · Temp password: ${data.tempPassword}` });
        updateStatus(submission.id, "APPROVED");
      } else if (submission.type === "COMPANY_ONBOARDING" || submission.type === "INSTITUTION_ONBOARDING") {
        const role = submission.type === "COMPANY_ONBOARDING" ? "ORG" : "INSTITUTION";
        const orgName = parsedData.organisationName || parsedData.institutionName || parsedData.companyName || submission.name;
        const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: orgName, email: parsedData.officialEmail || parsedData.email || submission.email,
            password: Math.random().toString(36).slice(-8) + "C1!", role, organisation: orgName,
            phone: parsedData.phone || submission.phone,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setAccountMsg({ id: submission.id, type: "error", text: data.error }); return; }
        const tempPwd = Math.random().toString(36).slice(-8) + "C1!";
        setAccountMsg({ id: submission.id, type: "success", text: `${role} account created for ${orgName}! Share temp password with them.` });
        updateStatus(submission.id, "APPROVED");
      }
    } catch { setAccountMsg({ id: submission.id, type: "error", text: "Failed to create account" }); }
  }

  async function fetchData() {
    try {
      const res = await fetch("/api/forms/list");
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setCounts(data.counts || {});
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/forms/list", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchData();
  }

  const filtered = filter === "ALL" ? submissions : submissions.filter((s) => s.type === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className={`${syne} font-bold text-xl`}>Form Submissions</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{counts.pending || 0} pending review</p></div>

      {/* Count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(formLabels).map(([key, { label, icon }]) => (
          <button key={key} onClick={() => setFilter(key)} className="rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: filter === key ? "var(--ink)" : "var(--border)" }}>
            <div className="flex items-center justify-between mb-2"><span className="text-xl">{icon}</span><span className={`${syne} text-xs font-bold px-2 py-0.5 rounded-full`} style={{ background: (counts[key] || 0) > 0 ? "var(--primary)" : "var(--border)", color: (counts[key] || 0) > 0 ? "var(--ink)" : "var(--muted)" }}>{counts[key] || 0}</span></div>
            <div className={`${syne} font-bold text-xs`}>{label}</div>
          </button>
        ))}
        <button onClick={() => setFilter("ALL")} className="rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5" style={{ borderColor: filter === "ALL" ? "var(--ink)" : "var(--border)" }}>
          <div className="text-xl mb-2">📋</div>
          <div className={`${syne} font-bold text-xs`}>All ({submissions.length})</div>
        </button>
      </div>

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">📋</div>
          <p className={`${syne} font-bold text-base mb-1`}>No submissions</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Form submissions will appear here when users submit forms</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const info = formLabels[s.type] || { label: s.type, icon: "📄" };
            const isExpanded = expanded === s.id;
            let parsedData: Record<string, string> = {};
            try { parsedData = JSON.parse(s.data); } catch { /* ignore */ }

            return (
              <div key={s.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => setExpanded(isExpanded ? null : s.id)} className="w-full flex items-center gap-4 p-5 text-left">
                  <span className="text-xl">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`${syne} font-bold text-sm`}>{s.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{info.label} · {s.email} · {new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge[s.status] || ""}`}>{s.status}</span>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      {Object.entries(parsedData).map(([key, value]) => (
                        <div key={key}><span className="font-medium" style={{ color: "var(--muted)" }}>{key}:</span> <span>{String(value)}</span></div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {s.status === "PENDING" && (
                        <>
                          <button onClick={() => updateStatus(s.id, "APPROVED")} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Approve</button>
                          <button onClick={() => updateStatus(s.id, "REJECTED")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Reject</button>
                        </>
                      )}
                      {(s.type === "MENTOR_ONBOARDING" || s.type === "COMPANY_ONBOARDING" || s.type === "INSTITUTION_ONBOARDING") && s.status !== "REJECTED" && (
                        <button onClick={() => createAccountFromForm(s)} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem] bg-green-100 text-green-700 hover:bg-green-200`}>
                          Create Account →
                        </button>
                      )}
                      <button onClick={() => updateStatus(s.id, "REVIEWED")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Mark Reviewed</button>
                    </div>
                    {accountMsg?.id === s.id && (
                      <div className={`mt-3 rounded-xl p-3 text-sm ${accountMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{accountMsg.text}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
