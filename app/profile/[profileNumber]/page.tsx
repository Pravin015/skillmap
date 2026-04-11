"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const syne = "font-[family-name:var(--font-syne)]";

interface ProfileData {
  profileNumber: string;
  collegeName: string | null;
  experienceLevel: string;
  fieldOfInterest: string | null;
  bio: string | null;
  academicScore: string | null;
  academicType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  availableToJoin: boolean;
  joinDate: string | null;
  resumeUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  otherLinks: string[];
  skills: string[];
  profileScore: number;
  experiences: { company: string; role: string; startDate: string; endDate: string | null; description: string | null; current: boolean }[];
  certifications: { title: string; issuer: string; issueDate: string | null; imageUrl: string | null }[];
  user: { name: string; degree: string | null; gradYear: string | null; email?: string };
}

export default function PublicProfilePage() {
  const params = useParams();
  const profileNumber = params.profileNumber as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/profile/${profileNumber}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setProfile(data.profile);
        setViewerRole(data.viewerRole);
      } catch { setError("Failed to load profile"); }
      finally { setLoading(false); }
    }
    load();
  }, [profileNumber]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className={`${syne} font-bold text-xl mb-2`}>{error || "Profile not found"}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>This profile may not exist or you may not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const p = profile;
  const scoreColor = p.profileScore < 40 ? "#ef4444" : p.profileScore < 70 ? "#f59e0b" : "#22c55e";
  const showScore = viewerRole === "HR" || viewerRole === "ADMIN" || viewerRole === "ORG";

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="h-2" style={{ background: "var(--ink)" }} />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${syne} font-extrabold text-xl text-white shrink-0`} style={{ background: "var(--ink)" }}>
                {p.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className={`${syne} font-extrabold text-xl`}>{p.user.name}</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {p.collegeName || "College not specified"}{p.user.degree ? ` · ${p.user.degree}` : ""}{p.user.gradYear ? ` · ${p.user.gradYear}` : ""}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${syne}`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
                    {p.experienceLevel === "FRESHER" ? "Fresher" : "Experienced"}
                  </span>
                  {p.fieldOfInterest && (
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{p.fieldOfInterest}</span>
                  )}
                  {p.availableToJoin && (
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Available · {p.joinDate || "Immediately"}</span>
                  )}
                </div>
              </div>
              {showScore && (
                <div className="text-center shrink-0">
                  <div className={`${syne} text-2xl font-extrabold`} style={{ color: scoreColor }}>{p.profileScore}</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>Profile Score</div>
                </div>
              )}
            </div>
            <div className="text-xs mt-3 px-1" style={{ color: "var(--muted)" }}>ID: {p.profileNumber}</div>
          </div>
        </div>

        {/* Bio */}
        {p.bio && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>About</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{p.bio}</p>
          </div>
        )}

        {/* Quick info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {p.academicScore && (
            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{p.academicType || "Score"}</div>
              <div className={`${syne} text-xl font-extrabold mt-1`}>{p.academicScore}</div>
            </div>
          )}
          {(p.salaryMin || p.salaryMax) && (
            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Expected (LPA)</div>
              <div className={`${syne} text-xl font-extrabold mt-1`}>{p.salaryMin || "—"}–{p.salaryMax || "—"}</div>
            </div>
          )}
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Available</div>
            <div className={`${syne} text-xl font-extrabold mt-1`}>{p.availableToJoin ? "Yes" : "No"}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Notice</div>
            <div className={`${syne} text-xl font-extrabold mt-1`}>{p.joinDate || "—"}</div>
          </div>
        </div>

        {/* Skills */}
        {p.skills.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${syne}`} style={{ borderColor: "var(--border)" }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Resume */}
        {p.resumeUrl && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Resume</h2>
            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "rgba(232,255,71,0.05)" }}>
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <div className={`${syne} font-bold text-sm`}>Resume uploaded</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>View only</div>
              </div>
            </div>
          </div>
        )}

        {/* Links */}
        {(p.githubUrl || p.linkedinUrl || p.portfolioUrl || p.otherLinks.length > 0) && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Links & Projects</h2>
            <div className="space-y-2">
              {p.githubUrl && (
                <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                  <span className="text-lg">🐙</span>
                  <span className="text-sm">GitHub</span>
                  <span className="text-xs ml-auto truncate max-w-[200px]" style={{ color: "var(--muted)" }}>{p.githubUrl}</span>
                </a>
              )}
              {p.linkedinUrl && (
                <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                  <span className="text-lg">💼</span>
                  <span className="text-sm">LinkedIn</span>
                  <span className="text-xs ml-auto truncate max-w-[200px]" style={{ color: "var(--muted)" }}>{p.linkedinUrl}</span>
                </a>
              )}
              {p.portfolioUrl && (
                <a href={p.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                  <span className="text-lg">🌐</span>
                  <span className="text-sm">Portfolio</span>
                  <span className="text-xs ml-auto truncate max-w-[200px]" style={{ color: "var(--muted)" }}>{p.portfolioUrl}</span>
                </a>
              )}
              {p.otherLinks.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                  <span className="text-lg">🔗</span>
                  <span className="text-sm truncate">{link}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {p.experiences.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Work Experience</h2>
            <div className="space-y-4">
              {p.experiences.map((exp, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm" style={{ background: "var(--ink)", color: "var(--accent)" }}>{exp.company.charAt(0)}</div>
                  <div>
                    <div className={`${syne} font-bold text-sm`}>{exp.role}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{exp.company} · {exp.startDate} – {exp.current ? "Present" : exp.endDate || "—"}</div>
                    {exp.description && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {p.certifications.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Certifications & Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {p.certifications.map((cert, i) => (
                <div key={i} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                  <div className={`${syne} font-bold text-sm`}>{cert.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{cert.issuer}{cert.issueDate ? ` · ${cert.issueDate}` : ""}</div>
                  {cert.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                      <img src={cert.imageUrl} alt={cert.title} className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
