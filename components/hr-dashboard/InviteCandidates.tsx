"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function InviteCandidates() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Invite Candidates</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Send job invitations to potential candidates</p>
      </div>

      {/* Invite form */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-4`}>Send Invitation</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Candidate Email</label>
            <input type="email" placeholder="candidate@email.com" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Select Job Opening</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <option>No job openings created yet</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${syne}`}>Personal Message (Optional)</label>
            <textarea placeholder="Write a personalised message to the candidate..." rows={3} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors resize-none" style={{ borderColor: "var(--border)" }} />
          </div>
          <button className={`px-5 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Send Invitation</button>
        </div>
      </div>

      {/* Sent invitations */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${syne} font-bold text-base mb-2`}>Sent Invitations</h3>
        <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Track your sent invitations and their status</p>
        <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">✉️</div>
          <p className={`${syne} font-bold text-sm mb-1`}>No invitations sent yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Your sent invitations and candidate responses will appear here</p>
        </div>
      </div>
    </div>
  );
}
