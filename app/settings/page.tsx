"use client";
import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import PhotoCropper from "@/components/PhotoCropper";

const heading = "font-[family-name:var(--font-heading)]";
const inputClass = "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--ink)]";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("This will permanently delete your account and ALL associated data — applications, courses, certificates, mentor sessions, payment history. This cannot be undone. Continue?")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteEmail, password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Couldn't delete account");
        return;
      }
      // Sign out + send to homepage with a tombstone query so we could later show a "deleted" message there.
      await signOut({ redirect: false });
      router.push("/?account=deleted");
    } catch {
      setDeleteError("Network error — try again.");
    } finally {
      setDeleting(false);
    }
  }
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdMessage, setPwdMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/account").then((r) => r.json()).then((d) => {
        if (d.user) { setName(d.user.name); setEmail(d.user.email); setPhone(d.user.phone || ""); setRole(d.user.role); setProfileImage(d.user.profileImage); }
      }).finally(() => setLoading(false));
    }
  }, [session]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage(null);
    try {
      const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "error", text: data.error }); return; }
      setMessage({ type: "success", text: "Profile updated! Changes will reflect after re-login." });
    } catch { setMessage({ type: "error", text: "Failed to update" }); }
    finally { setSaving(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMessage(null);
    if (newPassword !== confirmPassword) { setPwdMessage({ type: "error", text: "Passwords do not match" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) { setPwdMessage({ type: "error", text: data.error }); return; }
      setPwdMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch { setPwdMessage({ type: "error", text: "Failed to change password" }); }
    finally { setSaving(false); }
  }

  function handleFileSelect(file: File) {
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCroppedPhoto(base64: string) {
    setCropSrc(null);
    await fetch("/api/profile/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
    setProfileImage(base64);
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  return (
    <>
    {cropSrc && <PhotoCropper imageSrc={cropSrc} onCropped={handleCroppedPhoto} onCancel={() => setCropSrc(null)} />}
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className={`${heading} font-bold text-2xl`}>Account Settings</h1><p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Manage your profile, contact info, and password</p></div>

        {/* Profile photo */}
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h2 className={`${heading} font-bold text-base mb-4`}>Profile Photo</h2>
          <div className="flex items-center gap-4">
            {profileImage ? (
              <img src={profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${heading} font-bold text-2xl text-white`} style={{ background: "var(--ink)" }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <button onClick={() => fileRef.current?.click()} className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs`} style={{ background: "var(--primary)", color: "white" }}>
                {profileImage ? "Change photo" : "Upload photo"}
              </button>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Max 500KB · JPG, PNG</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
          </div>
        </div>

        {/* Profile info */}
        <form onSubmit={handleSaveProfile} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h2 className={`${heading} font-bold text-base mb-4`}>Personal Information</h2>
          {message && <div className={`rounded-xl p-3 text-sm mb-4 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>}
          <div className="space-y-4">
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Email</label>
              <input type="email" value={email} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed`} style={{ borderColor: "var(--border)", color: "var(--muted)" }} />
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Email cannot be changed. Contact support if needed.</p></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Role</label>
              <input type="text" value={role} readOnly className={`${inputClass} bg-gray-50 cursor-not-allowed`} style={{ borderColor: "var(--border)", color: "var(--muted)" }} /></div>
          </div>
          <button type="submit" disabled={saving} className={`mt-5 px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Saving..." : "Save Changes"}</button>
        </form>

        {/* Change password */}
        <form onSubmit={handleChangePassword} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
          <h2 className={`${heading} font-bold text-base mb-4`}>Change Password</h2>
          {pwdMessage && <div className={`rounded-xl p-3 text-sm mb-4 ${pwdMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{pwdMessage.text}</div>}
          <div className="space-y-4">
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Enter current password" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
            <div><label className={`block text-sm font-medium mb-1.5 ${heading}`}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter new password" className={inputClass} style={{ borderColor: "var(--border)" }} /></div>
          </div>
          <button type="submit" disabled={saving} className={`mt-5 px-6 py-3 rounded-xl ${heading} font-bold text-sm disabled:opacity-50`} style={{ background: "var(--primary)", color: "white" }}>{saving ? "Changing..." : "Change Password"}</button>
        </form>

        {/* Danger Zone — account deletion */}
        <div className="rounded-2xl border bg-white p-6 mt-6" style={{ borderColor: "#fecaca" }}>
          <h2 className={`${heading} font-bold text-base mb-1`} style={{ color: "#dc2626" }}>Delete Account</h2>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Permanently remove your AstraaHire account and all related data — applications, courses, certificates,
            mentor sessions, payment history. This action cannot be undone.
          </p>

          {!showDeleteForm ? (
            <button
              onClick={() => setShowDeleteForm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#fecaca", color: "#dc2626", background: "#fef2f2" }}
            >
              Delete my account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                  Type your email to confirm
                </label>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  required
                  placeholder={email}
                  className={inputClass}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                  Current password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className={inputClass}
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {deleteError && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={deleting || !deleteEmail || !deletePassword}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "#dc2626", color: "white" }}
                >
                  {deleting ? "Deleting…" : "Permanently delete account"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteForm(false); setDeleteEmail(""); setDeletePassword(""); setDeleteError(null); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
