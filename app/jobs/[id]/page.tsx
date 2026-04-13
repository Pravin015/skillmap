"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceLevel: string;
  urgency: string;
  jobType: string;
  domain: string | null;
  department: string | null;
  labTemplateId: string | null;
  labTemplate: { id: string; title: string; timeLimit: number; passingScore: number; difficulty: string } | null;
  description: string;
  skills: string[];
  perks: string | null;
  deadline: string | null;
  openings: number;
  status: string;
  createdAt: string;
  postedBy: { name: string; email: string; organisation: string | null };
  applications: { id: string; userId: string; status: string; scoreMatch: number }[];
}

interface Mentor {
  mentorNumber: string;
  currentCompany: string | null;
  currentRole: string | null;
  yearsOfExperience: number;
  rating: number;
  status: string;
  compensation: string;
  sessionRate: number | null;
  areaOfExpertise: string[];
  user: { name: string };
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showMentors, setShowMentors] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (res.ok) {
          setJob(data.job);
          // Check if user already applied
          if (userId && data.job.applications?.some((a: { userId: string }) => a.userId === userId)) {
            setApplied(true);
          }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [jobId, userId]);

  async function fetchMentors() {
    if (!job) return;
    setShowMentors(true);
    try {
      // Search mentors by company name
      const res = await fetch("/api/admin/mentors");
      const data = await res.json();
      const companyMentors = (data.mentors || []).filter(
        (m: Mentor) => m.currentCompany?.toLowerCase().includes(job.company.toLowerCase()) && m.status === "VERIFIED"
      );
      setMentors(companyMentors);
    } catch { setMentors([]); }
  }

  async function handleApply() {
    if (!session) return;
    setApplying(true);
    setApplyMessage(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job?.id, coverNote: coverNote || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplyMessage({ type: "error", text: data.error });
      } else {
        setApplyMessage({ type: "success", text: `Applied successfully! Your skill match score: ${data.application.scoreMatch}%` });
        setApplied(true);
        setShowApplyForm(false);
      }
    } catch { setApplyMessage({ type: "error", text: "Failed to apply" }); }
    finally { setApplying(false); }
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">💼</div>
          <h1 className={`${heading} font-bold text-xl mb-2`}>Job not found</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>This job may have been removed or doesn&apos;t exist.</p>
          <Link href="/jobs" className={`inline-block mt-4 px-5 py-2.5 rounded-xl ${heading} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>Browse all jobs</Link>
        </div>
      </div>
    );
  }

  const isExpired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
          <Link href="/jobs" className="no-underline hover:underline" style={{ color: "var(--muted)" }}>Jobs</Link>
          <span>→</span>
          <span>{job.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="h-2" style={{ background: job.status === "ACTIVE" ? "var(--primary)" : "var(--border)" }} />
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${heading} font-extrabold text-xl text-white shrink-0`} style={{ background: "var(--ink)" }}>
                    {job.company.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h1 className={`${heading} font-extrabold text-xl md:text-2xl`}>{job.title}</h1>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{job.company}{job.department ? ` · ${job.department}` : ""}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: job.workMode === "Remote" ? "rgba(34,197,94,0.1)" : job.workMode === "Hybrid" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)", color: job.workMode === "Remote" ? "#16a34a" : job.workMode === "Hybrid" ? "#7c3aed" : "#2563eb" }}>
                        {job.workMode}
                      </span>
                      <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{job.jobType}</span>
                      <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{job.experienceLevel}</span>
                      {job.domain && <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: "var(--primary)", color: "white" }}>{job.domain}</span>}
                      {isExpired && <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Expired</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Location</div>
                <div className={`${heading} font-bold text-sm mt-0.5`}>{job.location}</div>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>Salary</div>
                  <div className={`${heading} font-bold text-sm mt-0.5`}>
                    {job.salaryMin && job.salaryMax ? `₹${job.salaryMin}–${job.salaryMax} LPA` : job.salaryMax ? `Up to ₹${job.salaryMax} LPA` : `₹${job.salaryMin}+ LPA`}
                  </div>
                </div>
              )}
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Urgency</div>
                <div className={`${heading} font-bold text-sm mt-0.5`}>{job.urgency}</div>
              </div>
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Openings</div>
                <div className={`${heading} font-bold text-sm mt-0.5`}>{job.openings}</div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <h2 className={`${heading} font-bold text-base mb-4`}>Job Description</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${heading} font-bold text-base mb-4`}>Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-full ${heading}`} style={{ background: "var(--primary)", color: "white" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Perks */}
            {job.perks && (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${heading} font-bold text-base mb-3`}>Perks & Benefits</h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{job.perks}</p>
              </div>
            )}

            {/* Connect with mentors */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`${heading} font-bold text-base`}>Connect with Mentors</h2>
                <button onClick={fetchMentors} className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs`} style={{ background: "var(--primary)", color: "white" }}>
                  {showMentors ? "Refresh" : `Find mentors at ${job.company}`}
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Get guidance from professionals currently working at {job.company}</p>

              {showMentors && (
                mentors.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
                    <div className="text-3xl mb-3">🧑‍🏫</div>
                    <p className={`${heading} font-bold text-sm mb-1`}>No verified mentors from {job.company} yet</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Check back later or browse all mentors</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mentors.map((m) => (
                      <div key={m.mentorNumber} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${heading} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>
                          {m.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`${heading} font-bold text-sm`}>{m.user.name}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>{m.currentRole} · {m.yearsOfExperience} yrs · ★{m.rating}</div>
                        </div>
                        <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">Verified</span>
                        <Link href={`/mentor/${m.mentorNumber}`} className={`shrink-0 px-3 py-1.5 rounded-lg ${heading} font-bold text-[0.7rem] no-underline`} style={{ background: "var(--primary)", color: "white" }}>View</Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply card */}
            <div className="rounded-2xl border bg-white p-6 sticky top-20" style={{ borderColor: "var(--border)" }}>
              {applyMessage && (
                <div className={`rounded-xl p-3 text-sm mb-4 ${applyMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {applyMessage.text}
                </div>
              )}

              {!session ? (
                <>
                  <p className={`${heading} font-bold text-base mb-2`}>Interested?</p>
                  <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Login to apply for this position</p>
                  <Link href="/auth/login" className={`block w-full text-center py-3 rounded-xl ${heading} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>Login to apply</Link>
                </>
              ) : applied ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">✅</div>
                    <p className={`${heading} font-bold text-base`}>You&apos;ve applied</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Track your application status in your dashboard</p>
                  </div>
                  <Link href="/dashboard" className={`block w-full text-center py-3 rounded-xl ${heading} font-bold text-sm no-underline mt-3 border`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View dashboard</Link>
                </>
              ) : userRole !== "STUDENT" ? (
                <>
                  <p className={`${heading} font-bold text-base mb-2`}>Job Details</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Only students can apply to job postings</p>
                </>
              ) : isExpired ? (
                <>
                  <p className={`${heading} font-bold text-base mb-2`}>Application Closed</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>This job&apos;s deadline has passed</p>
                </>
              ) : showApplyForm ? (
                <>
                  <p className={`${heading} font-bold text-base mb-3`}>Apply Now</p>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${heading}`}>Cover note (optional)</label>
                      <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} placeholder="Why are you a good fit for this role?" rows={4} className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none" style={{ borderColor: "var(--border)" }} />
                    </div>
                    <button onClick={handleApply} disabled={applying} className={`w-full py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
                      {applying ? "Submitting..." : "Submit Application"}
                    </button>
                    <button onClick={() => setShowApplyForm(false)} className="w-full text-center text-xs" style={{ color: "var(--muted)" }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  {job.labTemplate ? (
                    <>
                      <div className="rounded-xl p-3 mb-3 text-xs border" style={{ background: "rgba(232,255,71,0.05)", borderColor: "rgba(10,191,188,0.2)" }}>
                        <div className={`${heading} font-bold text-sm mb-1`}>🧪 Lab Assessment Required</div>
                        <p style={{ color: "var(--muted)" }}>{job.labTemplate.title} · {job.labTemplate.timeLimit} min · {job.labTemplate.difficulty} · Pass: {job.labTemplate.passingScore}%</p>
                      </div>
                      <a href={`/labs/${job.labTemplate.id}?jobId=${job.id}`} className={`block w-full text-center py-3.5 rounded-xl ${heading} font-bold text-sm no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--primary)", color: "var(--ink)" }}>
                        Start Lab & Apply →
                      </a>
                    </>
                  ) : (
                    <button onClick={() => setShowApplyForm(true)} className={`w-full py-3.5 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--primary)", color: "var(--ink)" }}>
                      Apply Now →
                    </button>
                  )}
                  <p className="text-center text-[0.65rem] mt-2" style={{ color: "var(--muted)" }}>{job.labTemplate ? "Complete the lab to submit your application" : "Your profile score will be matched automatically"}</p>
                </>
              )}

              <hr className="my-4" style={{ borderColor: "var(--border)" }} />

              {/* Share */}
              <button onClick={handleShare} className={`w-full py-2.5 rounded-xl ${heading} font-bold text-xs border transition-colors hover:bg-gray-50 flex items-center justify-center gap-2`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                {copied ? "✓ Link copied!" : "📤 Share this job"}
              </button>

              {/* AI prep */}
              <Link href={`/chat?job=${job.id}`} className={`block w-full text-center py-2.5 rounded-xl ${heading} font-bold text-xs mt-2 no-underline border transition-colors hover:bg-gray-50`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                🤖 Get AI prep plan
              </Link>
            </div>

            {/* Job meta */}
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <h3 className={`${heading} font-bold text-sm mb-3`}>Job Details</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Posted</span><span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span></div>
                {job.deadline && <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Deadline</span><span className="font-medium">{new Date(job.deadline).toLocaleDateString()}</span></div>}
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Applicants</span><span className="font-medium">{job.applications.length}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Posted by</span><span className="font-medium">{job.postedBy.name}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Status</span><span className={`font-bold ${heading}`} style={{ color: job.status === "ACTIVE" ? "#22c55e" : "var(--muted)" }}>{job.status}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
