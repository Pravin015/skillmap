"use client";
const syne = "font-[family-name:var(--font-syne)]";

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }

export default function InstitutionsTab({ users }: { users: User[] }) {
  const institutions = users.filter((u) => u.role === "INSTITUTION");

  return (
    <div className="space-y-6">
      <div><h2 className={`${syne} font-bold text-xl`}>Institutions</h2><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{institutions.length} registered institutions</p></div>
      {institutions.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🏫</div>
          <p className={`${syne} font-bold text-base mb-1`}>No institutions registered</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Institutions will appear here after admin onboards them</p>
        </div>
      ) : (
        <div className="space-y-3">
          {institutions.map((inst) => (
            <div key={inst.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syne} font-extrabold text-lg text-white shrink-0`} style={{ background: "var(--ink)" }}>{(inst.organisation || inst.name).charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className={`${syne} font-bold`}>{inst.organisation || inst.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{inst.email}</div>
              </div>
              <div className="text-xs hidden sm:block" style={{ color: "var(--muted)" }}>Joined {new Date(inst.createdAt).toLocaleDateString()}</div>
              <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">Institution</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
