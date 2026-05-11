"use client";
// Two modes: single-student form OR bulk CSV upload.
// Bulk mode hits POST /api/institution/students/bulk with the CSV
// text and renders per-row results so the placement officer can see
// exactly which rows succeeded and which need fixing.
import { useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--primary)] transition-colors";

interface BulkRowResult {
  row: number;
  email: string;
  status: "created" | "skipped" | "failed";
  reason?: string;
  tempPassword?: string;
  profileNumber?: string;
}

interface BulkSummary {
  total: number;
  created: number;
  skipped: number;
  failed: number;
}

const SAMPLE_CSV = `name,email,degree,gradYear,phone
Aarav Sharma,aarav@example.com,B.Tech/BE,2025,+91 9876543210
Priya Mehta,priya@example.com,BCA,2026,
Rahul Iyer,rahul@example.com,B.Tech/BE,2025,+91 9876500000`;

export default function AddStudent({ onRefresh }: { onRefresh: () => void }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempPwd, setTempPwd] = useState("");

  const [csvText, setCsvText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkRowResult[] | null>(null);
  const [bulkSummary, setBulkSummary] = useState<BulkSummary | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setTempPwd("");
    try {
      const res = await fetch("/api/institution/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, degree, gradYear }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }
      setTempPwd(data.tempPassword);
      setMessage({ type: "success", text: `Student ${data.student.name} created (ID: ${data.student.profileNumber})` });
      setName(""); setEmail(""); setDegree(""); setGradYear("");
      onRefresh();
    } catch {
      setMessage({ type: "error", text: "Failed to create student" });
    } finally {
      setSaving(false);
    }
  }

  function onCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setBulkError("File too large (max 1 MB). Split into smaller batches.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
    reader.onerror = () => setBulkError("Couldn't read file.");
    reader.readAsText(file);
  }

  async function handleBulkUpload() {
    if (!csvText.trim()) {
      setBulkError("Paste CSV text or upload a file first.");
      return;
    }
    setBulkUploading(true);
    setBulkError(null);
    setBulkResults(null);
    setBulkSummary(null);
    try {
      const res = await fetch("/api/institution/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Upload failed");
        return;
      }
      setBulkResults(data.results);
      setBulkSummary(data.summary);
      onRefresh();
    } catch {
      setBulkError("Network error — try again.");
    } finally {
      setBulkUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Add Students</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Create student accounts linked to your institution — one at a time, or upload your full batch.
        </p>
      </div>

      <div className="flex gap-2 p-1 rounded-xl border w-fit" style={{ borderColor: "var(--border)", background: "var(--surface-alt)" }}>
        <button
          onClick={() => setMode("single")}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          style={{ background: mode === "single" ? "white" : "transparent", color: mode === "single" ? "var(--ink)" : "var(--muted)" }}
        >
          Single student
        </button>
        <button
          onClick={() => setMode("bulk")}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          style={{ background: mode === "bulk" ? "white" : "transparent", color: mode === "bulk" ? "var(--ink)" : "var(--muted)" }}
        >
          Bulk CSV upload
        </button>
      </div>

      {mode === "single" && (
        <form onSubmit={handleSingleSubmit} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
          {message && <div className={`rounded-xl p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}
          {tempPwd && (
            <div className="rounded-xl p-4 border" style={{ background: "var(--primary-light)", borderColor: "rgba(124,58,237,0.2)" }}>
              <div className={`${heading} font-bold text-sm mb-1`}>Temporary Password</div>
              <code className="text-base font-mono font-bold select-all">{tempPwd}</code>
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Share this with the student. Shown only once.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Full Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Student's name" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Email *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="student@email.com" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Degree</label>
              <select value={degree} onChange={(e) => setDegree(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>B.Tech/BE</option><option>BCA</option><option>B.Sc</option><option>BBA</option><option>B.Com</option><option>BA</option><option>MBA</option><option>MCA</option><option>Other</option></select></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Graduation Year</label>
              <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>2024</option><option>2025</option><option>2026</option><option>2027</option></select></div>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>A temporary password is generated. The student&apos;s profile is linked to your institution.</p>
          <button type="submit" disabled={saving} className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Creating..." : "Create Student Account"}</button>
        </form>
      )}

      {mode === "bulk" && (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h3 className={`${heading} font-bold text-base mb-2`}>Upload CSV</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
              Required columns: <strong>name</strong>, <strong>email</strong>. Optional: <strong>degree</strong>,{" "}
              <strong>gradYear</strong>, <strong>phone</strong>. Maximum 500 rows per upload.
              Each created student gets a temporary password they must change on first login.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <label className="px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                Choose CSV file
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={onCsvFile} />
              </label>
              <button
                type="button"
                onClick={() => setCsvText(SAMPLE_CSV)}
                className="text-xs underline"
                style={{ color: "var(--primary)" }}
              >
                or paste sample
              </button>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              placeholder="Paste CSV here, or upload a file above…"
              className="w-full rounded-xl border px-4 py-3 text-xs font-mono outline-none resize-y"
              style={{ borderColor: "var(--border)" }}
            />

            {bulkError && (
              <div className="mt-3 rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">{bulkError}</div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBulkUpload}
                disabled={bulkUploading || !csvText.trim()}
                className={`px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`}
                style={{ background: "var(--primary)", color: "white" }}
              >
                {bulkUploading ? "Uploading…" : "Create accounts"}
              </button>
              {csvText && !bulkUploading && (
                <button
                  type="button"
                  onClick={() => { setCsvText(""); setBulkResults(null); setBulkSummary(null); setBulkError(null); }}
                  className="px-4 py-3 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {bulkSummary && (
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
              <h3 className={`${heading} font-bold text-base mb-3`}>Upload result</h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Total", value: bulkSummary.total, color: "var(--ink)" },
                  { label: "Created", value: bulkSummary.created, color: "#16a34a" },
                  { label: "Skipped", value: bulkSummary.skipped, color: "#ca8a04" },
                  { label: "Failed", value: bulkSummary.failed, color: "#dc2626" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--border)" }}>
                    <p className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {bulkResults && bulkResults.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ minWidth: "600px" }}>
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                        <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--muted)" }}>Row</th>
                        <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--muted)" }}>Email</th>
                        <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--muted)" }}>Status</th>
                        <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--muted)" }}>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((r) => (
                        <tr key={r.row} className="border-b" style={{ borderColor: "var(--border)" }}>
                          <td className="py-2 pr-3" style={{ color: "var(--muted)" }}>{r.row}</td>
                          <td className="py-2 pr-3 font-mono" style={{ color: "var(--ink)" }}>{r.email}</td>
                          <td className="py-2 pr-3">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: r.status === "created" ? "rgba(16,185,129,0.1)" : r.status === "skipped" ? "rgba(202,138,4,0.1)" : "rgba(220,38,38,0.1)",
                                color: r.status === "created" ? "#16a34a" : r.status === "skipped" ? "#ca8a04" : "#dc2626",
                              }}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3" style={{ color: "var(--muted)" }}>
                            {r.status === "created"
                              ? <>Profile <strong>{r.profileNumber}</strong> · pwd: <code className="font-mono select-all">{r.tempPassword}</code></>
                              : r.reason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[11px] mt-3" style={{ color: "var(--muted)" }}>
                Temporary passwords are shown only once. Save this view or download the table before navigating away.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
