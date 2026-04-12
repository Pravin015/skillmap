"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const syne = "font-[family-name:var(--font-syne)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${syne}`;

interface Exp { company: string; role: string; startDate: string; endDate: string; description: string; current: boolean }
interface Cert { title: string; issuer: string; issueDate: string; imageUrl: string }

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileNumber, setProfileNumber] = useState("");
  const userRole = (session?.user as { role?: string })?.role;

  // Account
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mentor
  const [headline, setHeadline] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [areaOfExpertise, setAreaOfExpertise] = useState("");
  const [mentorTopics, setMentorTopics] = useState("");
  const [compensation, setCompensation] = useState("PAID");
  const [sessionRate, setSessionRate] = useState("");
  const [groupSessionRate, setGroupSessionRate] = useState("");
  const [availability, setAvailability] = useState("");
  const [mentorNumber, setMentorNumber] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [mentorLinkedin, setMentorLinkedin] = useState("");
  const [mentorCollege, setMentorCollege] = useState("");

  // Student
  const [collegeName, setCollegeName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("FRESHER");
  const [fieldOfInterest, setFieldOfInterest] = useState("");
  const [bio, setBio] = useState("");
  const [academicScore, setAcademicScore] = useState("");
  const [academicType, setAcademicType] = useState("CGPA");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [availableToJoin, setAvailableToJoin] = useState(true);
  const [joinDate, setJoinDate] = useState("Immediately");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<Exp[]>([]);
  const [certifications, setCertifications] = useState<Cert[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/account").then((r) => r.json()).then((d) => {
        if (d.user) { setName(d.user.name); setPhone(d.user.phone || ""); setOrganisation(d.user.organisation || ""); setProfileImage(d.user.profileImage); }
      });
      if (userRole === "STUDENT") {
        fetch("/api/profile").then((r) => r.json()).then((d) => {
          if (d.profile) {
            const p = d.profile;
            setProfileNumber(p.profileNumber || "");
            setCollegeName(p.collegeName || ""); setExperienceLevel(p.experienceLevel || "FRESHER");
            setFieldOfInterest(p.fieldOfInterest || ""); setBio(p.bio || "");
            setAcademicScore(p.academicScore || ""); setAcademicType(p.academicType || "CGPA");
            setSalaryMin(p.salaryMin?.toString() || ""); setSalaryMax(p.salaryMax?.toString() || "");
            setAvailableToJoin(p.availableToJoin ?? true); setJoinDate(p.joinDate || "Immediately");
            setGithubUrl(p.githubUrl || ""); setLinkedinUrl(p.linkedinUrl || ""); setPortfolioUrl(p.portfolioUrl || "");
            setSkills((p.skills || []).join(", ")); setExperiences(p.experiences || []); setCertifications(p.certifications || []);
          }
        }).finally(() => setLoading(false));
      } else if (userRole === "MENTOR") {
        fetch("/api/mentor/profile").then((r) => r.json()).then((d) => {
          if (d.profile) {
            const p = d.profile;
            setMentorNumber(p.mentorNumber || ""); setHeadline(p.headline || ""); setMentorBio(p.bio || "");
            setCurrentCompany(p.currentCompany || ""); setCurrentRole(p.currentRole || "");
            setYearsExp(p.yearsOfExperience?.toString() || ""); setMentorCollege(p.collegeName || "");
            setAreaOfExpertise((p.areaOfExpertise || []).join(", "));
            setMentorTopics((p.mentorTopics || []).join(", "));
            setCompensation(p.compensation || "PAID");
            setSessionRate(p.sessionRate?.toString() || ""); setGroupSessionRate(p.groupSessionRate?.toString() || "");
            setAvailability(p.availability || ""); setMentorLinkedin(p.linkedinUrl || "");
          }
        }).finally(() => setLoading(false));
      } else { setLoading(false); }
    }
  }, [status, userRole, router]);

  async function handlePhotoUpload(file: File) {
    if (file.size > 500 * 1024) { alert("Max 500KB"); return; }
    const reader = new FileReader();
    reader.onload = async () => { const b = reader.result as string; await fetch("/api/profile/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: b }) }); setProfileImage(b); };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSaved(false);
    await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
    if (userRole === "STUDENT") {
      const r = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeName, experienceLevel, fieldOfInterest, bio, academicScore, academicType, salaryMin, salaryMax, availableToJoin, joinDate, githubUrl, linkedinUrl, portfolioUrl, otherLinks: [], skills: skills.split(",").map((s) => s.trim()).filter(Boolean), experiences, certifications }),
      }).then((r) => r.json());
      if (r.profile) setProfileNumber(r.profile.profileNumber);
    }
    if (userRole === "MENTOR") {
      await fetch("/api/mentor/profile", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, bio: mentorBio, currentCompany, currentRole, collegeName: mentorCollege, yearsOfExperience: yearsExp, areaOfExpertise: areaOfExpertise.split(",").map((s) => s.trim()).filter(Boolean), mentorTopics: mentorTopics.split(",").map((s) => s.trim()).filter(Boolean), compensation, sessionRate, groupSessionRate, availability, linkedinUrl: mentorLinkedin }),
      });
    }
    setSaved(true); setSaving(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSaved(false), 5000);
  }

  function addExp() { setExperiences([...experiences, { company: "", role: "", startDate: "", endDate: "", description: "", current: false }]); }
  function updExp(i: number, f: string, v: string | boolean) { const u = [...experiences]; (u[i] as unknown as Record<string, string | boolean>)[f] = v; setExperiences(u); }
  function rmExp(i: number) { setExperiences(experiences.filter((_, idx) => idx !== i)); }
  function addCert() { setCertifications([...certifications, { title: "", issuer: "", issueDate: "", imageUrl: "" }]); }
  function updCert(i: number, f: string, v: string) { const u = [...certifications]; (u[i] as unknown as Record<string, string>)[f] = v; setCertifications(u); }
  function rmCert(i: number) { setCertifications(certifications.filter((_, idx) => idx !== i)); }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  const roleLabel = userRole === "HR" ? "HR" : userRole === "ORG" ? "Company" : userRole === "INSTITUTION" ? "Institution" : userRole === "ADMIN" ? "Admin" : "Student";

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className={`${syne} font-extrabold text-2xl`}>Edit {roleLabel} Profile</h1>
            {profileNumber && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>ID: <span className={`${syne} font-bold`}>{profileNumber}</span></p>}</div>
          <div className="flex gap-2">
            {profileNumber && <button onClick={() => router.push(`/profile/${profileNumber}`)} className={`px-3 py-2 rounded-xl ${syne} font-bold text-xs border hover:bg-gray-50`} style={{ borderColor: "var(--border)" }}>View profile</button>}
            <a href="/settings" className={`px-3 py-2 rounded-xl ${syne} font-bold text-xs border no-underline hover:bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Settings</a>
          </div>
        </div>

        {saved && <div className="rounded-xl p-4 text-sm font-medium mb-6" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }}>Profile saved!</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Profile Photo</h2>
            <div className="flex items-center gap-4">
              {profileImage ? <img src={profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover" /> : <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${syne} font-extrabold text-2xl text-white`} style={{ background: "var(--ink)" }}>{name.charAt(0)?.toUpperCase()}</div>}
              <div><button type="button" onClick={() => fileRef.current?.click()} className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>{profileImage ? "Change" : "Upload"}</button><p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Max 500KB</p></div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
            </div>
          </div>

          {/* Basic — all roles */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={labelClass}>Full Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              {(userRole === "HR" || userRole === "ORG" || userRole === "INSTITUTION") && <div><label className={labelClass}>Organisation</label><input value={organisation} readOnly className={`${inputClass} bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--muted)" }} /></div>}
            </div>
          </div>

          {/* ═══ STUDENT ONLY ═══ */}
          {userRole === "STUDENT" && (
            <>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Education & Domain</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>College</label><input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Level</label><select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="FRESHER">Fresher</option><option value="EXPERIENCED">Experienced</option></select></div>
                  <div><label className={labelClass}>Domain</label><select value={fieldOfInterest} onChange={(e) => setFieldOfInterest(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting & Finance</option><option>Other</option></select></div>
                  <div><label className={labelClass}>Skills</label><input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="comma separated" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                </div>
                <div className="mt-4"><label className={labelClass}>Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
              </div>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Academic</h2>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className={labelClass}>Type</label><select value={academicType} onChange={(e) => setAcademicType(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option>CGPA</option><option>Percentage</option><option>GPA</option></select></div>
                  <div><label className={labelClass}>Score</label><input value={academicScore} onChange={(e) => setAcademicScore(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Preferences</h2>
                <div className="grid grid-cols-2 gap-5">
                  <div><label className={labelClass}>Salary Min (LPA)</label><input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Salary Max (LPA)</label><input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Available</label><select value={availableToJoin ? "yes" : "no"} onChange={(e) => setAvailableToJoin(e.target.value === "yes")} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="yes">Yes</option><option value="no">No</option></select></div>
                  <div><label className={labelClass}>Notice</label><select value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option>Immediately</option><option>15 days</option><option>30 days</option><option>60 days+</option></select></div>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div><label className={labelClass}>GitHub</label><input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>LinkedIn</label><input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Portfolio</label><input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                </div>
              </div>
              {experienceLevel === "EXPERIENCED" && (
                <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-4"><h2 className={`${syne} font-bold text-base`}>Experience</h2><button type="button" onClick={addExp} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ Add</button></div>
                  {experiences.length === 0 ? <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>None added</p> : <div className="space-y-3">{experiences.map((x, i) => (
                    <div key={i} className="rounded-xl border p-4 relative" style={{ borderColor: "var(--border)" }}>
                      <button type="button" onClick={() => rmExp(i)} className="absolute top-2 right-2 text-red-400 text-sm">✕</button>
                      <div className="grid grid-cols-2 gap-3"><input value={x.company} onChange={(e) => updExp(i, "company", e.target.value)} placeholder="Company" className={inputClass} style={{ borderColor: "var(--border)" }} /><input value={x.role} onChange={(e) => updExp(i, "role", e.target.value)} placeholder="Role" className={inputClass} style={{ borderColor: "var(--border)" }} /><input value={x.startDate} onChange={(e) => updExp(i, "startDate", e.target.value)} placeholder="Start" className={inputClass} style={{ borderColor: "var(--border)" }} /><input value={x.endDate} onChange={(e) => updExp(i, "endDate", e.target.value)} placeholder="End" disabled={x.current} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                      <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer" style={{ color: "var(--muted)" }}><input type="checkbox" checked={x.current} onChange={(e) => updExp(i, "current", e.target.checked)} /> Current</label>
                    </div>
                  ))}</div>}
                </div>
              )}
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-4"><h2 className={`${syne} font-bold text-base`}>Certifications</h2><button type="button" onClick={addCert} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ Add</button></div>
                {certifications.length === 0 ? <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>None added</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{certifications.map((c, i) => (
                  <div key={i} className="rounded-xl border p-4 relative" style={{ borderColor: "var(--border)" }}>
                    <button type="button" onClick={() => rmCert(i)} className="absolute top-2 right-2 text-red-400 text-sm">✕</button>
                    <input value={c.title} onChange={(e) => updCert(i, "title", e.target.value)} placeholder="Title" className={`${inputClass} mb-2`} style={{ borderColor: "var(--border)" }} />
                    <input value={c.issuer} onChange={(e) => updCert(i, "issuer", e.target.value)} placeholder="Issuer" className={`${inputClass} mb-2`} style={{ borderColor: "var(--border)" }} />
                    <input value={c.issueDate} onChange={(e) => updCert(i, "issueDate", e.target.value)} placeholder="Date" className={inputClass} style={{ borderColor: "var(--border)" }} />
                  </div>
                ))}</div>}
              </div>
            </>
          )}

          {/* ═══ MENTOR ONLY ═══ */}
          {userRole === "MENTOR" && (
            <>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Mentor Profile</h2>
                {mentorNumber && <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Mentor ID: <span className={`${syne} font-bold`}>{mentorNumber}</span></p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2"><label className={labelClass}>Headline</label><input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Senior Cybersecurity Analyst at TCS" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Current Company *</label><input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Current Role *</label><input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Years of Experience</label><input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} min="0" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>College / University</label><input value={mentorCollege} onChange={(e) => setMentorCollege(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                </div>
                <div className="mt-4"><label className={labelClass}>Bio</label><textarea value={mentorBio} onChange={(e) => setMentorBio(e.target.value)} placeholder="Tell students about your experience..." rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
              </div>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Expertise & Topics</h2>
                <div className="space-y-4">
                  <div><label className={labelClass}>Areas of Expertise</label><input value={areaOfExpertise} onChange={(e) => setAreaOfExpertise(e.target.value)} placeholder="Cybersecurity, Cloud, Data (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>Topics I Can Help With</label><input value={mentorTopics} onChange={(e) => setMentorTopics(e.target.value)} placeholder="Interview prep, Resume review, Career switch (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  <div><label className={labelClass}>LinkedIn</label><input type="url" value={mentorLinkedin} onChange={(e) => setMentorLinkedin(e.target.value)} placeholder="linkedin.com/in/..." className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${syne} font-bold text-base mb-4`}>Session Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>Compensation Type</label><select value={compensation} onChange={(e) => setCompensation(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="PAID">Paid</option><option value="VOLUNTEER">Volunteer (Free)</option></select></div>
                  <div><label className={labelClass}>Availability</label><input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. 5 hours/week" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                  {compensation === "PAID" && (
                    <>
                      <div><label className={labelClass}>1-on-1 Rate (₹ per session)</label><input type="number" value={sessionRate} onChange={(e) => setSessionRate(e.target.value)} placeholder="e.g. 500" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                      <div><label className={labelClass}>Group Rate (₹ per session)</label><input type="number" value={groupSessionRate} onChange={(e) => setGroupSessionRate(e.target.value)} placeholder="e.g. 300" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Non-student role info */}
          {userRole && userRole !== "STUDENT" && (
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className={`${syne} font-bold text-base mb-3`}>Your Role: {roleLabel}</h2>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                {userRole === "HR" && "Manage job posts and candidates from the HR Panel."}
                {userRole === "ORG" && "Manage HR accounts and hiring from the Company Dashboard."}
                {userRole === "INSTITUTION" && "Manage students and placements from the Institution Dashboard."}
                {userRole === "ADMIN" && "Full platform control from the Admin Panel."}
              </p>
              <div className="flex gap-2 flex-wrap">
                {userRole === "HR" && <a href="/hr-dashboard" className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>HR Panel</a>}
                {userRole === "ORG" && <a href="/company-dashboard" className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Company Dashboard</a>}
                {userRole === "INSTITUTION" && <a href="/institution-dashboard" className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Institution Dashboard</a>}
                {userRole === "ADMIN" && <a href="/admin" className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Admin Panel</a>}
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className={`px-8 py-3 rounded-xl ${syne} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>{saving ? "Saving..." : "Save Profile"}</button>
        </form>
      </div>
    </div>
  );
}
