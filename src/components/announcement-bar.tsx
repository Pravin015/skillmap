"use client";

import { useState, useSyncExternalStore } from "react";
import { Megaphone, X } from "lucide-react";

const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };

/** Platform-wide banner set by super admin. Dismissal is remembered per browser per message. */
export function AnnouncementBar({ id, text, tone, href }: { id: string; text: string; tone: "info" | "warning" | "success"; href?: string }) {
  const key = `cg-ann-${id}`;
  const [, bump] = useState(0);
  const dismissed = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key) === "1"; } catch { return false; } }, () => true);
  if (dismissed) return null;
  const cls = tone === "warning" ? "bg-amber/10 text-amber border-amber/30" : tone === "success" ? "bg-lime/10 text-lime border-lime/30" : "bg-navy text-white border-navy";
  return (
    <div className={`border-b ${cls}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm md:px-6">
        <Megaphone size={15} className="shrink-0" />
        <p className="min-w-0 flex-1">{href ? <a href={href} className="underline underline-offset-2">{text}</a> : text}</p>
        <button type="button" aria-label="Dismiss" onClick={() => { try { localStorage.setItem(key, "1"); } catch { /* ignore */ } bump((n) => n + 1); }} className="rounded p-1 opacity-70 hover:opacity-100"><X size={14} /></button>
      </div>
    </div>
  );
}
