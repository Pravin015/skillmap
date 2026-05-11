"use client";
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

export default function ProfileScoreCard() {
  const [animated, setAnimated] = useState(false);
  const [breakdown, setBreakdown] = useState([
    { label: "Profile complete", max: 20, score: 0 },
    { label: "Skills added", max: 30, score: 0 },
    { label: "Resume uploaded", max: 15, score: 0 },
    { label: "Links added", max: 20, score: 0 },
    { label: "Bio & photo", max: 15, score: 0 },
  ]);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile) {
        const p = d.profile;
        const b = [
          { label: "Profile complete", max: 20, score: p.collegeName && p.fieldOfInterest ? 20 : p.collegeName ? 10 : 0 },
          { label: "Skills added", max: 30, score: Math.min((p.skills?.length || 0) * 6, 30) },
          { label: "Resume uploaded", max: 15, score: p.resumeUrl ? 15 : 0 },
          { label: "Links added", max: 20, score: (p.githubUrl ? 7 : 0) + (p.linkedinUrl ? 7 : 0) + (p.portfolioUrl ? 6 : 0) },
          { label: "Bio & photo", max: 15, score: (p.bio && p.bio.length > 10 ? 8 : 0) + 7 }, // +7 assumed photo (checked separately)
        ];
        setBreakdown(b);
      }
    }).catch(() => {});
    // Check photo
    fetch("/api/profile/image").then((r) => r.json()).then((d) => {
      if (!d.image) setBreakdown((prev) => prev.map((b) => b.label === "Bio & photo" ? { ...b, score: Math.max(b.score - 7, 0) } : b));
    }).catch(() => {});
    setTimeout(() => setAnimated(true), 300);
  }, []);

  const total = breakdown.reduce((a, b) => a + b.score, 0);
  const maxTotal = breakdown.reduce((a, b) => a + b.max, 0);
  const pct = Math.round((total / maxTotal) * 100);
  const color = pct < 40 ? "#ef4444" : pct < 70 ? "#f59e0b" : "#22c55e";
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * (animated ? pct : 0)) / 100;

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <h3 className={`${heading} font-bold text-base mb-4`}>Profile Score</h3>
      <div className="flex gap-6 items-center">
        <div className="relative shrink-0">
          <svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" /><circle cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 1.5s ease" }} /></svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${heading} text-2xl font-bold`} style={{ color }}>{pct}</span>
            <span className="text-[0.6rem]" style={{ color: "var(--muted)" }}>out of 100</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {breakdown.map((item) => {
            const itemPct = Math.round((item.score / item.max) * 100);
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-0.5"><span style={{ color: "var(--muted)" }}>{item.label}</span><span className={`${heading} font-bold`}>{item.score}/{item.max}</span></div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: animated ? `${itemPct}%` : "0%", background: itemPct >= 70 ? "#22c55e" : itemPct >= 40 ? "#f59e0b" : "#ef4444" }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
