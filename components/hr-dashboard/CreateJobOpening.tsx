"use client";
import { useState, useEffect } from "react";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;
const experienceLevels = ["Fresher", ...Array.from({ length: 30 }, (_, i) => `${i + 1} year${i + 1 > 1 ? "s" : ""}`)];

interface LabOption { id: string; title: string; domain: string; difficulty: string; timeLimit: number; _count: { problems: number } }
interface GamifyLab { id: string; slug: string; title: string; difficulty: string; category: string; timeLimit: number; maxScore: number }

export default function CreateJobOpening({ companyName }: { companyName: string }) {
  const [saving, setSaving] = useState(false);
  const [labs, setLabs] = useState<LabOption[]>([]);
  const [gamifyLabs, setGamifyLabs] = useState<GamifyLab[]>([]);
  // `null` = still loading. `false` = env vars not set on the server.
  // `true` = gamify reachable; gamifyLabs.length tells us if it has any labs.
  // Surfaced as a transparent hint card below so HR knows *why* the hands-on
  // section is missing (and what to do about it).
  const [gamifyConfigured, setGamifyConfigured] = useState<boolean | null>(null);
  const [gamifyError, setGamifyError] = useState<string | null>(null);
  // Multi-select lab state. Both arrays start empty; HR ticks the labs they
  // want to gate the application behind. Empty = no gate.
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [selectedGamifySlugs, setSelectedGamifySlugs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/labs?status=PUBLISHED").then((r) => r.json()).then((d) => setLabs(d.labs || [])).catch(() => {});
    fetch("/api/external-labs")
      .then((r) => r.json())
      .then((d) => {
        setGamifyLabs(d.labs || []);
        setGamifyConfigured(d.configured ?? false);
        if (d.error) setGamifyError(d.error);
      })
      .catch(() => { setGamifyConfigured(false); });
  }, []);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          company: companyName,
          location: data.get("location"),
          workMode: data.get("workMode"),
          salaryMin: data.get("salaryMin"),
          salaryMax: data.get("salaryMax"),
          experienceLevel: data.get("experienceLevel"),
          urgency: data.get("urgency"),
          jobType: data.get("jobType"),
          domain: data.get("domain"),
          department: data.get("department"),
          description: data.get("description"),
          skills: (data.get("skills") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [],
          perks: data.get("perks"),
          deadline: data.get("deadline"),
          openings: data.get("openings"),
          // Multi-select labs. Server stores both arrays + legacy singletons
          // so existing readers keep working — see app/api/jobs/route.ts.
          labTemplateIds: selectedLabIds,
          gamifyLabSlugs: selectedGamifySlugs,
          gamifyMinScore: data.get("gamifyMinScore") ? Number(data.get("gamifyMinScore")) : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: result.error }); return; }
      setMessage({ type: "success", text: `Job "${result.job.title}" posted successfully!` });
      form.reset();
      setSelectedLabIds([]);
      setSelectedGamifySlugs([]);
    } catch { setMessage({ type: "error", text: "Failed to post job" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Create Job Opening</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Post a new job — it will be live immediately for candidates</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        {message && (
          <div className={`rounded-xl p-4 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Job Title *</label>
            <input name="title" type="text" required placeholder="e.g. Cybersecurity Analyst L1" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input type="text" value={companyName || ""} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed`} style={{ borderColor: "var(--border)", color: "var(--muted)" }} />
          </div>
          <div>
            <label className={labelClass}>Location *</label>
            <input name="location" type="text" required placeholder="e.g. Bangalore, Mumbai" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Work Mode *</label>
            <select name="workMode" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>On-site</option><option>Remote</option><option>Hybrid</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Salary Min (LPA)</label>
            <input name="salaryMin" type="number" placeholder="e.g. 3" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Salary Max (LPA)</label>
            <input name="salaryMax" type="number" placeholder="e.g. 8" min="0" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Experience *</label>
            <select name="experienceLevel" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option>
              {experienceLevels.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Urgency *</label>
            <select name="urgency" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>Urgent (ASAP)</option><option>Within 15 days</option><option>Within 30 days</option><option>More than 30 days</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Job Type *</label>
            <select name="jobType" required className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Domain</label>
            <select name="domain" className={inputClass} style={{ borderColor: "var(--border)" }}>
              <option value="">Select</option><option>Software Development</option><option>Cybersecurity</option><option>Cloud & DevOps</option><option>Data & Analytics</option><option>Digital Marketing</option><option>Social Media</option><option>Sales</option><option>Consulting</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input name="department" type="text" placeholder="e.g. Engineering" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Openings</label>
            <input name="openings" type="number" placeholder="e.g. 5" min="1" defaultValue="1" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        {/* Lab Assessment — multi-select. HR can tick any number of MCQ labs;
            candidates must clear ALL of them before applying. */}
        {labs.length > 0 && (
          <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.05)" }}>
            <div className="flex items-baseline gap-2 mb-2">
              <label className={labelClass} style={{ marginBottom: 0 }}>Attach Assessment Labs (MCQ)</label>
              {selectedLabIds.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "#7c3aed" }}>
                  {selectedLabIds.length} selected
                </span>
              )}
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {labs.map((l) => {
                const checked = selectedLabIds.includes(l.id);
                return (
                  <label key={l.id} className="flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs" style={{ background: checked ? "rgba(124,58,237,0.08)" : "white", border: "1px solid var(--border)" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedLabIds((prev) => e.target.checked ? [...prev, l.id] : prev.filter((x) => x !== l.id));
                      }}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{l.title}</span>
                      <span style={{ color: "var(--muted)" }}> — {l.domain} · {l.difficulty} · {l._count.problems} Qs · {l.timeLimit}min</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Pick one or more labs. Candidates must clear <strong>every</strong> selected lab before applying.</p>
          </div>
        )}

        {/* Hands-on lab section. Three states:
              1. gamifyConfigured=false → env vars missing on the server. Show
                 a "Not configured" hint so admins know what to set.
              2. configured but gamifyLabs.length=0 → integration works but no
                 labs exist on the gamify side yet. Show an empty-state hint.
              3. labs present → render the picker (existing UI). */}
        {gamifyConfigured === false && (
          <div className="rounded-xl p-3 border text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
            🔌 <strong>Hands-on Lab integration not configured.</strong>{" "}
            Set <code>GAMIFY_API_URL</code> + <code>GAMIFY_API_KEY</code> on Railway to enable it.
            Without it, you can still gate jobs with the MCQ assessment above.
          </div>
        )}
        {gamifyConfigured === true && gamifyLabs.length === 0 && (
          <div className="rounded-xl p-3 border text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
            🧪 Hands-on Lab platform is connected, but no labs are published yet.
            {gamifyError ? <> <em>({gamifyError})</em></> : <> Create labs in the gamify admin to gate jobs with them.</>}
          </div>
        )}

        {gamifyLabs.length > 0 && (
          <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)" }}>
            <div className="flex items-baseline gap-2 mb-2">
              <label className={labelClass} style={{ marginBottom: 0 }}>Gate with Hands-on Labs</label>
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#16a34a" }}>Recommended</span>
              {selectedGamifySlugs.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#16a34a" }}>
                  {selectedGamifySlugs.length} selected
                </span>
              )}
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {gamifyLabs.map((l) => {
                const checked = selectedGamifySlugs.includes(l.slug);
                return (
                  <label key={l.id} className="flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs" style={{ background: checked ? "rgba(16,185,129,0.08)" : "white", border: "1px solid var(--border)" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedGamifySlugs((prev) => e.target.checked ? [...prev, l.slug] : prev.filter((x) => x !== l.slug));
                      }}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{l.title}</span>
                      <span style={{ color: "var(--muted)" }}> — {l.category} · {l.difficulty} · {l.timeLimit}min · max {l.maxScore} pts</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Minimum score (0-100)</label>
                <input type="number" name="gamifyMinScore" min={0} max={100} placeholder="e.g. 70" className={inputClass} style={{ borderColor: "var(--border)" }} />
              </div>
              <div className="text-[11px] flex items-center" style={{ color: "var(--muted)" }}>
                <span>
                  Leave blank to accept any completion.<br />
                  Higher = stricter filter — fewer but better-qualified applications.
                </span>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              📝 Students must complete <strong>every</strong> selected lab before they can submit an application. Per-lab scores are shown on each application card.
            </p>
          </div>
        )}
        <div>
          <label className={labelClass}>Required Skills</label>
          <input name="skills" type="text" placeholder="Python, SQL, AWS (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} />
        </div>
        <div>
          <label className={labelClass}>Job Description *</label>
          <textarea name="description" required placeholder="Describe the role..." rows={5} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Application Deadline</label>
            <input name="deadline" type="date" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={labelClass}>Perks & Benefits</label>
            <input name="perks" type="text" placeholder="e.g. WFH, health insurance" className={inputClass} style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <button type="submit" disabled={saving} className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
          {saving ? "Posting..." : "Post Job Opening"}
        </button>
      </form>
    </div>
  );
}
