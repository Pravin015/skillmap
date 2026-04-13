"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const syne = "font-[family-name:var(--font-syne)]";

interface Notif { id: string; type: string; title: string; message: string; read: boolean; emailSent: boolean; createdAt: string }

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(d.notifications || [])).finally(() => setLoading(false));
  }, [session]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`${syne} font-extrabold text-2xl`}>Notifications</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{unread} unread</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className={`px-4 py-2 rounded-xl ${syne} font-bold text-xs`} style={{ background: "var(--primary)", color: "white" }}>Mark all read</button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-5xl mb-4">🔔</div>
            <p className={`${syne} font-bold text-lg mb-2`}>No notifications</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>You&apos;ll see updates about your applications, jobs, and events here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)} className={`rounded-2xl border bg-white p-5 transition-all hover:shadow-md cursor-pointer ${!n.read ? "border-l-4" : ""}`} style={{ borderColor: "var(--border)", borderLeftColor: !n.read ? "var(--primary)" : undefined }}>
                <div className="flex items-start gap-3">
                  {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "var(--primary)" }} />}
                  <div className="flex-1">
                    <div className={`${syne} text-sm ${n.read ? "font-medium" : "font-bold"}`} style={{ color: "var(--ink)" }}>{n.title}</div>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[0.65rem]" style={{ color: "var(--border)" }}>
                      <span>{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      {n.emailSent && <span>· Email sent</span>}
                      <span className="px-1.5 py-0.5 rounded text-[0.55rem]" style={{ background: "rgba(10,10,15,0.04)" }}>{n.type.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
