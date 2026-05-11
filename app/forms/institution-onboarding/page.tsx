"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";
import { getOfficialEmailError } from "@/lib/email-validation";
import { submitForm } from "@/lib/submit-form";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;

export default function InstitutionOnboardingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleEmailChange(v: string) { setEmail(v); if (v.includes("@")) setEmailError(getOfficialEmailError(v)); else setEmailError(null); }
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); const err = getOfficialEmailError(email); if (err) { setEmailError(err); return; } const form = e.target as HTMLFormElement; const d = new FormData(form); const r = await submitForm("INSTITUTION_ONBOARDING", { ...Object.fromEntries(d), email }); if (r.success) setSubmitted(true); }

  return (
    <FormWrapper eyebrow="For institutions" title="Institution onboarding" subtitle="Register your college, university, or training institute on AstraaHire. No public signup — our team will verify and activate your account." submitted={submitted} successMessage="Your institution registration is under review. We will verify through your official email domain and activate your account within 2-3 business days. You'll receive a confirmation email once approved.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl p-4 text-sm border" style={{ background: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
          <strong className={`${heading} text-[#7C3AED]`}>Manual Onboarding</strong>
          <p className="mt-1" style={{ color: "var(--muted)" }}>Institution accounts are verified manually. Official email required. No self-signup.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelClass}>Institution Name *</label><input type="text" required placeholder="e.g. IIT Bombay" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Institution Type *</label><select required className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>University</option><option>Engineering College</option><option>Arts & Science College</option><option>Management Institute</option><option>Bootcamp / Training</option><option>Coaching Institute</option><option>Other</option></select></div>
          <div><label className={labelClass}>Website *</label><input type="url" required placeholder="https://college.edu.in" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Location (City, State) *</label><input type="text" required placeholder="e.g. Pune, Maharashtra" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Total Students</label><select className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>Under 500</option><option>500–2,000</option><option>2,000–5,000</option><option>5,000–10,000</option><option>10,000+</option></select></div>
          <div><label className={labelClass}>Departments / Streams</label><input type="text" placeholder="e.g. CSE, ECE, MBA (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
        </div>
        <hr style={{ borderColor: "var(--border)" }} />
        <h3 className={`${heading} font-bold text-base`}>Contact Person</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelClass}>Full Name *</label><input type="text" required placeholder="Placement officer / Dean" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Designation *</label><input type="text" required placeholder="e.g. Head of Placements" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Official Email *</label>
            <input type="email" required placeholder="contact@college.edu.in" value={email} onChange={(e) => handleEmailChange(e.target.value)} className={`${inputClass} ${emailError ? "!border-red-400" : ""}`} style={{ borderColor: emailError ? undefined : "var(--border)" }} />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
          </div>
          <div><label className={labelClass}>Phone *</label><input type="tel" required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
        </div>
        <hr style={{ borderColor: "var(--border)" }} />
        <h3 className={`${heading} font-bold text-base`}>Placement Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={labelClass}>Current Placement Rate</label><select className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>Below 30%</option><option>30–50%</option><option>50–70%</option><option>70–90%</option><option>90%+</option></select></div>
          <div><label className={labelClass}>Top Recruiters</label><input type="text" placeholder="e.g. TCS, Infosys, Wipro" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
        </div>
        <div><label className={labelClass}>What do you expect from AstraaHire?</label><textarea placeholder="How can we help improve your placement outcomes?" rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
        <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="checkbox" required className="mt-1 accent-[var(--ink)]" /><span style={{ color: "var(--muted)" }}>I confirm I am authorised to register this institution and the information provided is accurate. I understand the account will be activated only after verification.</span></label>
        <button type="submit" className="btn-primary">Submit for review</button>
      </form>
    </FormWrapper>
  );
}
