"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function HRInterestCard() {
  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${syne} font-bold text-base`}>HR / Companies Interested</h3>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Companies and recruiters who view or shortlist your profile</p>

      <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
        <div className="text-3xl mb-3">👥</div>
        <p className={`${syne} font-bold text-sm mb-1`}>No interest yet</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>Complete your profile and upload your resume to attract recruiters</p>
      </div>
    </div>
  );
}
