"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function Leaderboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${syne} font-bold text-xl`}>Leaderboard</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Top performers from your hackathons and quizzes</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select className="rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <option>All Hackathons</option>
        </select>
        <select className="rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <option>All Domains</option>
        </select>
      </div>

      {/* Podium placeholder */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-end justify-center gap-4 py-8">
          {/* 2nd place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl" style={{ background: "var(--border)" }}>🥈</div>
            <div className="h-20 w-20 rounded-t-xl" style={{ background: "var(--border)" }} />
            <div className={`${syne} text-xs font-bold mt-1`} style={{ color: "var(--muted)" }}>2nd</div>
          </div>
          {/* 1st place */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl" style={{ background: "var(--border)" }}>🥇</div>
            <div className="h-28 w-24 rounded-t-xl" style={{ background: "var(--border)" }} />
            <div className={`${syne} text-xs font-bold mt-1`} style={{ color: "var(--muted)" }}>1st</div>
          </div>
          {/* 3rd place */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-xl" style={{ background: "var(--border)" }}>🥉</div>
            <div className="h-14 w-18 rounded-t-xl" style={{ background: "var(--border)" }} />
            <div className={`${syne} text-xs font-bold mt-1`} style={{ color: "var(--muted)" }}>3rd</div>
          </div>
        </div>
        <p className="text-center text-sm mt-4" style={{ color: "var(--muted)" }}>Podium will populate after hackathon results are in</p>
      </div>

      {/* Rankings table */}
      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-[60px_1fr_120px_100px_100px] gap-4 px-6 py-3 text-xs font-medium border-b" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <span>Rank</span>
          <span>Candidate</span>
          <span>Hackathon</span>
          <span>Score</span>
          <span>Action</span>
        </div>
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className={`${syne} font-bold text-base mb-1`}>No rankings yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Create a hackathon or quiz first — rankings will appear here once participants complete it</p>
        </div>
      </div>
    </div>
  );
}
