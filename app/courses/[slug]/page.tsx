"use client";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
const heading = "font-[family-name:var(--font-heading)]";

interface Module { id: string; title: string; content: string; videoUrl: string | null; duration: string | null; order: number; hasQuiz: boolean; quizQuestions: string | null }
interface CourseData { id: string; slug: string; title: string; description: string; coverImageUrl: string | null; duration: string | null; difficulty: string; skills: string[]; category: string | null; pricing: string; price: number | null; videoUrl: string | null; enrollmentCount: number; sequentialUnlock: boolean; createdBy: { name: string; organisation: string | null }; modules: Module[]; _count: { enrollments: number }; createdAt: string }
interface Enrollment { id: string; progress: number; completedModules: string[] }
interface Review { id: string; userName: string; rating: number; review: string | null; createdAt: string }
interface Certificate { id: string; certificateId: string; issuedAt: string }

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${slug}`).then((r) => r.json()).then((d) => {
      setCourse(d.course); setEnrollment(d.enrollment);
      if (d.course?.modules?.[0]) setActiveModule(d.course.modules[0].id);
      setLoading(false);
      // Fetch reviews
      if (d.course) fetch(`/api/courses/${d.course.id}/review`).then((r) => r.json()).then((rv) => { setReviews(rv.reviews || []); setAvgRating(rv.average || 0); });
      // Fetch certificate
      if (d.course) fetch(`/api/courses/${d.course.id}/certificate`).then((r) => r.json()).then((c) => { if (c.certificate) setCertificate(c.certificate); });
    });
  }, [slug]);

  async function handleEnroll() {
    if (!session) { window.location.href = "/auth/login"; return; }
    if (!course) return;
    setEnrolling(true);
    const res = await fetch(`/api/courses/${course.id}/enroll`, { method: "POST" });
    const data = await res.json();
    if (res.ok) { setEnrollment(data.enrollment); setMsg("Enrolled successfully!"); }
    else setMsg(data.error || "Enrollment failed");
    setEnrolling(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function submitReview() {
    if (!course || !myRating) return;
    setSubmittingReview(true);
    const res = await fetch(`/api/courses/${course.id}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating: myRating, review: myReview || null }) });
    const data = await res.json();
    if (res.ok) { setReviews((prev) => [data.review, ...prev]); setMsg("Review submitted!"); setMyRating(0); setMyReview(""); }
    else setMsg(data.error || "Failed to submit review");
    setSubmittingReview(false); setTimeout(() => setMsg(""), 3000);
  }

  async function generateCertificate() {
    if (!course) return;
    setGeneratingCert(true);
    const res = await fetch(`/api/courses/${course.id}/certificate`, { method: "POST" });
    const data = await res.json();
    if (data.certificate) { setCertificate(data.certificate); setMsg("Certificate generated!"); }
    else setMsg(data.error || "Failed to generate certificate");
    setGeneratingCert(false); setTimeout(() => setMsg(""), 3000);
  }

  async function submitQuiz(moduleId: string) {
    if (!course) return;
    setSubmittingQuiz(true); setQuizResult(null);
    const answers = Object.values(quizAnswers);
    const res = await fetch(`/api/courses/${course.id}/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId, answers }) });
    const data = await res.json();
    setQuizResult(data);
    if (data.passed && enrollment) {
      setEnrollment({ ...enrollment, completedModules: [...enrollment.completedModules, moduleId], progress: Math.min(100, Math.round(((enrollment.completedModules.length + 1) / course.modules.length) * 100)) });
    }
    setSubmittingQuiz(false);
  }

  async function markComplete(moduleId: string) {
    if (!course || !enrollment) return;
    await fetch(`/api/courses/${course.id}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId }) });
    setEnrollment((prev) => prev ? { ...prev, completedModules: [...prev.completedModules, moduleId], progress: Math.round(((prev.completedModules.length + 1) / course.modules.length) * 100) } : prev);
  }

  if (loading || !course) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  const currentModule = course.modules.find((m) => m.id === activeModule);
  const diffColors: Record<string, string> = { Beginner: "#10b981", Intermediate: "#F59E0B", Advanced: "#ef4444" };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section style={{ background: "#0C1A1A", paddingTop: "7rem", paddingBottom: "3rem" }}>
        <div className="mx-auto max-w-5xl px-4">
          <Link href="/courses" className="text-xs no-underline mb-3 inline-block" style={{ color: "rgba(255,255,255,0.5)" }}>← Back to courses</Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${diffColors[course.difficulty]}15`, color: diffColors[course.difficulty] }}>{course.difficulty}</span>
            {course.pricing === "FREE" ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#10b98115", color: "#10b981" }}>Free</span> : <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#F59E0B15", color: "#F59E0B" }}>Rs.{(course.price || 0) / 100}</span>}
            {course.category && <span className="text-[10px]" style={{ color: "#4A6363" }}>{course.category}</span>}
          </div>
          <h1 className={`${heading} text-2xl md:text-3xl font-bold text-white mb-2`}>{course.title}</h1>
          <p className="text-sm mb-3" style={{ color: "#6B8F8F" }}>{course.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "#4A6363" }}>
            <span>By {course.createdBy.organisation || course.createdBy.name}</span>
            {course.duration && <span>{course.duration}</span>}
            <span>{course.modules.length} modules</span>
            <span>{course._count.enrollments} enrolled</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {msg && <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#10b98115", color: "#10b981" }}>{msg}</div>}

        {/* Enroll / Progress bar */}
        {!enrollment ? (
          <div className="rounded-xl border bg-white p-5 mb-6 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div>
              <p className={`${heading} font-bold text-sm`} style={{ color: "var(--ink)" }}>Start learning today</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{course.modules.length} modules · {course.duration || "Self-paced"}</p>
            </div>
            <button onClick={handleEnroll} disabled={enrolling} className="btn-primary" style={{ padding: "0.6rem 1.5rem" }}>{enrolling ? "Enrolling..." : "Enroll — Free"}</button>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-5 mb-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>Your Progress</span>
              <span className={`${heading} text-sm font-bold`} style={{ color: "var(--primary)" }}>{enrollment.progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${enrollment.progress}%`, background: "var(--primary)" }} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module sidebar */}
          <div className="lg:col-span-1">
            <h3 className={`${heading} text-sm font-bold mb-3`} style={{ color: "var(--ink)" }}>Modules ({course.modules.length})</h3>
            <div className="space-y-1">
              {course.modules.map((m, i) => {
                const isComplete = enrollment?.completedModules.includes(m.id);
                const isActive = activeModule === m.id;
                const prevComplete = i === 0 || !course.sequentialUnlock || !enrollment || enrollment.completedModules.includes(course.modules[i - 1]?.id);
                const isLocked = course.sequentialUnlock && enrollment && !prevComplete && !isComplete;
                return (
                  <button key={m.id} onClick={() => { if (!isLocked) { setActiveModule(m.id); setQuizResult(null); setQuizAnswers({}); } }} disabled={!!isLocked} className="w-full text-left rounded-lg p-3 transition-all" style={{ background: isActive ? "rgba(10,191,188,0.08)" : "white", border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`, opacity: isLocked ? 0.5 : 1 }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs shrink-0" style={{ color: isComplete ? "#10b981" : isLocked ? "#8FA8A8" : "var(--muted)" }}>{isComplete ? "✓" : isLocked ? "🔒" : `${i + 1}.`}</span>
                      <span className="text-xs font-medium" style={{ color: isActive ? "var(--primary)" : "var(--ink)" }}>{m.title}</span>
                      {m.hasQuiz && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Quiz</span>}
                    </div>
                    {m.duration && <span className="text-[10px] ml-5" style={{ color: "var(--muted)" }}>{m.duration}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module content */}
          <div className="lg:col-span-2">
            {currentModule ? (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h2 className={`${heading} text-lg font-bold mb-3`} style={{ color: "var(--ink)" }}>{currentModule.title}</h2>
                {currentModule.videoUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe src={currentModule.videoUrl} className="w-full h-full" allowFullScreen />
                  </div>
                )}
                <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }} dangerouslySetInnerHTML={{ __html: (() => { try { const DOMPurify = require("isomorphic-dompurify"); return DOMPurify.sanitize(currentModule.content); } catch { return currentModule.content; } })() }} />
                {/* Quiz Section */}
                {enrollment && currentModule.hasQuiz && currentModule.quizQuestions && !enrollment.completedModules.includes(currentModule.id) && (
                  <div className="mt-6 rounded-xl border p-5" style={{ borderColor: "var(--primary)", background: "rgba(10,191,188,0.03)" }}>
                    <h4 className={`${heading} text-sm font-bold mb-3`} style={{ color: "var(--ink)" }}>📝 Module Quiz</h4>
                    <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Pass this quiz to complete the module and unlock the next one.</p>
                    {(() => { try { const qs = JSON.parse(currentModule.quizQuestions || "[]") as { question: string; options: string[] }[]; return (
                      <div className="space-y-4">
                        {qs.map((q, qi) => (
                          <div key={qi}>
                            <p className="text-sm font-medium mb-2" style={{ color: "var(--ink)" }}>{qi + 1}. {q.question}</p>
                            <div className="space-y-1">
                              {q.options.map((opt, oi) => (
                                <label key={oi} className="flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-all" style={{ background: quizAnswers[qi] === oi ? "rgba(10,191,188,0.08)" : "transparent", border: `1px solid ${quizAnswers[qi] === oi ? "var(--primary)" : "var(--border)"}` }}>
                                  <input type="radio" name={`q${qi}`} checked={quizAnswers[qi] === oi} onChange={() => setQuizAnswers({ ...quizAnswers, [qi]: oi })} className="accent-[var(--primary)]" />
                                  <span className="text-xs" style={{ color: "var(--ink)" }}>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button onClick={() => submitQuiz(currentModule.id)} disabled={submittingQuiz || Object.keys(quizAnswers).length < qs.length} className="btn-primary disabled:opacity-50 text-xs" style={{ padding: "0.5rem 1.25rem" }}>{submittingQuiz ? "Submitting..." : "Submit Quiz"}</button>
                      </div>
                    ); } catch { return <p className="text-xs" style={{ color: "#ef4444" }}>Quiz data is invalid</p>; } })()}
                    {quizResult && (
                      <div className="mt-4 rounded-lg p-4" style={{ background: quizResult.passed ? "#10b98110" : "#ef444410", border: `1px solid ${quizResult.passed ? "#10b981" : "#ef4444"}30` }}>
                        <p className={`${heading} text-sm font-bold`} style={{ color: quizResult.passed ? "#10b981" : "#ef4444" }}>{quizResult.passed ? "✓ Passed!" : "✗ Not Passed"}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Score: {quizResult.score}% ({quizResult.correct}/{quizResult.total} correct)</p>
                        {!quizResult.passed && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>You need {70}% to pass. Try again!</p>}
                      </div>
                    )}
                  </div>
                )}
                {/* Mark Complete (only if no quiz or quiz passed) */}
                {enrollment && !enrollment.completedModules.includes(currentModule.id) && !currentModule.hasQuiz && (
                  <button onClick={() => markComplete(currentModule.id)} className="btn-primary mt-4" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>Mark as Complete ✓</button>
                )}
                {enrollment?.completedModules.includes(currentModule.id) && (
                  <div className="mt-4 text-sm font-medium" style={{ color: "#10b981" }}>✓ Completed</div>
                )}
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: "var(--muted)" }}>Select a module to start learning</div>
            )}
          </div>
        </div>

        {/* Skills */}
        {course.skills.length > 0 && (
          <div className="mt-8">
            <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>Skills You&apos;ll Learn</h3>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((s) => <span key={s} className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--ink)" }}>{s}</span>)}
            </div>
          </div>
        )}

        {/* Certificate */}
        {enrollment && enrollment.progress >= 100 && (
          <div className="mt-8 rounded-xl border p-5" style={{ borderColor: "var(--primary)", background: "rgba(10,191,188,0.03)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`${heading} text-sm font-bold`} style={{ color: "var(--ink)" }}>🏆 Course Completed!</h3>
                {certificate ? (
                  <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    Certificate ID: <span className="font-mono text-[var(--primary)]">{certificate.certificateId}</span>
                    <span className="mx-2">·</span>
                    <a href={`/verify/${certificate.certificateId}`} target="_blank" className="no-underline" style={{ color: "var(--primary)" }}>Verify ↗</a>
                  </div>
                ) : (
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Get your certificate of completion</p>
                )}
              </div>
              {!certificate ? (
                <button onClick={generateCertificate} disabled={generatingCert} className="btn-primary text-xs" style={{ padding: "0.5rem 1rem" }}>{generatingCert ? "Generating..." : "Get Certificate"}</button>
              ) : (
                <a href={`/verify/${certificate.certificateId}`} target="_blank" className="btn-primary no-underline text-xs" style={{ padding: "0.5rem 1rem" }}>View Certificate</a>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h3 className={`${heading} text-sm font-bold`} style={{ color: "var(--ink)" }}>Reviews</h3>
            {avgRating > 0 && <span className="text-xs font-bold" style={{ color: "#F59E0B" }}>★ {avgRating} ({reviews.length})</span>}
          </div>

          {/* Write review (if enrolled) */}
          {enrollment && !reviews.some((r) => r.userName === session?.user?.name) && (
            <div className="rounded-xl border bg-white p-4 mb-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--ink)" }}>Rate this course</p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} onClick={() => setMyRating(star)} className="text-xl transition-transform hover:scale-110" style={{ color: star <= myRating ? "#F59E0B" : "#D4E8E8" }}>★</button>
                ))}
              </div>
              <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} placeholder="Write your review (optional)..." rows={2} className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-2" style={{ borderColor: "var(--border)" }} />
              <button onClick={submitReview} disabled={!myRating || submittingReview} className="btn-primary text-xs disabled:opacity-50" style={{ padding: "0.4rem 1rem" }}>{submittingReview ? "Submitting..." : "Submit Review"}</button>
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: "var(--ink)" }}>{r.userName}</span>
                    <span className="text-xs" style={{ color: "#F59E0B" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  {r.review && <p className="text-xs" style={{ color: "var(--muted)" }}>{r.review}</p>}
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
