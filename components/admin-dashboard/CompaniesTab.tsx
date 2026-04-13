"use client";
import { useEffect, useState } from "react";

const syne = "font-[family-name:var(--font-syne)]";

interface Company { id: string; name: string; email: string; organisation: string | null; phone: string | null; createdAt: string; hrCount: number }

export default function CompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchCompanies(); }, []);

  async function fetchCompanies() {
    const res = await fetch("/api/admin/companies");
    const d = await res.json();
    setCompanies(d.companies || []);
    setLoading(false);
  }

  async function resetPassword(userId: string, name: string) {
    if (!confirm(`Reset password for ${name}?`)) return;
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "reset-password" }) });
    const data = await res.json();
    if (res.ok) setMsg(`New password for ${name}: ${data.newPassword}`);
    setTimeout(() => setMsg(""), 10000);
  }

  async function deleteCompany(userId: string, name: string) {
    if (!confirm(`Delete company ${name}? All their HR accounts and job posts will also be removed. This cannot be undone.`)) return;
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    fetchCompanies();
  }

  const filtered = companies.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.organisation || c.name).toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`${syne} font-bold text-xl`}>Registered Companies</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{companies.length} organisations on the platform</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="rounded-xl border px-3 py-2 text-xs outline-none w-48" style={{ borderColor: "var(--border)" }} />
      </div>

      {msg && <div className="rounded-xl p-3 text-xs font-mono" style={{ background: "rgba(232,255,71,0.15)", color: "var(--ink)" }}>{msg} <button onClick={() => setMsg("")} className="ml-2 underline text-[10px]" style={{ color: "var(--muted)" }}>dismiss</button></div>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🏢</div>
          <p className={`${syne} font-bold text-base mb-1`}>{search ? "No companies match" : "No companies registered yet"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syne} font-extrabold text-lg text-white shrink-0`} style={{ background: "var(--ink)" }}>
                {(c.organisation || c.name).charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`${syne} font-bold`}>{c.organisation || c.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{c.email}</div>
              </div>
              <div className="text-center shrink-0 hidden sm:block">
                <div className={`${syne} text-lg font-extrabold`}>{c.hrCount}</div>
                <div className="text-[0.6rem]" style={{ color: "var(--muted)" }}>HRs</div>
              </div>
              <div className="text-xs shrink-0 hidden md:block" style={{ color: "var(--muted)" }}>
                Joined {new Date(c.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => resetPassword(c.id, c.organisation || c.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-gray-100" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Reset Pwd</button>
                <button onClick={() => deleteCompany(c.id, c.organisation || c.name)} className="text-[10px] px-2 py-1 rounded-lg border hover:bg-red-50" style={{ borderColor: "var(--border)", color: "#ef4444" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
