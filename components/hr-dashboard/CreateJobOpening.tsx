"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

const experienceLevels = ["Fresher", ...Array.from({ length: 30 }, (_, i) => `${i + 1} year${i + 1 > 1 ? "s" : ""}`)];
const urgencyOptions = ["Urgent (ASAP)", "Within 15 days", "Within 30 days", "More than 30 days"];
const workModes = ["On-site", "Remote", "Hybrid"];
const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"];

export default function CreateJobOpening({ companyName }: { companyName: string }) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Create Job Opening</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Post a new job to attract qualified candidates</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        {submitted && (
          <div className="rounded-xl p-4 text-sm font-medium" style={{ background: "rgba(232,255,71,0.15)", color: "var(--ink)", border: "1px solid var(--accent)" }}>
            Job posting feature coming soon. Your form data will be saved once the backend is connected.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Job Title */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Job Title *</label>
            <input type="text" placeholder="e.g. Cybersecurity Analyst L1" required className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>

          {/* Company — auto filled */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Company</label>
            <input type="text" value={companyName || ""} readOnly className="w-full rounded-xl border px-4 py-3 text-sm bg-gray-50 cursor-not-allowed" style={{ borderColor: "var(--border)", color: "var(--muted)" }} />
            <p className="text-[0.65rem] mt-1" style={{ color: "var(--muted)" }}>Auto-filled from your profile</p>
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Job Location *</label>
            <input type="text" placeholder="e.g. Bangalore, Mumbai" required className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>

          {/* Work Mode */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Work Mode *</label>
            <select required className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }}>
              <option value="">Select work mode</option>
              {workModes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Salary Min */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Salary Min (LPA)</label>
            <input type="number" placeholder="e.g. 3" min="0" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>

          {/* Salary Max */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Salary Max (LPA)</label>
            <input type="number" placeholder="e.g. 8" min="0" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>

          {/* Experience */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Experience Level *</label>
            <select required className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }}>
              <option value="">Select level</option>
              {experienceLevels.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Hiring Urgency *</label>
            <select required className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }}>
              <option value="">Select urgency</option>
              {urgencyOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Job Type */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Job Type *</label>
            <select required className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }}>
              <option value="">Select type</option>
              {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Department</label>
            <input type="text" placeholder="e.g. Engineering, Cybersecurity" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>

          {/* Skills Required */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Required Skills</label>
            <input type="text" placeholder="e.g. Python, SQL, AWS (comma separated)" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Job Description *</label>
          <textarea placeholder="Describe the role, responsibilities, and what you're looking for..." required rows={5} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors resize-none" style={{ borderColor: "var(--border)" }} />
        </div>

        {/* Perks */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Perks & Benefits</label>
          <textarea placeholder="e.g. Health insurance, WFH flexibility, learning budget..." rows={3} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors resize-none" style={{ borderColor: "var(--border)" }} />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
            Post Job Opening
          </button>
          <button type="button" className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm border transition-colors hover:bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
