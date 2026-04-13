"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

const tabs = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "sessions", label: "Sessions", icon: "📅" },
  { id: "events", label: "My Events", icon: "🎤" },
  { id: "profile", label: "My Profile", icon: "👤" },
];

const statusBadge: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-700", ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700", COMPLETED: "bg-blue-100 text-blue-700", CANCELLED: "bg-gray-100 text-gray-700",
};

interface Session { id: string; sessionType: string; status: string; preferredDate: string; message: string | null; duration: string | null; isPaid: boolean; price: number | null; meetingLink: string | null; rating: number | null; review: string | null; student: { name: string; email: string } | null; createdAt: string }
interface Event { id: string; title: string; date: string; status: string; pricing: string; price: number | null; _count: { registrations: number } }

export default function MentorDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptLink, setAcceptLink] = useState<{ id: string; link: string; notes: string }>({ id: "", link: "", notes: "" });
  const [attendeesPopup, setAttendeesPopup] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<{ registrationId: string; userId: string; name: string; college: string; domain: string; level: string; paid: boolean; joinedAt: string }[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  async function showAttendees(eventId: string) {
    setAttendeesPopup(eventId); setLoadingAttendees(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`);
      const data = await res.json();
      setAttendees(data.attendees || []);
    } catch { setAttendees([]); }
    finally { setLoadingAttendees(false); }
  }

  async function removeAttendee(eventId: string, registrationId: string) {
    if (!confirm("Remove this participant?")) return;
    await fetch(`/api/events/${eventId}/attendees`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId }) });
    showAttendees(eventId); // refresh
    fetchData(); // refresh counts
  }

  const userRole = (session?.user as { role?: string })?.role;

  const fetchData = useCallback(async () => {
    try {
      const [sessRes, evtRes] = await Promise.all([
        fetch("/api/sessions").then((r) => r.json()),
        fetch("/api/events?mine=true").then((r) => r.json()),
      ]);
      setSessions(sessRes.sessions || []);
      setEvents(evtRes.events || []);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login?role=MENTOR"); return; }
    if (status === "authenticated" && userRole !== "MENTOR" && userRole !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") fetchData();
  }, [status, userRole, router, fetchData]);

  async function handleAction(sessionId: string, action: string, data?: Record<string, unknown>) {
    await fetch(`/api/sessions/${sessionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...data }) });
    fetchData();
  }

  if (status === "loading" || loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  const pending = sessions.filter((s) => s.status === "REQUESTED");
  const upcoming = sessions.filter((s) => s.status === "ACCEPTED" && new Date(s.preferredDate) >= new Date());
  const completed = sessions.filter((s) => s.status === "COMPLETED");

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-16 h-[calc(100vh-4rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3"><div className={`${syne} font-bold text-sm`} style={{ color: "var(--ink)" }}>Mentor Panel</div><div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{session?.user?.name}</div></div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {tabs.map((t) => (<button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors" style={{ background: activeTab === t.id ? "var(--ink)" : "transparent", color: activeTab === t.id ? "var(--primary)" : "var(--muted)", fontWeight: activeTab === t.id ? 700 : 400 }}><span className="text-base">{t.icon}</span><span className={syne}>{t.label}</span></button>))}
        </nav>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {tabs.map((t) => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[0.6rem] ${syne}`} style={{ background: activeTab === t.id ? "var(--ink)" : "transparent", color: activeTab === t.id ? "var(--primary)" : "var(--muted)" }}><span className="text-sm">{t.icon}</span>{t.label}</button>))}
      </div>

      <div className="flex-1 px-4 md:px-8 py-8 pb-24 lg:pb-8 max-w-5xl">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div><h2 className={`${syne} font-extrabold text-xl`}>Welcome, {session?.user?.name}</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Your mentorship overview</p></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Pending Requests", value: pending.length, icon: "⏳", color: "#f59e0b" },
                { label: "Upcoming Sessions", value: upcoming.length, icon: "📅", color: "#4285f4" },
                { label: "Completed", value: completed.length, icon: "✅", color: "#22c55e" },
                { label: "My Events", value: events.length, icon: "🎤", color: "#8b5cf6" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-3"><span className="text-2xl">{s.icon}</span><div className="w-8 h-1 rounded-full" style={{ background: s.color }} /></div>
                  <div className={`${syne} text-2xl font-extrabold`}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {pending.length > 0 && (
              <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                <h3 className={`${syne} font-bold text-base mb-4`}>Pending Requests ({pending.length})</h3>
                {pending.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border mb-2" style={{ borderColor: "var(--border)" }}>
                    <div className="flex-1"><div className={`${syne} font-bold text-sm`}>{s.student?.name}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{s.sessionType} · {new Date(s.preferredDate).toLocaleDateString()} · {s.duration}{s.message ? ` · "${s.message}"` : ""}</div></div>
                    <button onClick={() => setActiveTab("sessions")} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Respond</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3"><Link href="/events/create" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>+ Create Event</Link></div>
          </div>
        )}

        {/* SESSIONS */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div><h2 className={`${syne} font-bold text-xl`}>Session Requests</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{sessions.length} total sessions</p></div>
            {sessions.length === 0 ? (
              <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}><div className="text-4xl mb-3">📅</div><p className={`${syne} font-bold text-base`}>No sessions yet</p><p className="text-sm" style={{ color: "var(--muted)" }}>Students will appear here when they request sessions</p></div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className={`${syne} font-bold`}>{s.student?.name || "Student"}</span><span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${statusBadge[s.status]}`}>{s.status}</span><span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${s.sessionType === "GROUP" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{s.sessionType === "GROUP" ? "Group" : "1-on-1"}</span></div>
                        <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{new Date(s.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {s.duration}{s.isPaid ? ` · ₹${(s.price || 0) / 100}` : " · Free"}</div>
                        {s.message && <div className="text-xs mt-1 italic" style={{ color: "var(--muted)" }}>&quot;{s.message}&quot;</div>}
                        {s.rating && <div className="text-xs mt-1" style={{ color: "#f59e0b" }}>★ {s.rating}/5{s.review ? ` — "${s.review}"` : ""}</div>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {s.status === "REQUESTED" && (
                          <>
                            <div className="flex flex-col gap-2">
                              <input value={acceptLink.id === s.id ? acceptLink.link : ""} onChange={(e) => setAcceptLink({ ...acceptLink, id: s.id, link: e.target.value })} placeholder="Zoom/Meet link" className="rounded-lg border px-3 py-1.5 text-xs w-48" style={{ borderColor: "var(--border)" }} />
                              <div className="flex gap-2">
                                <button onClick={() => handleAction(s.id, "accept", { meetingLink: acceptLink.link, mentorNotes: acceptLink.notes })} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Accept</button>
                                <button onClick={() => handleAction(s.id, "reject", { reason: "Schedule conflict" })} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Decline</button>
                              </div>
                            </div>
                          </>
                        )}
                        {s.status === "ACCEPTED" && <button onClick={() => handleAction(s.id, "complete")} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Mark Complete</button>}
                        {s.status === "ACCEPTED" && s.meetingLink && <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-[0.7rem] font-bold bg-green-100 text-green-700 no-underline">Join</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY EVENTS */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><div><h2 className={`${syne} font-bold text-xl`}>My Events</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{events.length} events</p></div>
              <Link href="/events/create" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>+ Create</Link></div>
            {events.length === 0 ? (
              <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}><div className="text-4xl mb-3">🎤</div><p className={`${syne} font-bold text-base`}>No events</p><Link href="/events/create" className={`inline-block mt-3 px-4 py-2 rounded-lg ${syne} font-bold text-xs no-underline`} style={{ background: "var(--primary)", color: "white" }}>Create your first event</Link></div>
            ) : (
              <div className="space-y-3">{events.map((e) => (
                <div key={e.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
                  <div className="flex-1 min-w-0"><div className={`${syne} font-bold`}>{e.title}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{new Date(e.date).toLocaleDateString()} · {e.pricing === "FREE" ? "Free" : `₹${(e.price || 0) / 100}`} · {e._count.registrations} registered</div></div>
                  <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full shrink-0 ${e.status === "APPROVED" ? "bg-green-100 text-green-700" : e.status === "PENDING_APPROVAL" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>{e.status.replace("_", " ")}</span>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => showAttendees(e.id)} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Attendees ({e._count.registrations})</button>
                    <Link href={`/events/${e.id}`} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View</Link>
                  </div>
                </div>
              ))}</div>
            )}

            {/* Attendees Popup */}
            {attendeesPopup && (
                <>
                  <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setAttendeesPopup(null)} />
                  <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-2xl mx-auto rounded-2xl border bg-white shadow-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                      <div><h3 className={`${syne} font-bold text-base`}>Event Attendees</h3><p className="text-xs" style={{ color: "var(--muted)" }}>{attendees.length} registered</p></div>
                      <button onClick={() => setAttendeesPopup(null)} className="text-xl" style={{ color: "var(--muted)" }}>✕</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingAttendees ? (
                        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
                      ) : attendees.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No attendees yet</div>
                      ) : (
                        <table className="w-full">
                          <thead><tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}><th className="px-6 py-2">#</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Background</th><th className="px-3 py-2">Domain</th><th className="px-3 py-2">Paid</th><th className="px-3 py-2">Action</th></tr></thead>
                          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                            {attendees.map((a, i) => (
                              <tr key={a.registrationId} className="text-sm hover:bg-gray-50">
                                <td className="px-6 py-2.5" style={{ color: "var(--muted)" }}>{i + 1}</td>
                                <td className={`px-3 py-2.5 ${syne} font-bold`}>{a.name}</td>
                                <td className="px-3 py-2.5" style={{ color: "var(--muted)" }}>{a.college} · {a.level}</td>
                                <td className="px-3 py-2.5" style={{ color: "var(--muted)" }}>{a.domain}</td>
                                <td className="px-3 py-2.5"><span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${a.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{a.paid ? "Paid" : "Unpaid"}</span></td>
                                <td className="px-3 py-2.5"><button onClick={() => removeAttendee(attendeesPopup, a.registrationId)} className="text-[0.65rem] font-medium text-red-500 hover:text-red-700">Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div className="px-6 py-3 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Contact information hidden for privacy</div>
                  </div>
                </>
              )}
          </div>
        )}

        {/* MY PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div><h2 className={`${syne} font-bold text-xl`}>My Mentor Profile</h2></div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/profile/edit" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>Edit Profile</Link>
              <Link href="/settings" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline border`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>Account Settings</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
