"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";
import { getOfficialEmailError, getEmailDomain } from "@/lib/email-validation";
import { submitForm } from "@/lib/submit-form";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;

export default function CompanyOnboardingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleEmailChange(value: string) {
    setEmail(value);
    if (value.includes("@")) {
      setEmailError(getOfficialEmailError(value));
    } else {
      setEmailError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = getOfficialEmailError(email);
    if (error) { setEmailError(error); return; }
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    const r = await submitForm("COMPANY_ONBOARDING", { ...Object.fromEntries(d), email });
    if (r.success) setSubmitted(true);
  }

  const domain = getEmailDomain(email);

  return (
    <FormWrapper
      eyebrow="For companies"
      title="Company onboarding"
      subtitle="Register your organisation on AstraaHire to post jobs, host hackathons, and access pre-assessed talent."
      submitted={submitted}
      successMessage="Your company registration is under review. We will verify your organisation through the official email domain and activate your account within 2-3 business days. You'll receive a confirmation email once verified."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Verification notice */}
        <div className="rounded-xl p-4 text-sm border" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          <strong className={`${heading} text-red-600`}>Verification Required</strong>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            Company accounts require verification of authenticity. You must use your official company email (no Gmail, Yahoo, etc.). Your account will be reviewed and activated manually by our team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Company / Organisation Name *</label>
            <input type="text" required placeholder="e.g. Tata Consultancy Services" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Industry *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select industry</option>
              <option>IT Services & Consulting</option><option>Big Tech / Product</option><option>BFSI</option><option>Telecom</option><option>Manufacturing</option><option>Healthcare</option><option>E-commerce</option><option>EdTech</option><option>Startup</option><option>Government / PSU</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Company Website *</label>
            <input type="url" required placeholder="https://company.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Company Size *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>1–50 employees</option><option>50–200</option><option>200–1,000</option><option>1,000–10,000</option><option>10,000–50,000</option><option>50,000+</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Headquarters Location *</label>
            <input type="text" required placeholder="e.g. Mumbai, Maharashtra" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Hiring Locations</label>
            <input type="text" placeholder="e.g. Bangalore, Pune, Hyderabad" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>

        <hr style={{ borderColor: "var(--border)" }} />

        <h3 className={`${heading} font-bold text-base`}>Admin Contact</h3>
        <p className="text-xs -mt-3" style={{ color: "var(--muted)" }}>This person will be the primary admin for your company on AstraaHire</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Admin Full Name *</label>
            <input type="text" required placeholder="Full name" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Designation *</label>
            <input type="text" required placeholder="e.g. HR Head, Talent Lead" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Official Email *</label>
            <input
              type="email"
              required
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`${inputClass} ${emailError ? "!border-red-400" : ""}`}
              style={{ borderColor: emailError ? undefined : "var(--border)" }}
            />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            {email && !emailError && domain && (
              <p className="text-xs mt-1" style={{ color: "#22c55e" }}>✓ We&apos;ll verify your organisation through @{domain}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input type="tel" required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>

        <hr style={{ borderColor: "var(--border)" }} />

        <h3 className={`${heading} font-bold text-base`}>Hiring Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Domains You Hire For *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Software Dev", "Cybersecurity", "Cloud & DevOps", "Data & Analytics", "Consulting", "Finance", "HR", "Other"].map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer border rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                  <input type="checkbox" className="accent-[var(--ink)]" /> {d}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Annual Fresher Hiring Volume</label>
            <select className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>1–10</option><option>10–50</option><option>50–200</option><option>200–1,000</option><option>1,000+</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Average Fresher Package (LPA)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
              <input type="number" placeholder="Max" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Fresher Friendly?</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="fresher" value="yes" className="accent-[var(--ink)]" /> Yes</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="fresher" value="no" className="accent-[var(--ink)]" /> No</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="fresher" value="some" className="accent-[var(--ink)]" /> Some roles</label>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Typical Interview Process</label>
          <textarea placeholder="e.g. Online test → Technical round → HR → Offer" rows={2} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>

        <div>
          <label className={labelClass}>Anything else we should know?</label>
          <textarea placeholder="Special requirements, preferred source of candidates, etc." rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" required className="mt-1 accent-[var(--ink)]" />
          <span style={{ color: "var(--muted)" }}>I confirm that I am authorised to register this company on AstraaHire and that the information provided is accurate. I understand the account will be activated only after verification.</span>
        </label>

        <button type="submit" className="btn-primary">Submit for verification</button>
      </form>
    </FormWrapper>
  );
}
