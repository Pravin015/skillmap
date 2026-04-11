"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${syne}`;
const experienceLevels = ["Fresher", ...Array.from({ length: 30 }, (_, i) => `${i + 1} year${i + 1 > 1 ? "s" : ""}`)];

export default function CreateJobOpening({ companyName }: { companyName: string }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          company: companyName,
          location: data.get("location"),
          workMode: data.get("workMode"),
          salaryMin: data.get("salaryMin"),
          salaryMax: data.get("salaryMax"),
          experienceLevel: data.get("experienceLevel"),
          urgency: data.get("urgency"),
          jobType: data.get("jobType"),
          domain: data.get("domain"),
          department: data.get("department"),
          description: data.get("description"),
          skills: (data.get("skills") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [],
          perks: data.get("perks"),
          deadline: data.get("deadline"),
          openings: data.get("openings"),
        }),
      });
      const result = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: result.error }); return; }
      setMessage({ type: "success", text: `Job "${result.job.title}" posted successfully!` });
      form.reset();
    } catch { setMessage({ type: "error", text: "Failed to post job" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Create Job Opening</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Post a new job — it will be live immediately for candidates</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        {message && (
          <div className={`rounded-xl p-4 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Job Title *</label>
            <input name="title" type="text" required placeholder="e.g. Cybersecurity Analyst L1" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input type="text" value={companyName || ""} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed`} style={{ borderColor: "var(--border)", color: "var(--muted)" }} />
          </div>
          <div>
            <label className={labelClass}>Location *</label>
            <input name="location" type="text" required placeholder="e.g. Bangalore, Mumbai" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Work Mode *</label>
            <select name="workMode" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>On-site</option><option>Remote</option><option>Hybrid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Salary Min (LPA)</label>
            <input name="salaryMin" type="number" placeholder="e.g. 3" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Salary Max (LPA)</label>
            <input name="salaryMax" type="number" placeholder="e.g. 8" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Experience *</label>
            <select name="experienceLevel" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              {experienceLevels.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Urgency *</label>
            <select name="urgency" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>Urgent (ASAP)</option><option>Within 15 days</option><option>Within 30 days</option><option>More than 30 days</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Job Type *</label>
            <select name="jobType" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Domain</label>
            <select name="domain" className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input name="department" type="text" placeholder="e.g. Engineering" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Openings</label>
            <input name="openings" type="number" placeholder="e.g. 5" min="1" defaultValue="1" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Required Skills</label>
          <input name="skills" type="text" placeholder="Python, SQL, AWS (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} />
        </div>
        <div>
          <label className={labelClass}>Job Description *</label>
          <textarea name="description" required placeholder="Describe the role..." rows={5} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Application Deadline</label>
            <input name="deadline" type="date" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Perks & Benefits</label>
            <input name="perks" type="text" placeholder="e.g. WFH, health insurance" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <button type="submit" disabled={saving} className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
          {saving ? "Posting..." : "Post Job Opening"}
        </button>
      </form>
    </div>
  );
}
