"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
const syne = "font-[family-name:var(--font-syne)]";

interface EventDetail {
  id: string; title: string; description: string; agenda: string | null; benefits: string | null;
  date: string; endDate: string | null; duration: string | null; eventType: string; location: string | null;
  pricing: string; price: number | null; minParticipants: number; maxParticipants: number;
  joinLink: string | null; joinInstructions: string | null; status: string; category: string | null;
  tags: string[]; createdAt: string;
  createdBy: { name: string; role: string; mentorProfile: { mentorNumber: string; currentCompany: string | null; status: string } | null };
  registrations: { user: { name: string } }[];
  _count: { registrations: number };
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}`).then((r) => r.json()).then((d) => {
      if (d.event) { setEvent(d.event); setIsRegistered(d.isRegistered); setHasPaid(d.hasPaid); }
    }).finally(() => setLoading(false));
  }, [eventId]);

  async function handleJoin() {
    setJoining(true); setMessage(null);
    try {
      const res = await fetch("/api/events/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId }) });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      if (data.requiresPayment) {
        setMessage({ type: "error", text: `This is a paid event (₹${(data.amount || 0) / 100}). Payment integration for events coming soon.` });
        setIsRegistered(true);
      } else {
        setMessage({ type: "success", text: "Successfully registered! See joining details below." });
        setIsRegistered(true); setHasPaid(true);
        // Refresh to get join link
        const refresh = await fetch(`/api/events/${eventId}`).then((r) => r.json());
        if (refresh.event) setEvent(refresh.event);
      }
    } catch { setMessage({ type: "error", text: "Failed to register" }); }
    finally { setJoining(false); }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;
  if (!event) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">🎤</div><h1 className={`${syne} font-bold text-xl`}>Event not found</h1><Link href="/events" className={`inline-block mt-4 px-5 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Browse events</Link></div></div>;

  const isPast = new Date(event.date) < new Date();
  const isFull = event._count.registrations >= event.maxParticipants;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}><Link href="/events" className="no-underline hover:underline" style={{ color: "var(--muted)" }}>Events</Link><span>→</span><span>{event.title}</span></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="h-2" style={{ background: event.status === "APPROVED" ? "var(--accent)" : "var(--border)" }} />
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${syne}`} style={{ background: event.pricing === "FREE" ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)", color: event.pricing === "FREE" ? "#16a34a" : "#7c3aed" }}>
                    {event.pricing === "FREE" ? "Free Event" : `₹${(event.price || 0) / 100}`}
                  </span>
                  <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${syne}`} style={{ background: event.eventType === "VIRTUAL" ? "rgba(6,182,212,0.1)" : "rgba(245,158,11,0.1)", color: event.eventType === "VIRTUAL" ? "#0891b2" : "#d97706" }}>{event.eventType}</span>
                  {isPast && <span className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Ended</span>}
                </div>
                <h1 className={`${syne} font-extrabold text-xl md:text-2xl mb-2`}>{event.title}</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>by <strong>{event.createdBy.name}</strong>{event.createdBy.mentorProfile?.currentCompany ? ` · ${event.createdBy.mentorProfile.currentCompany}` : ""}</p>
                {event.createdBy.mentorProfile && (
                  <Link href={`/mentor/${event.createdBy.mentorProfile.mentorNumber}`} className={`inline-block mt-2 text-xs ${syne} font-bold no-underline`} style={{ color: "var(--accent)", background: "var(--ink)", padding: "2px 8px", borderRadius: "6px" }}>View mentor profile</Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--muted)" }}>Date</div><div className={`${syne} font-bold text-sm mt-0.5`}>{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div></div>
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--muted)" }}>Time</div><div className={`${syne} font-bold text-sm mt-0.5`}>{new Date(event.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div></div>
              {event.duration && <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--muted)" }}>Duration</div><div className={`${syne} font-bold text-sm mt-0.5`}>{event.duration}</div></div>}
              <div className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--border)" }}><div className="text-xs" style={{ color: "var(--muted)" }}>Spots</div><div className={`${syne} font-bold text-sm mt-0.5`}>{event._count.registrations}/{event.maxParticipants}</div></div>
            </div>

            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}><h2 className={`${syne} font-bold text-base mb-3`}>About this event</h2><div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{event.description}</div></div>
            {event.agenda && <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}><h2 className={`${syne} font-bold text-base mb-3`}>Agenda</h2><div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{event.agenda}</div></div>}
            {event.benefits && <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}><h2 className={`${syne} font-bold text-base mb-3`}>What you&apos;ll gain</h2><div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--muted)" }}>{event.benefits}</div></div>}
            {event.location && event.eventType !== "VIRTUAL" && <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}><h2 className={`${syne} font-bold text-base mb-3`}>Location</h2><p className="text-sm" style={{ color: "var(--muted)" }}>{event.location}</p></div>}

            {/* Join link — only for registered + paid users */}
            {isRegistered && event.joinLink && (event.pricing === "FREE" || hasPaid) && (
              <div className="rounded-2xl p-6" style={{ background: "var(--ink)" }}>
                <h2 className={`${syne} font-bold text-base text-white mb-2`}>Join Event</h2>
                <a href={event.joinLink} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${syne} font-bold text-sm no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--accent)", color: "var(--ink)" }}>Join now →</a>
                {event.joinInstructions && <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>{event.joinInstructions}</p>}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 sticky top-20" style={{ borderColor: "var(--border)" }}>
              {message && <div className={`rounded-xl p-3 text-sm mb-4 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

              {!session ? (
                <><p className={`${syne} font-bold text-base mb-2`}>Join this event</p><Link href="/auth/login" className={`block w-full text-center py-3 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Login to register</Link></>
              ) : isPast ? (
                <><div className="text-center py-4"><div className="text-3xl mb-2">⏰</div><p className={`${syne} font-bold`}>Event has ended</p></div></>
              ) : isFull && !isRegistered ? (
                <><div className="text-center py-4"><div className="text-3xl mb-2">🚫</div><p className={`${syne} font-bold`}>Event is full</p></div></>
              ) : isRegistered ? (
                <><div className="text-center py-4"><div className="text-3xl mb-2">✅</div><p className={`${syne} font-bold`}>You&apos;re registered</p><p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{event.pricing === "PAID" && !hasPaid ? "Payment pending — link hidden until paid" : "See joining details above"}</p></div></>
              ) : (
                <><button onClick={handleJoin} disabled={joining} className={`w-full py-3.5 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--accent)", color: "var(--ink)" }}>{joining ? "Registering..." : event.pricing === "FREE" ? "Join for free →" : `Register · ₹${(event.price || 0) / 100}`}</button><p className="text-center text-[0.65rem] mt-2" style={{ color: "var(--muted)" }}>{event.maxParticipants - event._count.registrations} spots remaining</p></>
              )}

              <hr className="my-4" style={{ borderColor: "var(--border)" }} />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Hosted by</span><span className="font-medium">{event.createdBy.name}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Category</span><span className="font-medium">{event.category || "General"}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Registered</span><span className="font-medium">{event._count.registrations}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--muted)" }}>Capacity</span><span className="font-medium">{event.maxParticipants}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
