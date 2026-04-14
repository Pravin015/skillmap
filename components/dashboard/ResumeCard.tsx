"use client";
import { useState, useEffect, useRef } from "react";

const heading = "font-[family-name:var(--font-heading)]";

export default function ResumeCard() {
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("astraahire_resume_name");
    if (saved) setResumeName(saved);
  }, []);

  function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("astraahire_resume", reader.result as string);
      localStorage.setItem("astraahire_resume_name", file.name);
      setResumeName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function viewResume() {
    const data = localStorage.getItem("astraahire_resume");
    if (data) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${data}" style="width:100%;height:100%;border:none;position:fixed;inset:0"></iframe>`);
      }
    }
  }

  function removeResume() {
    localStorage.removeItem("astraahire_resume");
    localStorage.removeItem("astraahire_resume_name");
    setResumeName(null);
  }

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <h3 className={`${heading} font-bold text-base mb-1`}>Resume</h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Upload your latest resume (PDF, max 5MB)</p>

      {resumeName ? (
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "rgba(232,255,71,0.05)" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--primary)", color: "white" }}>📄</div>
          <div className="flex-1 min-w-0">
            <div className={`${heading} font-bold text-sm truncate`}>{resumeName}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Uploaded successfully</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={viewResume} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100" style={{ color: "var(--ink)" }}>View</button>
            <button onClick={() => fileRef.current?.click()} className={`text-xs ${heading} font-bold px-3 py-1.5 rounded-lg`} style={{ background: "var(--primary)", color: "white" }}>Update</button>
            <button onClick={removeResume} className="text-xs font-medium px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50">✕</button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${dragging ? "border-[var(--primary)] bg-[rgba(232,255,71,0.05)]" : "hover:border-gray-400"}`}
          style={{ borderColor: dragging ? "var(--primary)" : "var(--border)" }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="text-3xl mb-2">📎</div>
          <p className={`${heading} font-bold text-sm mb-1`}>Drop your resume here</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>or click to browse · PDF only · Max 5MB</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
