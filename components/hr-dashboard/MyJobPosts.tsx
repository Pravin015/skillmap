"use client";

const syne = "font-[family-name:var(--font-syne)]";

export default function MyJobPosts({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>My Job Posts</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Manage your active and past job listings</p>
        </div>
        <button onClick={() => onNavigate("create-job")} className={`px-4 py-2.5 rounded-xl ${syne} font-bold text-sm`} style={{ background: "var(--ink)", color: "var(--accent)" }}>+ New Post</button>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-6 py-3 text-xs font-medium border-b" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <span>Job Title</span>
          <span>Applications</span>
          <span>Status</span>
          <span>Posted</span>
          <span>Action</span>
        </div>
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className={`${syne} font-bold text-base mb-1`}>No job posts yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Create your first job posting to start receiving applications</p>
          <button onClick={() => onNavigate("create-job")} className={`mt-3 px-4 py-2 rounded-lg ${syne} font-bold text-xs`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Create job post</button>
        </div>
      </div>
    </div>
  );
}
