"use client";
// Institution profile editor. Backed by /api/account (PATCH for name/phone)
// since institution-specific fields live on User.organisation already.
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)]";

export default function InstitutionSettings({ orgName }: { orgName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState(orgName || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setName(d.user.name || "");
          setPhone(d.user.phone || "");
          setEmail(d.user.email || "");
          setOrganisation(d.user.organisation || orgName || "");
        }
      })
      .finally(() => setLoading(false));
  }, [orgName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, organisation }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Saved successfully." });
      } else {
        setMsg({ type: "error", text: data.error || "Couldn't save changes." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error — try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`${heading} font-bold text-xl`}>Settings</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Manage your institution profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${heading} font-bold text-xl text-white`} style={{ background: "var(--primary)" }}>
            {(organisation || orgName || "I").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={`${heading} font-bold text-lg`}>{organisation || "Institution"}</div>
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Verified Institution</span>
          </div>
        </div>

        {msg && (
          <div className={`rounded-xl p-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>Institution name</label>
                <input
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="e.g. ABC Engineering College"
                  className={inputClass}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>Primary contact name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Placement officer name"
                  className={inputClass}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>Email</label>
                <input
                  value={email}
                  disabled
                  className={inputClass}
                  style={{ borderColor: "var(--border)", background: "var(--surface-alt)", color: "var(--muted)" }}
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Contact support to change your verified email.</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className={inputClass}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        )}
      </form>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <h3 className={`${heading} font-bold text-base mb-3`}>Notifications</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Email alerts go to <strong style={{ color: "var(--ink)" }}>{email || "your registered address"}</strong>.
        </p>
        <div className="space-y-3">
          {[
            { label: "New student applications", desc: "When your students apply to jobs" },
            { label: "Placement updates", desc: "When students receive offers" },
            { label: "Weekly report", desc: "Summary of all student activity" },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-[var(--surface-alt)]" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className={`${heading} font-bold text-sm`}>{n.label}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{n.desc}</div>
              </div>
              <input type="checkbox" defaultChecked className="accent-[var(--primary)] w-4 h-4" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
