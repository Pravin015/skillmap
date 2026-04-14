"use client";
import { useState } from "react";
import FormWrapper from "@/components/FormWrapper";
import { submitForm } from "@/lib/submit-form";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    const result = await submitForm("CONTACT", { name: d.get("name"), email: d.get("email"), phone: d.get("phone"), subject: d.get("subject"), message: d.get("message") });
    if (result.success) setSubmitted(true);
  }

  return (
    <FormWrapper
      title="Contact Us"
      subtitle="Have questions, feedback, or need help? Reach out and we'll get back to you within 24 hours."
      submitted={submitted}
      successMessage="Thank you for reaching out. Our team will respond to your message within 24 hours."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input type="text" required placeholder="Your name" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" required placeholder="you@example.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Subject *</label>
            <select required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select topic</option>
              <option>General Inquiry</option>
              <option>Technical Support</option>
              <option>Billing & Payments</option>
              <option>Partnership</option>
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>I am a *</label>
          <div className="flex gap-3 flex-wrap">
            {["Student", "HR / Recruiter", "Organisation", "Mentor", "College / Institute", "Other"].map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value={r} className="accent-[var(--ink)]" />
                {r}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Message *</label>
          <textarea required placeholder="Tell us how we can help..." rows={5} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>
        <button type="submit" className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--primary)", color: "white" }}>Send Message</button>
      </form>
    </FormWrapper>
  );
}
