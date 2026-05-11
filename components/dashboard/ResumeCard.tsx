"use client";
// Resume management widget.
//
// Was localStorage-only — which meant the apply gate's check on
// StudentProfile.resumeUrl always failed (the DB column stayed null).
// Now POSTs to /api/profile/resume so the resume actually persists on
// the server, and hydrates current state from GET /api/profile/resume.
import { useState, useEffect, useRef } from "react";

const heading = "font-[family-name:var(--font-heading)]";

export default function ResumeCard() {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchResume(); }, []);

  async function fetchResume() {
    try {
      const r = await fetch("/api/profile/resume");
      const d = await r.json();
      setResumeUrl(d.resumeUrl);
      setFileName(d.fileName || null);
    } catch { /* ignore — empty state */ }
  }

  function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") { setError("PDF files only"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5 MB"); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/profile/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume: reader.result }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Upload failed"); setUploading(false); return; }
        // Re-fetch so we get a fresh signed URL (rather than the raw
        // gcs:path returned by POST) — the GET endpoint handles that.
        await fetchResume();
        setFileName(file.name);
      } catch {
        setError("Upload failed — please try again");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => { setError("Could not read file"); setUploading(false); };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function viewResume() {
    if (!resumeUrl) return;
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  }

  async function removeResume() {
    if (!confirm("Remove your uploaded resume? You'll need to upload one again before applying to jobs.")) return;
    setUploading(true);
    try {
      await fetch("/api/profile/resume", { method: "DELETE" });
      setResumeUrl(null);
      setFileName(null);
    } finally { setUploading(false); }
  }

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <h3 className={`${heading} font-bold text-base mb-1`}>Resume</h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Upload your latest resume (PDF, max 5MB)</p>

      {error && (
        <div className="rounded-lg p-2.5 text-xs mb-3" style={{ background: "rgba(239,68,68,0.05)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {resumeUrl ? (
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "rgba(124,58,237,0.05)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--primary)", color: "white" }}>📄</div>
          <div className="flex-1 min-w-0">
            <div className={`${heading} font-bold text-sm truncate`}>{fileName || "Resume"}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Uploaded successfully</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={viewResume} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100" style={{ color: "var(--ink)" }}>View</button>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className={`text-xs ${heading} font-bold px-3 py-1.5 rounded-lg disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
              {uploading ? "..." : "Update"}
            </button>
            <button onClick={removeResume} disabled={uploading} className="text-xs font-medium px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50">✕</button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${dragging ? "border-[var(--primary)] bg-[rgba(124,58,237,0.05)]" : "hover:border-gray-400"}`}
          style={{ borderColor: dragging ? "var(--primary)" : "var(--border)" }}
          onClick={() => { if (!uploading) fileRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="text-3xl mb-2">{uploading ? "⏳" : "📎"}</div>
          <p className={`${heading} font-bold text-sm mb-1`}>{uploading ? "Uploading..." : "Drop your resume here"}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>or click to browse · PDF only · Max 5MB</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // allow re-uploading the same file
        }}
      />
    </div>
  );
}
