"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

interface Mentor {
  mentorNumber: string; currentCompany: string | null; currentRole: string | null;
  yearsOfExperience: number; rating: number; totalSessions: number; compensation: string;
  sessionRate: number | null; areaOfExpertise: string[];
  user: { name: string; profileImage: string | null };
}

export default function RealMentorCard() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentors/browse").then((r) => r.json()).then((d) => setMentors(d.mentors || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className={`${syne} font-bold text-base`}>Real Mentors</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Book 1-on-1 calls with verified industry professionals</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border animate-pulse" style={{ borderColor: "var(--border)" }}>
              <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "var(--border)" }} />
              <div className="flex-1"><div className="h-3 w-28 rounded" style={{ background: "var(--border)" }} /><div className="h-2.5 w-40 rounded mt-1.5" style={{ background: "var(--border)" }} /></div>
            </div>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-8 text-center mt-4" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🧑‍🏫</div>
          <p className={`${syne} font-bold text-sm mb-1`}>No mentors available yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Verified mentors will appear here once they're onboarded</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {mentors.slice(0, 5).map((m) => (
            <Link key={m.mentorNumber} href={`/mentor/${m.mentorNumber}`} className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
              {m.user.profileImage ? (
                <img src={m.user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>
                  {m.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`${syne} font-bold text-sm`}>{m.user.name}</span>
                  <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">✓</span>
                </div>
                <div className="text-xs truncate" style={{ color: "var(--muted)" }}>
                  {m.currentRole}{m.currentCompany ? ` · ${m.currentCompany}` : ""} · {m.yearsOfExperience}yrs
                </div>
                <div className="flex gap-2 mt-0.5 text-[0.6rem]" style={{ color: "var(--muted)" }}>
                  {m.rating > 0 && <span className="text-amber-500">★ {m.rating}</span>}
                  <span>{m.totalSessions} sessions</span>
                  <span>{m.compensation === "VOLUNTEER" ? "Free" : m.sessionRate ? `₹${m.sessionRate}` : "Paid"}</span>
                </div>
              </div>
              <span className={`shrink-0 px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.65rem]`} style={{ background: "var(--primary)", color: "white" }}>Book</span>
            </Link>
          ))}
          {mentors.length > 5 && (
            <p className="text-center text-xs mt-2"><Link href="/for-mentors" className={`${syne} font-bold no-underline`} style={{ color: "var(--ink)" }}>View all {mentors.length} mentors →</Link></p>
          )}
        </div>
      )}
    </div>
  );
}
