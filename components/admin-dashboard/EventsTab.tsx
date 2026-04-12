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

  useEffect(() => { fetchEvents(); }, []);
  async function fetchEvents() {
    const res = await fetch("/api/events?status="); const data = await res.json();
    setEvents(data.events || []); setLoading(false);
  }

  async function handleAction(id: string, action: string, reason?: string) {
    await fetch(`/api/events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
    fetchEvents();
  }

  const filtered = filter === "ALL" ? events : events.filter((e) => e.status === filter);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className={`${syne} font-bold text-xl`}>Events Management</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{events.length} events · {events.filter((e) => e.status === "PENDING_APPROVAL").length} pending approval</p></div>
        <Link href="/events/create" className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ Create</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs ${syne} font-bold`} style={{ background: filter === s ? "var(--ink)" : "white", color: filter === s ? "var(--accent)" : "var(--muted)", border: filter === s ? "none" : "1px solid var(--border)" }}>
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
                    <><button onClick={() => handleAction(e.id, "approve")} className={`px-3 py-1.5 rounded-lg ${syne} font-bold text-[0.7rem]`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Approve</button>
                    <button onClick={() => handleAction(e.id, "reject", "Does not meet guidelines")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium text-red-500 border border-red-200 hover:bg-red-50">Reject</button></>
                  )}
                  {e.status === "APPROVED" && <button onClick={() => handleAction(e.id, "cancel")} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancel</button>}
                  <Link href={`/events/${e.id}`} className="px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border no-underline hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
