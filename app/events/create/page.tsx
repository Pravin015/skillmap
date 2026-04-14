"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--ink)] transition-colors";
const labelClass = `block text-sm font-medium mb-1.5 ${heading}`;

export default function CreateEventPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState("FREE");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage(null);
    const form = e.target as HTMLFormElement;
    const d = new FormData(form);
    try {
      const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: d.get("title"), description: d.get("description"), agenda: d.get("agenda"),
          benefits: d.get("benefits"), date: d.get("date"), endDate: d.get("endDate") || null,
          duration: d.get("duration"), eventType: d.get("eventType"), location: d.get("location"),
          pricing, price: pricing === "PAID" ? parseInt(d.get("price") as string || "0") * 100 : null,
          minParticipants: d.get("minParticipants"), maxParticipants: d.get("maxParticipants"),
          joinLink: d.get("joinLink"), joinInstructions: d.get("joinInstructions"),
          category: d.get("category"), tags: (d.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || [],
          coverImageUrl: coverImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      setMessage({ type: "success", text: data.autoApproved ? "Event created and published!" : "Event created — pending admin approval." });
      setTimeout(() => router.push("/events"), 2000);
    } catch { setMessage({ type: "error", text: "Failed to create event" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8"><h1 className={`${heading} font-bold text-2xl`}>Create Event</h1><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Host a career guidance session, workshop, or webinar</p></div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 md:p-8 space-y-6" style={{ borderColor: "var(--border)" }}>
          {message && <div className={`rounded-xl p-4 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}

          {/* Basic */}
          {/* Cover Image */}
          <div>
            <h2 className={`${heading} font-bold text-base mb-4`}>Cover Image</h2>
            <div className="flex items-center gap-4">
              {coverImage ? (
                <img src={coverImage} alt="" className="w-32 h-20 rounded-xl object-cover" />
              ) : (
                <div className="w-32 h-20 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--border)" }}>🖼️</div>
              )}
              <div>
                <label className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs cursor-pointer`} style={{ background: "var(--primary)", color: "white" }}>
                  {coverImage ? "Change image" : "Upload thumbnail"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 1024 * 1024) { alert("Max 1MB"); return; }
                    const reader = new FileReader();
                    reader.onload = () => setCoverImage(reader.result as string);
                    reader.readAsDataURL(f);
                  }} />
                </label>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Recommended: 1200x630px · Max 1MB</p>
              </div>
            </div>
          </div>

          <div><h2 className={`${heading} font-bold text-base mb-4`}>Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2"><label className={labelClass}>Event Title *</label><input name="title" required placeholder="e.g. Cybersecurity Career Roadmap 2026" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Category</label><select name="category" className={inputClass} style={{ borderColor: "var(--border)" }}><option value="">Select</option><option>Career Guidance</option><option>Resume Review</option><option>Interview Prep</option><option>Skill Workshop</option><option>Industry Insights</option><option>Q&A Session</option><option>Hackathon</option><option>Other</option></select></div>
              <div><label className={labelClass}>Tags</label><input name="tags" placeholder="e.g. cybersecurity, fresher, TCS (comma separated)" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </div>
          </div>

          <div><label className={labelClass}>Description *</label><textarea name="description" required placeholder="What is this event about?" rows={4} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Agenda</label><textarea name="agenda" placeholder="Outline the topics or schedule..." rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
          <div><label className={labelClass}>Benefits for Participants</label><textarea name="benefits" placeholder="What will attendees learn or gain?" rows={3} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>

          {/* Date & Time */}
          <div><h2 className={`${heading} font-bold text-base mb-4`}>Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className={labelClass}>Start Date & Time *</label><input name="date" type="datetime-local" required className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>End Date & Time</label><input name="endDate" type="datetime-local" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Duration</label><input name="duration" placeholder="e.g. 1 hour, 90 minutes" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </div>
          </div>

          {/* Type & Location */}
          <div><h2 className={`${heading} font-bold text-base mb-4`}>Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={labelClass}>Event Type *</label><select name="eventType" required className={inputClass} style={{ borderColor: "var(--border)" }}><option value="VIRTUAL">Virtual</option><option value="PHYSICAL">Physical</option><option value="HYBRID">Hybrid</option></select></div>
              <div><label className={labelClass}>Location (if physical/hybrid)</label><input name="location" placeholder="e.g. Bangalore, IIT Campus" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </div>
          </div>

          {/* Pricing */}
          <div><h2 className={`${heading} font-bold text-base mb-4`}>Pricing</h2>
            <div className="flex gap-3 mb-4">
              {["FREE", "PAID"].map((p) => (
                <button key={p} type="button" onClick={() => setPricing(p)} className={`px-5 py-2.5 rounded-xl text-sm ${heading} font-bold`} style={{ background: pricing === p ? "var(--ink)" : "white", color: pricing === p ? "var(--primary)" : "var(--muted)", border: pricing === p ? "none" : "1px solid var(--border)" }}>{p === "FREE" ? "Free Event" : "Paid Event"}</button>
              ))}
            </div>
            {pricing === "PAID" && <div><label className={labelClass}>Price (₹) *</label><input name="price" type="number" min="1" placeholder="e.g. 499" className={inputClass} style={{ borderColor: "var(--border)" }} /><p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Only paid participants will see the joining link</p></div>}
          </div>

          {/* Capacity */}
          <div><h2 className={`${heading} font-bold text-base mb-4`}>Capacity</h2>
            <div className="grid grid-cols-2 gap-5">
              <div><label className={labelClass}>Min Participants</label><input name="minParticipants" type="number" min="1" defaultValue="1" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
              <div><label className={labelClass}>Max Participants</label><input name="maxParticipants" type="number" min="1" defaultValue="100" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            </div>
          </div>

          {/* Join link */}
          <div><h2 className={`${heading} font-bold text-base mb-4`}>Joining Details</h2>
            <div className="space-y-4">
              <div><label className={labelClass}>Meeting Link (Zoom/Google Meet/Teams)</label><input name="joinLink" type="url" placeholder="https://zoom.us/j/..." className={inputClass} style={{ borderColor: "var(--border)" }} /><p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{pricing === "PAID" ? "This link will only be visible to paid participants" : "This link will be visible to all registered participants"}</p></div>
              <div><label className={labelClass}>Joining Instructions</label><textarea name="joinInstructions" placeholder="Any special instructions for joining..." rows={2} className={`${inputClass} resize-none`} style={{ borderColor: "var(--border)" }} /></div>
            </div>
          </div>

          <div className="rounded-xl p-4 text-sm border" style={{ background: "rgba(10,191,188,0.05)", borderColor: "rgba(10,191,188,0.2)" }}>
            <strong className={heading}>Approval:</strong> Verified mentors&apos; events are auto-approved. Unverified mentors&apos; events require admin approval before they go live.
          </div>

          <button type="submit" disabled={saving} className={`px-8 py-3 rounded-xl ${heading} font-bold text-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Creating..." : "Create Event"}</button>
        </form>
      </div>
    </div>
  );
}
