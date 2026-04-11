"use client";

import { useEffect, useState } from "react";
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

  // Form state
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
  const [otherLinks, setOtherLinks] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<Exp[]>([]);
  const [certifications, setCertifications] = useState<Cert[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") fetchProfile();
  }, [status, router]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.profile) {
        const p = data.profile;
        setProfileNumber(p.profileNumber);
        setCollegeName(p.collegeName || "");
        setExperienceLevel(p.experienceLevel || "FRESHER");
        setFieldOfInterest(p.fieldOfInterest || "");
        setBio(p.bio || "");
        setAcademicScore(p.academicScore || "");
        setAcademicType(p.academicType || "CGPA");
        setSalaryMin(p.salaryMin?.toString() || "");
        setSalaryMax(p.salaryMax?.toString() || "");
        setAvailableToJoin(p.availableToJoin ?? true);
        setJoinDate(p.joinDate || "Immediately");
        setGithubUrl(p.githubUrl || "");
        setLinkedinUrl(p.linkedinUrl || "");
        setPortfolioUrl(p.portfolioUrl || "");
        setOtherLinks((p.otherLinks || []).join(", "));
        setSkills((p.skills || []).join(", "));
        setExperiences(p.experiences || []);
        setCertifications(p.certifications || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeName, experienceLevel, fieldOfInterest, bio,
          academicScore, academicType,
          salaryMin, salaryMax, availableToJoin, joinDate,
          githubUrl, linkedinUrl, portfolioUrl,
          otherLinks: otherLinks.split(",").map((s) => s.trim()).filter(Boolean),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          experiences, certifications,
        }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfileNumber(data.profile.profileNumber);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  function addExperience() {
    setExperiences([...experiences, { company: "", role: "", startDate: "", endDate: "", description: "", current: false }]);
  }
  function updateExperience(i: number, field: string, value: string | boolean) {
    const updated = [...experiences];
    (updated[i] as unknown as Record<string, string | boolean>)[field] = value;
    setExperiences(updated);
  }
  function removeExperience(i: number) {
    setExperiences(experiences.filter((_, idx) => idx !== i));
  }

  function addCertification() {
    setCertifications([...certifications, { title: "", issuer: "", issueDate: "", imageUrl: "" }]);
  }
  function updateCertification(i: number, field: string, value: string) {
    const updated = [...certifications];
    (updated[i] as unknown as Record<string, string>)[field] = value;
    setCertifications(updated);
  }
  function removeCertification(i: number) {
    setCertifications(certifications.filter((_, idx) => idx !== i));
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`${syne} font-extrabold text-2xl`}>Edit Profile</h1>
            {profileNumber && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Profile ID: <span className={`${syne} font-bold`}>{profileNumber}</span></p>
            )}
          </div>
          {profileNumber && (
            <button onClick={() => router.push(`/profile/${profileNumber}`)} className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs border transition-colors hover:bg-gray-50`} style={{ borderColor: "var(--border)" }}>View public profile</button>
          )}
        </div>

        {saved && (
          <div className="rounded-xl p-4 text-sm font-medium mb-6" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }}>
            Profile saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>College / University *</label>
                <input type="text" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="e.g. IIT Bombay" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className={labelClass}>Experience Level *</label>
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option value="FRESHER">Fresher</option>
                  <option value="EXPERIENCED">Experienced</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Field of Interest *</label>
                <select value={fieldOfInterest} onChange={(e) => setFieldOfInterest(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option value="">Select</option>
                  <option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Consulting & Finance</option><option>Product Management</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Skills</label>
                <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, SQL, AWS (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell recruiters about yourself in 2-3 sentences..." rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
            </div>
          </div>

          {/* Academic */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Academic Score</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Score Type</label>
                <select value={academicType} onChange={(e) => setAcademicType(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option>CGPA</option><option>Percentage</option><option>GPA</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Score</label>
                <input type="text" value={academicScore} onChange={(e) => setAcademicScore(e.target.value)} placeholder="e.g. 8.5 or 85%" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
            </div>
          </div>

          {/* Salary & Availability */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Expected Salary Min (LPA)</label>
                <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="e.g. 3" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className={labelClass}>Expected Salary Max (LPA)</label>
                <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="e.g. 8" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className={labelClass}>Available to Join</label>
                <select value={availableToJoin ? "yes" : "no"} onChange={(e) => setAvailableToJoin(e.target.value === "yes")} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Notice Period</label>
                <select value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}>
                  <option>Immediately</option><option>15 days</option><option>30 days</option><option>60 days+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Links & Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>GitHub</label>
                <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn</label>
                <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className={labelClass}>Portfolio / Website</label>
                <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yoursite.com" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className={labelClass}>Other Links</label>
                <input type="text" value={otherLinks} onChange={(e) => setOtherLinks(e.target.value)} placeholder="Kaggle, Behance, etc. (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
            </div>
          </div>

          {/* Experience */}
          {experienceLevel === "EXPERIENCED" && (
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${syne} font-bold text-base`}>Work Experience</h2>
                <button type="button" onClick={addExperience} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ Add</button>
              </div>
              {experiences.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No experience added yet</p>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp, i) => (
                    <div key={i} className="rounded-xl border p-4 relative" style={{ borderColor: "var(--border)" }}>
                      <button type="button" onClick={() => removeExperience(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm">✕</button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} placeholder="Company" className={inputClass} style={{ borderColor: "var(--border)" }} />
                        <input type="text" value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} placeholder="Role / Title" className={inputClass} style={{ borderColor: "var(--border)" }} />
                        <input type="text" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} placeholder="Start (e.g. Jan 2024)" className={inputClass} style={{ borderColor: "var(--border)" }} />
                        <input type="text" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} placeholder="End (or leave blank if current)" className={inputClass} style={{ borderColor: "var(--border)" }} disabled={exp.current} />
                      </div>
                      <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer" style={{ color: "var(--muted)" }}>
                        <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(i, "current", e.target.checked)} className="accent-[var(--ink)]" /> Currently working here
                      </label>
                      <textarea value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} placeholder="Brief description..." rows={2} className={`${inputClass} resize-none mt-2`} style={{ borderColor: "var(--border)" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications */}
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${syne} font-bold text-base`}>Certifications & Achievements</h2>
              <button type="button" onClick={addCertification} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ Add</button>
            </div>
            {certifications.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No certifications added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certifications.map((cert, i) => (
                  <div key={i} className="rounded-xl border p-4 relative" style={{ borderColor: "var(--border)" }}>
                    <button type="button" onClick={() => removeCertification(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm">✕</button>
                    <input type="text" value={cert.title} onChange={(e) => updateCertification(i, "title", e.target.value)} placeholder="Certificate title" className={`${inputClass} mb-2`} style={{ borderColor: "var(--border)" }} />
                    <input type="text" value={cert.issuer} onChange={(e) => updateCertification(i, "issuer", e.target.value)} placeholder="Issuing organisation" className={`${inputClass} mb-2`} style={{ borderColor: "var(--border)" }} />
                    <input type="text" value={cert.issueDate} onChange={(e) => updateCertification(i, "issueDate", e.target.value)} placeholder="Issue date (e.g. Mar 2025)" className={inputClass} style={{ borderColor: "var(--border)" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className={`px-8 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
