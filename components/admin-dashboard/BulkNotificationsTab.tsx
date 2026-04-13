"use client";
import { useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

export default function BulkNotificationsTab() {
  const [targetRole, setTargetRole] = useState("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    if (!confirm(`Send notification to ${targetRole === "ALL" ? "ALL users" : targetRole + " users"}?\n\nTitle: ${title}\nMessage: ${message.slice(0, 100)}...`)) return;

    setSending(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/bulk-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, title: title.trim(), message: message.trim(), sendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Notification sent to ${data.count} users!`);
        setTitle(""); setMessage("");
      } else {
        setResult(data.error || "Failed to send");
      }
    } catch { setResult("Failed to send notification"); }
    finally { setSending(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Send Bulk Notification</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Broadcast announcements to all users or specific roles</p>
      </div>

      {result && (
        <div className="rounded-xl p-3 text-sm" style={{ background: result.includes("Failed") ? "#fef2f2" : "var(--primary-light)", color: result.includes("Failed") ? "#ef4444" : "var(--ink)" }}>
          {result}
        </div>
      )}

      <form onSubmit={handleSend} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Target Audience</label>
          <div className="flex flex-wrap gap-2">
            {["ALL", "STUDENT", "HR", "ORG", "MENTOR", "INSTITUTION"].map((r) => (
              <button
                key={r} type="button" onClick={() => setTargetRole(r)}
                className="rounded-full px-4 py-2 text-xs font-medium border transition-all"
                style={{ background: targetRole === r ? "var(--ink)" : "white", color: targetRole === r ? "var(--primary)" : "var(--ink)", borderColor: targetRole === r ? "var(--ink)" : "var(--border)" }}
              >
                {r === "ALL" ? "📢 Everyone" : r === "STUDENT" ? "🎓 Students" : r === "HR" ? "👥 HRs" : r === "ORG" ? "🏢 Companies" : r === "MENTOR" ? "🧑‍🏫 Mentors" : "🏫 Institutions"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Notification Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., New Feature: Mock Interviews are live!" required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Message *</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement message here..." rows={4} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
        </div>

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="accent-[var(--ink)] w-4 h-4" />
          <span className="text-xs" style={{ color: "var(--ink)" }}>Also send as email to all recipients</span>
        </label>

        <button type="submit" disabled={sending || !title.trim() || !message.trim()} className={`${syne} rounded-xl px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
          {sending ? "Sending..." : `📢 Send to ${targetRole === "ALL" ? "Everyone" : targetRole + "s"}`}
        </button>
      </form>

      {/* Templates */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} text-sm font-bold mb-3`}>Quick Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { title: "New Feature Launch", msg: "We've just launched a new feature on SkillMap! Check it out in your dashboard.", role: "ALL" },
            { title: "New Jobs Available", msg: "New job openings matching your profile are now live. Don't miss the deadline!", role: "STUDENT" },
            { title: "Platform Maintenance", msg: "SkillMap will be under maintenance tonight from 11 PM to 2 AM IST. Sorry for the inconvenience.", role: "ALL" },
            { title: "Complete Your Profile", msg: "Your profile is incomplete. Complete it now to get better job matches and recommendations.", role: "STUDENT" },
          ].map((t) => (
            <button key={t.title} onClick={() => { setTitle(t.title); setMessage(t.msg); setTargetRole(t.role); }} className="rounded-xl border p-3 text-left transition-all hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-medium" style={{ color: "var(--ink)" }}>{t.title}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{t.msg.slice(0, 60)}...</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
