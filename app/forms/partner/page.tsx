"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";
import { submitForm } from "@/lib/submit-form";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;

export default function PartnerForm() {
  const [submitted, setSubmitted] = useState(false);
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); const f = e.target as HTMLFormElement; const d = new FormData(f); const r = await submitForm("PARTNER", Object.fromEntries(d)); if (r.success) setSubmitted(true); }

  return (
    <FormWrapper
      eyebrow="Partnerships"
      title="Partner with us"
      subtitle="Join AstraaHire's ecosystem — whether you're a college, bootcamp, training provider, or technology partner."
      submitted={submitted}
      successMessage="Thank you for your interest in partnering with AstraaHire. Our partnerships team will contact you within 48 hours."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Organisation Name *</label>
            <input type="text" required placeholder="Your organisation" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Partnership Type *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select type</option>
              <option>College / University</option>
              <option>Bootcamp / Training Provider</option>
              <option>Technology Partner</option>
              <option>Content Partner</option>
              <option>Placement Agency</option>
              <option>Corporate Training</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Contact Person *</label>
            <input type="text" required placeholder="Full name" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Designation *</label>
            <input type="text" required placeholder="e.g. Dean, Head of Placements" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Official Email *</label>
            <input type="email" required placeholder="you@organisation.edu" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input type="tel" required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input type="url" placeholder="https://yourorganisation.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Number of Students / Users</label>
            <select className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select range</option>
              <option>Under 100</option><option>100–500</option><option>500–2,000</option><option>2,000–10,000</option><option>10,000+</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <input type="text" required placeholder="e.g. Bangalore" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>State *</label>
            <input type="text" required placeholder="e.g. Karnataka" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <div>
          <label className={labelClass}>What do you hope to achieve through this partnership? *</label>
          <textarea required placeholder="Describe your goals and how you'd like to collaborate with AstraaHire..." rows={4} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>
        <button type="submit" className="btn-primary">Submit partnership request</button>
      </form>
    </FormWrapper>
  );
}
