"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

interface Notif { id: string; type: string; title: string; message: string; read: boolean; createdAt: string }

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);

  useEffect(() => {
    fetch("/api/notifications/unread").then((r) => r.json()).then((d) => setCount(d.count || 0)).catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/notifications/unread").then((r) => r.json()).then((d) => setCount(d.count || 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    setOpen(!open);
    if (!open) {
      const res = await fetch("/api/notifications").then((r) => r.json()).catch(() => ({ notifications: [] }));
      setNotifications(res.notifications?.slice(0, 8) || []);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-lg transition-colors hover:bg-[rgba(10,10,15,0.04)]">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--ink)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.55rem] font-bold ${syne}`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-80 rounded-2xl border bg-white shadow-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <span className={`${syne} font-bold text-sm`}>Notifications</span>
              {count > 0 && (
                <button onClick={markAllRead} className="text-[0.65rem] font-medium" style={{ color: "var(--muted)" }}>Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", background: n.read ? "transparent" : "rgba(232,255,71,0.03)" }}>
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--accent)" }} />}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${n.read ? "" : "font-bold"}`} style={{ color: "var(--ink)" }}>{n.title}</div>
                        <div className="text-[0.7rem] mt-0.5 line-clamp-2" style={{ color: "var(--muted)" }}>{n.message}</div>
                        <div className="text-[0.6rem] mt-1" style={{ color: "var(--border)" }}>{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center py-2.5 text-xs font-medium no-underline border-t transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
