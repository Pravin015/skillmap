"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

const categories = [
  { label: "Profile complete", max: 20 },
  { label: "Skills matched", max: 30 },
  { label: "Resume uploaded", max: 15 },
  { label: "Courses done", max: 20 },
  { label: "Interview prep", max: 15 },
];

export default function ProfileScoreCard() {
  const [animated, setAnimated] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    setHasResume(!!localStorage.getItem("skillmap_resume_name"));
    setTimeout(() => setAnimated(true), 300);
  }, []);

  // All zeros except resume if uploaded
  const scores = [0, 0, hasResume ? 15 : 0, 0, 0];
  const total = scores.reduce((a, b) => a + b, 0);
  const maxTotal = categories.reduce((a, b) => a + b.max, 0);
  const pct = Math.round((total / maxTotal) * 100);
  const color = pct < 40 ? "#ef4444" : pct < 70 ? "#f59e0b" : "#22c55e";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * (animated ? pct : 0)) / 100;

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <h3 className={`${syne} font-bold text-base mb-4`}>Profile Score</h3>
      <div className="flex gap-6 items-center">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="65" cy="65" r={radius} fill="none"
              stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              transform="rotate(-90 65 65)"
              style={{ transition: "stroke-dashoffset 1.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${syne} text-2xl font-extrabold`} style={{ color }}>{pct}</span>
            <span className="text-[0.6rem]" style={{ color: "var(--muted)" }}>out of 100</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2">
          {categories.map((item, i) => {
            const itemPct = Math.round((scores[i] / item.max) * 100);
            return (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span style={{ color: "var(--muted)" }}>{item.label}</span>
                  <span className={`${syne} font-bold`}>{scores[i]}/{item.max}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: animated ? `${itemPct}%` : "0%", background: itemPct >= 70 ? "#22c55e" : itemPct >= 40 ? "#f59e0b" : "#ef4444" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {pct === 0 && (
        <p className="text-xs text-center mt-4" style={{ color: "var(--muted)" }}>Complete your profile to improve your score</p>
      )}
    </div>
  );
}
