"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const syne = "font-[family-name:var(--font-syne)]";

const statusBadge: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700", PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-700", COMPLETED: "bg-blue-100 text-blue-700",
};

interface Event {
  id: string; title: string; date: string; status: string; pricing: string; price: number | null;
  eventType: string; maxParticipants: number;
  createdBy: { name: string }; _count: { registrations: number };
}

export default function EventsTab() {
  const [events, setEvents] = useState<Event[]>([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState("ALL");
  const [attendeesPopup, setAttendeesPopup] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<{ registrationId: string; name: string; college: string; domain: string; level: string; paid: boolean }[]>([]);

  useEffect(() => { fetchEvents(); }, []);
  async function fetchEvents() {
    const res = await fetch("/api/events?status="); const data = await res.json();
    setEvents(data.events || []); setLoading(false);
  }

  async function showAttendees(eventId: string) {
    setAttendeesPopup(eventId);
    const res = await fetch(`/api/events/${eventId}/attendees`); const data = await res.json();
    setAttendees(data.attendees || []);
  }

  async function removeAttendee(eventId: string, registrationId: string) {
    if (!confirm("Remove this participant?")) return;
    await fetch(`/api/events/${eventId}/attendees`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId }) });
    showAttendees(eventId); fetchEvents();
  }

  async function handleAction(id: string, action: string, reason?: string) {
    await fetch(`/api/events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
    fetchEvents();
  }

  const filtered = filter === "ALL" ? events : events.filter((e) => e.status === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className={`${syne} font-bold text-xl`}>Events Management</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{events.length} events · {events.filter((e) => e.status === "PENDING_APPROVAL").length} pending approval</p></div>
        <Link href="/events/create" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--primary)", color: "white" }}>+ Create</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs ${syne} font-bold`} style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--primary)" : "var(--muted)", border: filter === s ? "none" : "1px solid var(--border)" }}>
            {s === "ALL" ? "All" : s.replace("_", " ")} ({s === "ALL" ? events.length : events.filter((e) => e.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}><div className="text-4xl mb-3">🎤</div><p className={`${syne} font-bold text-base`}>No events</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className={`${syne} font-bold`}>{e.title}</span><span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${statusBadge[e.status] || ""}`}>{e.status.replace("_", " ")}</span></div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>by {e.createdBy.name} · {new Date(e.date).toLocaleDateString()} · {e.eventType} · {e.pricing === "FREE" ? "Free" : `₹${(e.price || 0) / 100}`} · {e._count.registrations}/{e.maxParticipants} registered</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {e.status === "PENDING_APPROVAL" && (
                    <><button onClick={() => handleAction(e.id, "approve")} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Approve</button>
                    <button onClick={() => handleAction(e.id, "reject", "Does not meet guidelines")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Reject</button></>
                  )}
                  {e.status === "APPROVED" && <button onClick={() => handleAction(e.id, "cancel")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancel</button>}
                  <button onClick={() => showAttendees(e.id)} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--primary)", color: "white" }}>Attendees</button>
                  <Link href={`/events/${e.id}`} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              {attendees.length === 0 ? (
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
  );
}
