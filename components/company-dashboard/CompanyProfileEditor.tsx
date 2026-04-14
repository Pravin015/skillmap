"use client";
import { useEffect, useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

export default function CompanyProfileEditor() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [about, setAbout] = useState("");
  const [culture, setCulture] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [founded, setFounded] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profileSlug, setProfileSlug] = useState("");

  useEffect(() => {
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile;
          setName(p.name || "");
          setSlug(p.slug || "");
          setIndustry(p.industry || "");
          setAbout(p.about || "");
          setCulture(p.culture || "");
          setWebsite(p.website || "");
          setLocation(p.location || "");
          setSize(p.size || "");
          setFounded(p.founded || "");
          setProfileSlug(p.slug || "");
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/company/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), industry, about, culture, website, location, size, founded }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfileSlug(data.profile.slug);
      setMessage("Profile saved! Your public page is live.");
    } else {
      setMessage("Failed to save profile.");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 5000);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${heading} font-bold text-xl`}>Company Profile</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>This is your public company page visible to candidates</p>
        </div>
        {profileSlug && (
          <a href={`/company/${profileSlug}`} target="_blank" className={`${heading} text-xs font-bold px-3 py-1.5 rounded-lg no-underline`} style={{ background: "var(--primary)", color: "white" }}>
            View Public Page ↗
          </a>
        )}
      </div>

      {message && (
        <div className="rounded-xl p-3 text-sm" style={{ background: message.includes("Failed") ? "#fef2f2" : "var(--primary-light)", color: message.includes("Failed") ? "#ef4444" : "var(--ink)" }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Company Name *</label>
            <input value={name} onChange={(e) => { setName(e.target.value); if (!profileSlug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>URL Slug *</label>
            <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <span className="px-3 text-xs bg-gray-50" style={{ color: "var(--muted)" }}>ashpranix.in/company/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="flex-1 px-3 py-2.5 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., IT Services, Fintech, Consulting" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Mumbai, India" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Company Size</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }}>
              <option value="">Select size</option>
              <option value="1-50">1-50</option>
              <option value="50-200">50-200</option>
              <option value="200-1000">200-1,000</option>
              <option value="1000-5000">1,000-5,000</option>
              <option value="5000+">5,000+</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Founded Year</label>
            <input value={founded} onChange={(e) => setFounded(e.target.value)} placeholder="e.g., 2015" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>About the Company</label>
          <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} placeholder="Tell candidates what your company does, your mission, and what makes you unique..." className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--ink)" }}>Company Culture</label>
          <textarea value={culture} onChange={(e) => setCulture(e.target.value)} rows={3} placeholder="Describe your work environment, values, benefits, and what it's like working at your company..." className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} />
        </div>

        <button type="submit" disabled={saving} className={`${heading} rounded-xl px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
