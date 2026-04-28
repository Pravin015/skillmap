"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";
import { submitForm } from "@/lib/submit-form";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;
const experienceLevels = ["Fresher", ...Array.from({ length: 30 }, (_, i) => `${i + 1} year${i + 1 > 1 ? "s" : ""}`)];

export default function JobPostingForm() {
  const [submitted, setSubmitted] = useState(false);
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); const f = e.target as HTMLFormElement; const d = new FormData(f); const r = await submitForm("JOB_POSTING", Object.fromEntries(d)); if (r.success) setSubmitted(true); }

  return (
    <FormWrapper
      eyebrow="Hiring"
      title="Post a job opening"
      subtitle="Fill in the details below to list your job opening on AstraaHire and reach thousands of qualified graduates."
      submitted={submitted}
      successMessage="Your job posting has been received. Our team will review and publish it within 24 hours."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Job Title *</label>
            <input type="text" required placeholder="e.g. Cybersecurity Analyst" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Company Name *</label>
            <input type="text" required placeholder="e.g. TCS" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Contact Email *</label>
            <input type="email" required placeholder="hr@company.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input type="tel" placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Job Location *</label>
            <input type="text" required placeholder="e.g. Bangalore, Pune" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Work Mode *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>On-site</option><option>Remote</option><option>Hybrid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Salary Range (LPA)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
              <input type="number" placeholder="Max" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Experience Level *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              {experienceLevels.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Hiring Urgency *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>Urgent (ASAP)</option><option>Within 15 days</option><option>Within 30 days</option><option>More than 30 days</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Job Type *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Domain *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Number of Openings</label>
            <input type="number" placeholder="e.g. 5" min="1" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Required Skills</label>
          <input type="text" placeholder="e.g. Python, SQL, AWS (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} />
        </div>
        <div>
          <label className={labelClass}>Job Description *</label>
          <textarea required placeholder="Describe the role, responsibilities, and requirements..." rows={5} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>
        <div>
          <label className={labelClass}>Application Deadline</label>
          <input type="date" className={inputClass} style={{ borderColor: "var(--border)" }} />
        </div>
        <button type="submit" className="btn-primary">Submit job posting</button>
      </form>
    </FormWrapper>
  );
}
