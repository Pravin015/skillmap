"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]";

const roles = [
  { key: "STUDENT", label: "Student / Aspirant" },
  { key: "ORG", label: "Organisation" },
];

const degrees = ["B.Tech/BE", "BCA", "B.Sc", "BBA", "B.Com", "BA", "MBA", "MCA", "Other"];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "STUDENT";

  const [step, setStep] = useState(1); // 1 = signup, 1.5 = OTP verify, 2 = profile creation
  const [activeRole, setActiveRole] = useState(initialRole === "ORG" ? "ORG" : "STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [organisation, setOrganisation] = useState("");

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 2 fields (student profile)
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [fieldOfInterest, setFieldOfInterest] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("FRESHER");
  const [skills, setSkills] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bio, setBio] = useState("");

  async function handleSendOTP() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setOtpSent(true); setLoading(false);
    } catch { setError("Failed to send OTP"); setLoading(false); }
  }

  async function handleVerifyOTP() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setOtpVerified(true); setLoading(false);
    } catch { setError("Verification failed"); setLoading(false); }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Step 1a: Send OTP if not sent yet
    if (!otpSent) { handleSendOTP(); return; }
    // Step 1b: Verify OTP if not verified yet
    if (!otpVerified) { handleVerifyOTP(); return; }

    // Step 1c: OTP verified — create account
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeRole === "ORG" ? organisation : name,
          email, password, role: activeRole,
          organisation: activeRole === "ORG" ? organisation : undefined, phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }

      const loginRes = await signIn("credentials", { redirect: false, email, password, role: activeRole });
      if (loginRes?.error) { setError("Account created but login failed. Please login manually."); setLoading(false); return; }

      if (activeRole === "STUDENT") {
        setStep(2);
        setLoading(false);
      } else {
        window.location.href = "/company-dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName,
          experienceLevel,
          fieldOfInterest,
          bio,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          githubUrl: githubUrl || undefined,
          linkedinUrl: linkedinUrl || undefined,
          academicScore: undefined,
          academicType: undefined,
        }),
      });

      if (!res.ok) { setError("Failed to save profile"); setLoading(false); return; }

      // Upload photo if selected
      if (profilePhoto) {
        await fetch("/api/profile/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: profilePhoto }) }).catch(() => {});
      }

      // If user came from landing page chat bar, redirect to AI advisor
      const pendingQuery = sessionStorage.getItem("skillmap_query");
      window.location.href = pendingQuery ? "/chat" : "/dashboard";
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={`${syne} font-extrabold text-2xl`} style={{ color: "var(--ink)" }}>
            {step === 1 ? "Create your account" : "Complete your profile"}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            {step === 1 ? "Join SkillMap and start your journey" : "Help us match you with the right opportunities"}
          </p>
          {step === 2 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-8 h-1 rounded-full" style={{ background: "var(--accent)" }} />
              <div className="w-8 h-1 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>Step 2 of 2</span>
            </div>
          )}
        </div>

        {step === 1 && (
          <>
            {/* Role tabs */}
            <div className="mb-6 flex rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "white" }}>
              {roles.map((role) => (
                <button key={role.key} onClick={() => { setActiveRole(role.key); setError(""); }}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${syne}`}
                  style={{ background: activeRole === role.key ? "var(--ink)" : "transparent", color: activeRole === role.key ? "var(--accent)" : "var(--muted)" }}>
                  {role.label}
                </button>
              ))}
            </div>

            {/* HR notice */}
            {initialRole === "HR" && (
              <div className="rounded-xl p-4 text-sm border mb-6" style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
                <strong className={syne}>HR accounts are managed by organisations.</strong>
                <p className="mt-1" style={{ color: "var(--muted)" }}>Ask your company admin to create your account from the Company Dashboard.</p>
              </div>
            )}

            <form onSubmit={handleStep1} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--ink)" }} />

              {error && <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

              <div className="space-y-4">
                {activeRole === "STUDENT" && (
                  <>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Full name *</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Email *</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Phone *</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Password *</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  </>
                )}
                {activeRole === "ORG" && (
                  <>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Organisation name *</label>
                      <input type="text" value={organisation} onChange={(e) => setOrganisation(e.target.value)} required placeholder="Company / Institute name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Admin email *</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@company.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Phone *</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Password *</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  </>
                )}
              </div>

              {/* OTP Section */}
              {otpSent && !otpVerified && (
                <div className="mt-4 rounded-xl p-4 border" style={{ background: "rgba(232,255,71,0.05)", borderColor: "rgba(232,255,71,0.2)" }}>
                  <p className={`${syne} font-bold text-sm mb-2`}>Enter verification code</p>
                  <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>We sent a 6-digit code to <strong>{email}</strong></p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit code" maxLength={6} className={`${inputClass} text-center text-lg tracking-[0.3em] font-bold`} style={{ borderColor: "var(--border)" }} />
                  <button type="button" onClick={handleSendOTP} className="text-xs mt-2 block" style={{ color: "var(--muted)" }}>Didn&apos;t receive? Resend</button>
                </div>
              )}
              {otpVerified && (
                <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>
                  ✓ Email verified
                </div>
              )}

              <button type="submit" disabled={loading} className={`mt-4 w-full py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
                {loading ? "Please wait..." : !otpSent ? "Send verification code" : !otpVerified ? "Verify & continue" : activeRole === "STUDENT" ? "Create account →" : "Create account"}
              </button>

              <p className="mt-4 text-center text-sm" style={{ color: "var(--muted)" }}>
                Already have an account?{" "}
                <Link href={`/auth/login?role=${activeRole}`} className={`font-bold no-underline ${syne}`} style={{ color: "var(--ink)" }}>Sign in</Link>
              </p>
            </form>
          </>
        )}

        {step === 2 && activeRole === "STUDENT" && (
          <form onSubmit={handleStep2} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <div className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl" style={{ background: "var(--accent)" }} />

            {error && <div className="rounded-xl p-3 text-sm mb-4" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

            <div className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Profile Photo *</label>
                <div className="flex items-center gap-4">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "var(--border)" }}>📷</div>
                  )}
                  <label className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs cursor-pointer`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
                    {profilePhoto ? "Change photo" : "Upload photo"}
                    <input type="file" accept="image/*" className="hidden" required={!profilePhoto} onChange={(e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      if (f.size > 500 * 1024) { alert("Max 500KB"); return; }
                      const reader = new FileReader();
                      reader.onload = () => setProfilePhoto(reader.result as string);
                      reader.readAsDataURL(f);
                    }} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>College / University *</label>
                  <input type="text" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} required placeholder="e.g. IIT Bombay" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Degree *</label>
                  <select value={degree} onChange={(e) => setDegree(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }}>
                    <option value="">Select</option>{degrees.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Graduation Year *</label>
                  <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }}>
                    <option value="">Select</option><option>2024</option><option>2025</option><option>2026</option><option>2027</option>
                  </select></div>
                <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Experience Level *</label>
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                    <option value="FRESHER">Fresher</option><option value="EXPERIENCED">Experienced</option>
                  </select></div>
              </div>
              <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Field of Interest *</label>
                <select value={fieldOfInterest} onChange={(e) => setFieldOfInterest(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option value="">Select your domain</option>
                  <option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting & Finance</option><option>Product Management</option><option>Other</option>
                </select></div>
              <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Skills *</label>
                <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} required placeholder="Python, SQL, AWS (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>Short Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell recruiters about yourself in 2-3 sentences..." rows={2} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>LinkedIn</label>
                  <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/..." className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                <div><label className={`block text-sm font-medium mb-1.5 ${syne}`}>GitHub</label>
                  <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="github.com/..." className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`mt-6 w-full py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
              {loading ? "Saving..." : "Complete & Go to Dashboard →"}
            </button>

            <button type="button" onClick={() => { window.location.href = "/dashboard"; }} className={`mt-2 w-full py-2.5 rounded-xl text-sm ${syne} font-medium`} style={{ color: "var(--muted)" }}>
              Skip for now
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
