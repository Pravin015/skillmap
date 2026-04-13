"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";
import { getOfficialEmailError } from "@/lib/email-validation";
import { submitForm } from "@/lib/submit-form";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;

export default function MentorOnboardingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [compensation, setCompensation] = useState("");

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
    if (error) {
      setEmailError(error);
      return;
    }
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    const result = await submitForm("MENTOR_ONBOARDING", {
      name: d.get("name"), officialEmail: email, currentCompany: d.get("currentCompany"),
      currentDesignation: d.get("currentDesignation"), experience: d.get("experience"),
      domain: d.get("domain"), linkedin: d.get("linkedin"), phone: d.get("phone"),
      compensation, availability: d.get("availability"), topics: d.get("topics"),
      motivation: d.get("motivation"), email,
    });
    if (result.success) setSubmitted(true);
  }

  return (
    <FormWrapper
      title="Become a Mentor"
      subtitle="Help fresh graduates land their dream jobs. Share your industry experience and guide the next generation."
      submitted={submitted}
      successMessage="Thank you for signing up as a mentor! We'll verify your profile and reach out within 48 hours."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Notice */}
        <div className="rounded-xl p-4 text-sm border" style={{ background: "rgba(232,255,71,0.08)", borderColor: "rgba(10,191,188,0.3)" }}>
          <strong className={heading}>Official email required</strong> — We verify all mentors through their company email. Personal emails (Gmail, Yahoo, etc.) are not accepted.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input type="text" required placeholder="Your full name" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Official Email *</label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`${inputClass} ${emailError ? "!border-red-400" : ""}`}
              style={{ borderColor: emailError ? undefined : "var(--border)" }}
            />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
          </div>
          <div>
            <label className={labelClass}>Current Company *</label>
            <input type="text" required placeholder="e.g. TCS, Google, KPMG" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Current Designation *</label>
            <input type="text" required placeholder="e.g. Senior Analyst, Lead Engineer" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Years of Experience *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>2–4 years</option><option>4–6 years</option><option>6–10 years</option><option>10–15 years</option><option>15+ years</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Domain of Expertise *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              <option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting & Finance</option><option>Product Management</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>LinkedIn Profile *</label>
            <input type="url" required placeholder="https://linkedin.com/in/yourprofile" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input type="tel" required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>

        {/* Compensation */}
        <div>
          <label className={labelClass}>Compensation Preference *</label>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Mentors can choose to be paid or volunteer their time.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${compensation === "paid" ? "border-[var(--ink)] bg-[rgba(10,10,15,0.02)]" : ""}`}
              style={{ borderColor: compensation === "paid" ? "var(--ink)" : "var(--border)" }}
            >
              <input type="radio" name="compensation" value="paid" required checked={compensation === "paid"} onChange={() => setCompensation("paid")} className="mt-1 accent-[var(--ink)]" />
              <div>
                <div className={`${heading} font-bold text-sm`}>Paid Mentorship</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>You will be compensated for each session. Rates are set by SkillMap based on experience level.</div>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${compensation === "volunteer" ? "border-[var(--ink)] bg-[rgba(10,10,15,0.02)]" : ""}`}
              style={{ borderColor: compensation === "volunteer" ? "var(--ink)" : "var(--border)" }}
            >
              <input type="radio" name="compensation" value="volunteer" checked={compensation === "volunteer"} onChange={() => setCompensation("volunteer")} className="mt-1 accent-[var(--ink)]" />
              <div>
                <div className={`${heading} font-bold text-sm`}>Volunteer (Free)</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Contribute your time to help students. You&apos;ll receive recognition badges and a mentor profile on SkillMap.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className={labelClass}>Weekly Availability *</label>
          <div className="flex gap-3 flex-wrap">
            {["1–2 hours", "3–5 hours", "5–10 hours", "10+ hours"].map((h) => (
              <label key={h} className="flex items-center gap-1.5 text-sm cursor-pointer border rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                <input type="radio" name="availability" value={h} className="accent-[var(--ink)]" /> {h}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>What topics can you mentor on? *</label>
          <textarea required placeholder="e.g. Interview preparation, system design, career transition, resume review, specific certifications..." rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>

        <div>
          <label className={labelClass}>Why do you want to mentor? (Optional)</label>
          <textarea placeholder="Tell us your motivation..." rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>

        <button type="submit" className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--primary)", color: "white" }}>Submit Application</button>
      </form>
    </FormWrapper>
  );
}
