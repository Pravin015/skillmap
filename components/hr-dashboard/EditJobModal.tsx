"use client";
// HR's edit-a-job modal. Covers the fields HR actually changes after
// publishing — title, description, salary, deadline, status, skills, etc.
// For lab changes / structural edits, delete + recreate is the path
// (those affect ApplyGate semantics and don't belong in a quick-edit flow).
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-xs font-medium mb-1 ${heading}`;

interface EditableJob {
  id: string;
  title: string;
  location: string;
  workMode: string;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevel: string;
  urgency: string;
  jobType: string;
  domain: string | null;
  department: string | null;
  description: string;
  perks: string | null;
  skills: string[];
  deadline: string | null;
  openings: number;
  status: string;
}

export default function EditJobModal({
  jobId,
  onClose,
  onSaved,
}: {
  jobId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [job, setJob] = useState<EditableJob | null>(null);
  const [skills, setSkills] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadJob(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [jobId]);

  async function loadJob() {
    try {
      const res = await fetch(`/api/jobs?id=${jobId}`);
      // /api/jobs doesn't filter by id today — pull from /api/jobs/[id].
      const r = await fetch(`/api/jobs/${jobId}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Couldn't load job"); return; }
      const j = d.job;
      setJob({
        id: j.id, title: j.title, location: j.location, workMode: j.workMode,
        salaryMin: j.salaryMin, salaryMax: j.salaryMax,
        experienceLevel: j.experienceLevel, urgency: j.urgency, jobType: j.jobType,
        domain: j.domain, department: j.department, description: j.description,
        perks: j.perks, skills: j.skills || [],
        deadline: j.deadline ? new Date(j.deadline).toISOString().slice(0, 10) : null,
        openings: j.openings, status: j.status,
      });
      setSkills((j.skills || []).join(", "));
      void res;
    } catch {
      setError("Couldn't load job — please close and retry.");
    }
  }

  function field<K extends keyof EditableJob>(key: K, value: EditableJob[K]) {
    setJob((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    setError(null); setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: job.title,
          location: job.location,
          workMode: job.workMode,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          experienceLevel: job.experienceLevel,
          urgency: job.urgency,
          jobType: job.jobType,
          domain: job.domain || "",
          department: job.department || "",
          description: job.description,
          perks: job.perks || "",
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          deadline: job.deadline,
          openings: job.openings,
          status: job.status,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Save failed"); return; }
      onSaved();
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-2xl bg-white w-full max-w-3xl my-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className={`${heading} font-bold text-lg`}>Edit Job Post</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--muted)" }}>×</button>
        </div>

        {!job ? (
          <div className="p-12 text-center">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>{error || "Loading..."}</p>
          </div>
        ) : (
          <form onSubmit={save} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={labelClass}>Title *</label>
                <input required value={job.title} onChange={(e) => field("title", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Location *</label>
                <input required value={job.location} onChange={(e) => field("location", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Work Mode *</label>
                <select value={job.workMode} onChange={(e) => field("workMode", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option>On-site</option><option>Remote</option><option>Hybrid</option>
                </select></div>
              <div><label className={labelClass}>Salary Min (LPA)</label>
                <input type="number" min={0} value={job.salaryMin ?? ""} onChange={(e) => field("salaryMin", e.target.value ? parseInt(e.target.value, 10) : null)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Salary Max (LPA)</label>
                <input type="number" min={0} value={job.salaryMax ?? ""} onChange={(e) => field("salaryMax", e.target.value ? parseInt(e.target.value, 10) : null)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Experience *</label>
                <input required value={job.experienceLevel} onChange={(e) => field("experienceLevel", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Urgency *</label>
                <select value={job.urgency} onChange={(e) => field("urgency", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option>Urgent (ASAP)</option><option>Within 15 days</option><option>Within 30 days</option><option>More than 30 days</option>
                </select></div>
              <div><label className={labelClass}>Job Type *</label>
                <select value={job.jobType} onChange={(e) => field("jobType", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                </select></div>
              <div><label className={labelClass}>Status</label>
                <select value={job.status} onChange={(e) => field("status", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option value="ACTIVE">Active</option><option value="CLOSED">Closed</option><option value="DRAFT">Draft</option><option value="UNDER_REVIEW">Under Review</option>
                </select></div>
              <div><label className={labelClass}>Department</label>
                <input value={job.department || ""} onChange={(e) => field("department", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Openings</label>
                <input type="number" min={1} value={job.openings} onChange={(e) => field("openings", parseInt(e.target.value, 10) || 1)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Deadline</label>
                <input type="date" value={job.deadline || ""} onChange={(e) => field("deadline", e.target.value || null)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </div>

            <div><label className={labelClass}>Skills (comma separated)</label>
              <input value={skills} onChange={(e) => setSkills(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={labelClass}>Description *</label>
              <textarea required rows={6} value={job.description} onChange={(e) => field("description", e.target.value)} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={labelClass}>Perks & Benefits</label>
              <input value={job.perks || ""} onChange={(e) => field("perks", e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>

            <div className="text-[11px] rounded-xl p-3" style={{ background: "var(--surface)", color: "var(--muted)" }}>
              💡 Lab gates aren&apos;t editable here — change those by deleting + recreating the post (deleted posts don&apos;t notify candidates, so apply pipelines stay clean).
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl ${heading} font-bold text-sm border`} style={{ borderColor: "var(--border)" }}>Cancel</button>
              <button type="submit" disabled={saving} className={`px-5 py-2 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
