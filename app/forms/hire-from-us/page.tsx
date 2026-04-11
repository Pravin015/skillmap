"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";

const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${syne}`;

export default function HireFromUsForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <FormWrapper
      title="Hire From Us"
      subtitle="Access SkillMap's pool of pre-assessed, job-ready graduates matched to your requirements."
      submitted={submitted}
      successMessage="Thank you! Our hiring solutions team will reach out within 24 hours to discuss your requirements."
    >
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input type="text" required placeholder="Your company" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Industry *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select industry</option>
              <option>IT Services</option><option>Consulting</option><option>BFSI</option><option>Big Tech</option><option>Product Company</option><option>Startup</option><option>Government / PSU</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Contact Person *</label>
            <input type="text" required placeholder="Full name" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Designation *</label>
            <input type="text" required placeholder="e.g. HR Manager, CTO" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Official Email *</label>
            <input type="email" required placeholder="you@company.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input type="tel" required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Domains You're Hiring For *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Software Dev", "Cybersecurity", "Cloud & DevOps", "Data & Analytics", "Consulting", "Other"].map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer border rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                  <input type="checkbox" className="accent-[var(--ink)]" /> {d}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Number of Hires Needed *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>1–5</option><option>5–20</option><option>20–50</option><option>50–100</option><option>100+</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Experience Level Needed *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>Freshers only</option><option>0–2 years</option><option>2–5 years</option><option>Mixed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Hiring Timeline *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>Immediately</option><option>Within 1 month</option><option>1–3 months</option><option>3+ months</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Additional Requirements</label>
          <textarea placeholder="Any specific skills, certifications, or other requirements..." rows={4} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>
        <button type="submit" className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Submit Hiring Request</button>
      </form>
    </FormWrapper>
  );
}
