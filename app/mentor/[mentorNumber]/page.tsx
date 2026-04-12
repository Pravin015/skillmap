"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const syne = "font-[family-name:var(--font-syne)]";

interface MentorData {
  id: string;
  mentorNumber: string;
  status: string;
  headline: string | null;
  bio: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  collegeName: string | null;
  yearsOfExperience: number;
  companiesWorked: string[];
  areaOfExpertise: string[];
  menteesHelped: number;
  rating: number;
  totalSessions: number;
  compensation: string;
  sessionRate: number | null;
  groupSessionRate: number | null;
  availability: string | null;
  linkedinUrl: string | null;
  mentorTopics: string[];
  achievements: { title: string; description: string | null; imageUrl: string | null }[];
  user: { name: string; profileImage?: string | null };
}

export default function MentorProfilePage() {
  const params = useParams();
  const mentorNumber = params.mentorNumber as string;
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);

  // Load Razorpay script eagerly
  useEffect(() => {
    if (!document.getElementById("rzp-mentor")) {
      const s = document.createElement("script"); s.id = "rzp-mentor"; s.src = "https://checkout.razorpay.com/v1/checkout.js"; document.body.appendChild(s);
    }
  }, []);
  const [sessionType, setSessionType] = useState("ONE_ON_ONE");
  const [prefDate, setPrefDate] = useState("");
  const [sessionMsg, setSessionMsg] = useState("");
  const [bookingStatus, setBookingStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/mentor/${mentorNumber}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setMentor(data.mentor);
      } catch { setError("Failed to load mentor profile"); }
      finally { setLoading(false); }
    }
    load();
  }, [mentorNumber]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;
  }

  if (error || !mentor) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className={`${syne} font-bold text-xl mb-2`}>{error || "Mentor not found"}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>This mentor profile may not exist.</p>
        </div>
      </div>
    );
  }

  const m = mentor;
  const isVerified = m.status === "VERIFIED";
  const isPending = m.status === "PENDING";

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header card */}
        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="h-2" style={{ background: isVerified ? "var(--accent)" : isPending ? "#f59e0b" : "#ef4444" }} />
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {m.user.profileImage ? (
                <img src={m.user.profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${syne} font-extrabold text-2xl shrink-0`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
                  {m.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`${syne} font-extrabold text-xl`}>{m.user.name}</h1>
                  {/* Verified badge */}
                  {isVerified ? (
                    <span className={`inline-flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${syne} bg-green-100 text-green-700`}>
                      ✓ Verified Mentor
                    </span>
                  ) : isPending ? (
                    <span className={`inline-flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${syne} bg-yellow-100 text-yellow-700`}>
                      ⏳ Verification Pending
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${syne} bg-red-100 text-red-700`}>
                      ✕ Unverified
                    </span>
                  )}
                </div>
                {m.headline && (
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{m.headline}</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {m.currentCompany && (
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${syne}`} style={{ background: "var(--ink)", color: "var(--accent)" }}>{m.currentCompany}</span>
                  )}
                  {m.compensation === "VOLUNTEER" && (
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Free / Volunteer</span>
                  )}
                  {m.compensation === "PAID" && m.sessionRate && (
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">₹{m.sessionRate}/session</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs mt-3" style={{ color: "var(--muted)" }}>Mentor ID: {m.mentorNumber}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl border bg-white p-4 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-2xl font-extrabold`}>{m.yearsOfExperience}</div>
            <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--muted)" }}>Years Exp.</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-2xl font-extrabold`}>{m.menteesHelped}</div>
            <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--muted)" }}>Mentees Helped</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-2xl font-extrabold`}>{m.totalSessions}</div>
            <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--muted)" }}>Sessions</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-2xl font-extrabold`} style={{ color: m.rating >= 4.5 ? "#22c55e" : "#f59e0b" }}>
              {m.rating > 0 ? `${m.rating}★` : "—"}
            </div>
            <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--muted)" }}>Rating</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 text-center" style={{ borderColor: "var(--border)" }}>
            <div className={`${syne} text-2xl font-extrabold`}>{m.companiesWorked.length}</div>
            <div className="text-[0.65rem] mt-0.5" style={{ color: "var(--muted)" }}>Companies</div>
          </div>
        </div>

        {/* Schedule call CTA */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--ink)" }}>
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className={`${syne} font-bold text-base text-white`}>Book a Mentorship Session</h3>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {m.availability ? `Available ${m.availability}` : "Check availability"} · {m.compensation === "VOLUNTEER" ? "Free session" : m.sessionRate ? `1-on-1: ₹${m.sessionRate}${m.groupSessionRate ? ` · Group: ₹${m.groupSessionRate}` : ""}` : "Pricing not set"}
                </p>
              </div>
              <button
                onClick={() => setShowSchedule(true)}
                className={`px-6 py-3 rounded-xl ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`}
                style={{ background: "var(--accent)", color: "var(--ink)" }}
              >
                Schedule Call →
              </button>
            </div>
            {showSchedule && (
              <div className="mt-4 rounded-xl p-5 border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                {bookingStatus && <div className={`rounded-lg p-3 text-sm mb-3 ${bookingStatus.type === "success" ? "bg-green-900/30 text-green-300 border border-green-800" : "bg-red-900/30 text-red-300 border border-red-800"}`}>{bookingStatus.text}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs mb-1 text-white/50">Session Type</label>
                    <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <option value="ONE_ON_ONE">1-on-1 {m.sessionRate ? `(₹${m.sessionRate})` : "(Free)"}</option>
                      <option value="GROUP">Group {m.compensation === "PAID" ? `(₹${m.groupSessionRate || m.sessionRate || 0})` : "(Free)"}</option>
                    </select></div>
                  <div><label className="block text-xs mb-1 text-white/50">Preferred Date & Time *</label>
                    <input type="datetime-local" value={prefDate} onChange={(e) => setPrefDate(e.target.value)} required className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }} /></div>
                </div>
                <div className="mb-3"><label className="block text-xs mb-1 text-white/50">Message to mentor (optional)</label>
                  <textarea value={sessionMsg} onChange={(e) => setSessionMsg(e.target.value)} placeholder="What do you want to discuss?" rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }} /></div>
                <button disabled={booking || !prefDate} onClick={async () => {
                  setBooking(true); setBookingStatus(null);
                  try {
                    // First try without payment to check if payment is needed
                    const res = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorProfileId: m.id, preferredDate: prefDate, message: sessionMsg, sessionType, duration: "60 min" }) });
                    const data = await res.json();

                    if (data.requiresPayment) {
                      // Trigger Razorpay payment
                      if (typeof window !== "undefined") {
                        if (!document.getElementById("rzp-s")) { const s = document.createElement("script"); s.id = "rzp-s"; s.src = "https://checkout.razorpay.com/v1/checkout.js"; document.body.appendChild(s); }
                        await new Promise((r) => setTimeout(r, 500)); // wait for script
                        if (window.Razorpay) {
                          const orderRes = await fetch("/api/payments/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "CAREER_READY", customAmount: data.price, customDesc: `Session with ${data.mentorName}` }) });
                          const orderData = await orderRes.json();
                          if (orderRes.ok) {
                            const rzp = new (window as unknown as { Razorpay: new (o: Record<string, unknown>) => { open: () => void } }).Razorpay({ key: orderData.keyId, amount: orderData.amount, currency: orderData.currency, name: "SkillMap", description: `${data.sessionType === "GROUP" ? "Group" : "1-on-1"} session with ${data.mentorName}`, order_id: orderData.orderId,
                              handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                                await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
                                // Now create session with payment ID
                                const sRes = await fetch("/api/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorProfileId: m.id, preferredDate: prefDate, message: sessionMsg, sessionType, duration: "60 min", paymentId: response.razorpay_payment_id }) });
                                const sData = await sRes.json();
                                if (sRes.ok) { setBookingStatus({ type: "success", text: "Payment successful! Session requested. Mentor will confirm." }); setPrefDate(""); setSessionMsg(""); }
                                else setBookingStatus({ type: "error", text: sData.error });
                              },
                              prefill: {}, theme: { color: "#0a0a0f" }, modal: { ondismiss: () => { setBookingStatus({ type: "error", text: "Payment cancelled" }); } },
                            } as Record<string, unknown>);
                            rzp.open();
                          }
                        } else { setBookingStatus({ type: "error", text: "Payment system loading. Try again." }); }
                      }
                    } else if (!res.ok) {
                      setBookingStatus({ type: "error", text: data.error });
                    } else {
                      setBookingStatus({ type: "success", text: "Session requested! Mentor will review and respond." }); setPrefDate(""); setSessionMsg("");
                    }
                  } catch { setBookingStatus({ type: "error", text: "Failed to book" }); }
                  finally { setBooking(false); }
                }} className={`px-5 py-2.5 rounded-xl ${syne} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--accent)", color: "var(--ink)" }}>{booking ? "Processing..." : (() => { const rate = sessionType === "GROUP" ? (m.groupSessionRate || m.sessionRate || 0) : (m.sessionRate || 0); return m.compensation === "PAID" && rate > 0 ? `Pay ₹${rate} & Request` : "Request Session (Free)"; })()}</button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {m.bio && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>About</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{m.bio}</p>
          </div>
        )}

        {/* Current role + College */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {m.currentRole && m.currentCompany && (
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Current Role</div>
              <div className={`${syne} font-bold text-sm`}>{m.currentRole}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>at {m.currentCompany}</div>
            </div>
          )}
          {m.collegeName && (
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Education</div>
              <div className={`${syne} font-bold text-sm`}>{m.collegeName}</div>
            </div>
          )}
        </div>

        {/* Area of expertise */}
        {m.areaOfExpertise.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Area of Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {m.areaOfExpertise.map((area) => (
                <span key={area} className={`text-xs font-bold px-3 py-1.5 rounded-full ${syne}`} style={{ background: "var(--ink)", color: "var(--accent)" }}>{area}</span>
              ))}
            </div>
          </div>
        )}

        {/* Mentor topics */}
        {m.mentorTopics.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Topics I Can Help With</h2>
            <div className="flex flex-wrap gap-2">
              {m.mentorTopics.map((topic) => (
                <span key={topic} className="text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--border)" }}>{topic}</span>
              ))}
            </div>
          </div>
        )}

        {/* Companies worked */}
        {m.companiesWorked.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Companies Worked With</h2>
            <div className="flex flex-wrap gap-3">
              {m.companiesWorked.map((company) => (
                <div key={company} className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${syne} font-bold text-xs text-white`} style={{ background: "var(--ink)" }}>
                    {company.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{company}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {m.achievements.length > 0 && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-4`}>Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {m.achievements.map((ach, i) => (
                <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  {ach.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img src={ach.imageUrl} alt={ach.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className={`${syne} font-bold text-sm`}>{ach.title}</div>
                    {ach.description && (
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{ach.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LinkedIn */}
        {m.linkedinUrl && (
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
            <h2 className={`${syne} font-bold text-base mb-3`}>Connect</h2>
            <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
              <span className="text-lg">💼</span>
              <span className="text-sm font-medium">LinkedIn Profile</span>
              <span className="text-xs ml-auto truncate max-w-[200px]" style={{ color: "var(--muted)" }}>{m.linkedinUrl}</span>
            </a>
          </div>
        )}

        {/* Empty states for new mentors */}
        {m.areaOfExpertise.length === 0 && m.achievements.length === 0 && !m.bio && (
          <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-4xl mb-3">🧑‍🏫</div>
            <p className={`${syne} font-bold text-base mb-1`}>Profile under construction</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>This mentor is setting up their profile. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
