"use client";
// /mentors — public listing of every verified mentor.
// Linked from homepage "Browse all mentors" + Header → Platform → Mentors.
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHero from "@/components/page/PageHero";
import { DOMAINS } from "@/lib/domains";

interface Mentor {
  id: string;
  mentorNumber: string;
  headline: string | null;
  bio: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  areaOfExpertise: string[];
  sessionRate: number | null;
  rating: number | null;
  totalSessions: number;
  user: { name: string; profileImage: string | null };
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mentors/browse");
      const data = await res.json();
      setMentors(data.mentors || []);
    } catch { /* swallow */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const filtered = mentors.filter((m) => {
    if (domain !== "All") {
      const expertiseLower = m.areaOfExpertise.map((e) => e.toLowerCase()).join(" ");
      if (!expertiseLower.includes(domain.toLowerCase())) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${m.user.name} ${m.headline ?? ""} ${m.bio ?? ""} ${m.currentCompany ?? ""} ${m.currentRole ?? ""} ${m.areaOfExpertise.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="Verified mentors"
        title={<>Learn from people who&apos;ve been there</>}
        subtitle="Every mentor verified through their employer. Industry engineers, managers, and specialists ready to help you crack your dream company."
      />

      {/* Filters */}
      <section className="px-4 -mt-4 mb-8">
        <div className="max-w-4xl mx-auto card" style={{ padding: "16px" }}>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, or expertise…"
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
              style={{ borderColor: "var(--border)" }}
            />
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="rounded-xl border px-4 py-2.5 text-sm outline-none md:w-56"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="All">All domains</option>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center" style={{ padding: "48px 24px" }}>
              <div className="text-4xl mb-3">🧑‍🏫</div>
              <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>No mentors match your search</p>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                We&apos;re onboarding mentors continuously — try a broader filter or check back soon.
              </p>
              <Link href="/for-mentors" className="btn-outline">Become a mentor →</Link>
            </div>
          ) : (
            <>
              <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
                {filtered.length} verified mentor{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mentor/${m.mentorNumber}`}
                    className="card no-underline flex flex-col"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {m.user.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img loading="lazy" decoding="async" src={m.user.profileImage} alt={m.user.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                      ) : (
                        <span
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-base shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {initials(m.user.name)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{m.user.name}</p>
                        {m.currentRole && (
                          <p className="text-xs" style={{ color: "var(--primary)" }}>{m.currentRole}</p>
                        )}
                        {m.currentCompany && (
                          <p className="text-[11px]" style={{ color: "var(--muted)" }}>{m.currentCompany}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                        ✓ Verified
                      </span>
                    </div>

                    {m.headline && (
                      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--ink-soft)" }}>
                        {m.headline}
                      </p>
                    )}

                    {m.areaOfExpertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {m.areaOfExpertise.slice(0, 4).map((e) => (
                          <span key={e} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-alt)", color: "var(--ink-soft)" }}>
                            {e}
                          </span>
                        ))}
                        {m.areaOfExpertise.length > 4 && (
                          <span className="text-[10px]" style={{ color: "var(--muted)" }}>+{m.areaOfExpertise.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
                        {m.rating && <span>⭐ {m.rating.toFixed(1)}</span>}
                        {m.totalSessions > 0 && <span>{m.totalSessions} session{m.totalSessions === 1 ? "" : "s"}</span>}
                      </div>
                      {m.sessionRate ? (
                        <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>
                          ₹{m.sessionRate}<span className="text-[10px] font-normal" style={{ color: "var(--muted)" }}> /hr</span>
                        </p>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--primary)" }}>View →</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA — recruit more mentors */}
      <section className="px-4 pb-16">
        <div className="card max-w-4xl mx-auto text-center" style={{ padding: "32px 24px" }}>
          <p className="text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>
            Are you a senior in tech / product / cybersecurity?
          </p>
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
            Join our growing network of verified mentors helping India&apos;s freshers. Set your own rate, mentor on your schedule, get paid via UPI.
          </p>
          <Link href="/for-mentors" className="btn-primary">Apply to mentor</Link>
        </div>
      </section>
    </div>
  );
}
