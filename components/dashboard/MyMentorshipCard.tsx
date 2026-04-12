"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const syne = "font-[family-name:var(--font-syne)]";

const statusBadge: Record<string, string> = { REQUESTED: "bg-yellow-100 text-yellow-700", ACCEPTED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700", COMPLETED: "bg-blue-100 text-blue-700", CANCELLED: "bg-gray-100 text-gray-700" };

interface Session {
  id: string; sessionType: string; status: string; preferredDate: string;
  message: string | null; duration: string | null; isPaid: boolean; price: number | null;
  meetingLink: string | null; rating: number | null;
  mentor: { mentorNumber: string; currentCompany: string | null; currentRole: string | null; name: string; profileImage: string | null } | null;
}

export default function MyMentorshipCard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingSession, setRatingSession] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [review, setReview] = useState("");

  useEffect(() => { fetch("/api/sessions").then((r) => r.json()).then((d) => setSessions(d.sessions || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  async function submitRating(sessionId: string) {
    await fetch(`/api/sessions/${sessionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rate", rating: ratingValue, review }) });
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, rating: ratingValue } : s));
    setRatingSession(null); setReview("");
  }

  const upcoming = sessions.filter((s) => s.status === "ACCEPTED" && new Date(s.preferredDate) >= new Date());
  const pending = sessions.filter((s) => s.status === "REQUESTED");
  const past = sessions.filter((s) => s.status === "COMPLETED" || (s.status === "ACCEPTED" && new Date(s.preferredDate) < new Date()));

  if (loading) return <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}><div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div></div>;

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${syne} font-bold text-base`}>My Mentorship</h3>
        <span className={`${syne} text-xs font-bold px-2 py-1 rounded-lg`} style={{ background: sessions.length > 0 ? "var(--ink)" : "var(--border)", color: sessions.length > 0 ? "var(--accent)" : "var(--muted)" }}>{sessions.length}</span>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>Your booked sessions with mentors</p>

      {sessions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🧑‍🏫</div>
          <p className={`${syne} font-bold text-sm mb-1`}>No sessions yet</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Browse mentors and book a session to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div className={`${syne} text-xs font-bold mb-2`} style={{ color: "var(--muted)" }}>UPCOMING</div>
              {upcoming.map((s) => (
                <SessionCard key={s.id} s={s} onRate={() => setRatingSession(s.id)} />
              ))}
            </div>
          )}
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <div className={`${syne} text-xs font-bold mb-2`} style={{ color: "var(--muted)" }}>PENDING RESPONSE</div>
              {pending.map((s) => <SessionCard key={s.id} s={s} />)}
            </div>
          )}
          {/* Past */}
          {past.length > 0 && (
            <div>
              <div className={`${syne} text-xs font-bold mb-2`} style={{ color: "var(--muted)" }}>PAST</div>
              {past.map((s) => <SessionCard key={s.id} s={s} onRate={!s.rating ? () => setRatingSession(s.id) : undefined} />)}
            </div>
          )}
        </div>
      )}

      {/* Rating modal */}
      {ratingSession && (
        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
          <div className={`${syne} font-bold text-sm mb-2`}>Rate this session</div>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => setRatingValue(v)} className="text-xl" style={{ color: v <= ratingValue ? "#f59e0b" : "var(--border)" }}>★</button>
            ))}
          </div>
          <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write a review (optional)" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm resize-none mb-2" style={{ borderColor: "var(--border)" }} />
          <div className="flex gap-2">
            <button onClick={() => submitRating(ratingSession)} className={`px-4 py-1.5 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Submit</button>
            <button onClick={() => setRatingSession(null)} className="text-xs" style={{ color: "var(--muted)" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ s, onRate }: { s: Session; onRate?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border mb-2 transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
      {s.mentor?.profileImage ? (
        <img src={s.mentor.profileImage} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-[family-name:var(--font-syne)] font-bold text-xs text-white shrink-0`} style={{ background: "var(--ink)" }}>{s.mentor?.name?.charAt(0) || "M"}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-[family-name:var(--font-syne)] font-bold text-sm`}>{s.mentor?.name || "Mentor"}</span>
          <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${statusBadge[s.status]}`}>{s.status}</span>
          <span className={`text-[0.6rem] px-2 py-0.5 rounded-full ${s.sessionType === "GROUP" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{s.sessionType === "GROUP" ? "Group" : "1-on-1"}</span>
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {new Date(s.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {s.duration}{s.isPaid ? ` · ₹${(s.price || 0) / 100}` : " · Free"}
        </div>
        {s.rating && <div className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>★ {s.rating}/5</div>}
      </div>
      <div className="flex gap-2 shrink-0">
        {s.status === "ACCEPTED" && s.meetingLink && (
          <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-[0.7rem] font-bold bg-green-100 text-green-700 no-underline">Join</a>
        )}
        {s.mentor?.mentorNumber && (
          <Link href={`/mentor/${s.mentor.mentorNumber}`} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Profile</Link>
        )}
        {onRate && <button onClick={onRate} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Rate</button>}
      </div>
    </div>
  );
}
