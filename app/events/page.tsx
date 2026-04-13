"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

interface Event {
  id: string; title: string; description: string; date: string; duration: string | null;
  eventType: string; pricing: string; price: number | null; maxParticipants: number;
  category: string | null; tags: string[]; status: string; location: string | null;
  coverImageUrl: string | null;
  createdBy: { name: string }; _count: { registrations: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.events || [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? events : filter === "FREE" ? events.filter((e) => e.pricing === "FREE") : events.filter((e) => e.pricing === "PAID");
  const upcoming = filtered.filter((e) => new Date(e.date) >= new Date());
  const past = filtered.filter((e) => new Date(e.date) < new Date());

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-5xl mx-auto">
          <h1 className={`${heading} font-bold text-2xl md:text-3xl text-white mb-2`}>Events</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Career guidance sessions, workshops, and webinars by industry mentors</p>
        </div>
      </section>

      <section className="py-4 px-4 md:px-8 border-b" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex gap-2">
          {["ALL", "FREE", "PAID"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs ${heading} font-bold`} style={{ background: filter === f ? "var(--ink)" : "transparent", color: filter === f ? "var(--primary)" : "var(--muted)", border: filter === f ? "none" : "1px solid var(--border)" }}>
              {f === "ALL" ? "All Events" : f}
            </button>
          ))}
        </div>
      </section>

      <section className="py-8 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="text-5xl mb-4">🎤</div>
              <p className={`${heading} font-bold text-lg mb-2`}>No events yet</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Upcoming career guidance events from mentors will appear here</p>
            </div>
          ) : (
            <div className="space-y-8">
              {upcoming.length > 0 && (
                <div>
                  <h2 className={`${heading} font-bold text-lg mb-4`}>Upcoming Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className={`${heading} font-bold text-lg mb-4`} style={{ color: "var(--muted)" }}>Past Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                    {past.map((event) => <EventCard key={event.id} event={event} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const isPast = new Date(event.date) < new Date();
  const spotsLeft = event.maxParticipants - event._count.registrations;

  return (
    <Link href={`/events/${event.id}`} className="block rounded-2xl border bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg no-underline group" style={{ borderColor: "var(--border)" }}>
      {event.coverImageUrl && (
        <div className="h-40 overflow-hidden">
          <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className={`${heading} font-bold text-base group-hover:text-[var(--primary)] transition-colors`} style={{ color: "var(--ink)" }}>{event.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>by {event.createdBy.name}</p>
        </div>
        <span className={`shrink-0 text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: event.pricing === "FREE" ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)", color: event.pricing === "FREE" ? "#16a34a" : "#7c3aed" }}>
          {event.pricing === "FREE" ? "Free" : `₹${(event.price || 0) / 100}`}
        </span>
      </div>
      <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>{event.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          📅 {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        {event.duration && <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>⏱ {event.duration}</span>}
        <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${heading}`} style={{ background: event.eventType === "VIRTUAL" ? "rgba(6,182,212,0.1)" : "rgba(245,158,11,0.1)", color: event.eventType === "VIRTUAL" ? "#0891b2" : "#d97706" }}>
          {event.eventType}
        </span>
        {event.category && <span className="text-[0.65rem] font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{event.category}</span>}
      </div>
      <div className="flex items-center justify-between text-[0.65rem]" style={{ color: "var(--muted)" }}>
        <span>{event._count.registrations} registered</span>
        {!isPast && <span className={spotsLeft <= 10 ? "text-red-500 font-bold" : ""}>{spotsLeft} spots left</span>}
        {isPast && <span>Event ended</span>}
      </div>
      </div>
    </Link>
  );
}
