"use client";
import { useEffect, useState } from "react";
const syne = "font-[family-name:var(--font-syne)]";

export default function HRInterestCard() {
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile?.profileNumber) {
        fetch(`/api/profile/${d.profile.profileNumber}`).then((r) => r.json()).then((data) => {
          setViewCount(data.viewCount || 0);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${syne} font-bold text-base`}>Profile Views</h3>
        {viewCount > 0 && (
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--primary)" }} /><span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "var(--primary)" }} /></span>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>HR and recruiters who viewed your profile</p>
      <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--border)" }}>
        <div className={`${syne} text-3xl font-extrabold`}>{viewCount}</div>
        <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>total profile views by recruiters</div>
      </div>
      {viewCount === 0 && <p className="text-xs mt-3 text-center" style={{ color: "var(--muted)" }}>Complete your profile and apply to jobs to get noticed</p>}
    </div>
  );
}
