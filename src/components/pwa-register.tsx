"use client";

import { useEffect, useState } from "react";
import { BellRing, Download } from "lucide-react";

function toKey(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Registers the service worker; exposes "Install app" and "Enable push" controls when the browser allows them. */
export function PwaControls({ signedIn }: { signedIn: boolean }) {
  const [installEvt, setInstallEvt] = useState<(Event & { prompt: () => Promise<void> }) | null>(null);
  const [push, setPush] = useState<"unsupported" | "disabled" | "off" | "on">("unsupported");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as Event & { prompt: () => Promise<void> }); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    (async () => {
      if (!signedIn || !("PushManager" in window)) return;
      const cfg = await fetch("/api/push/subscribe").then((r) => r.json()).catch(() => null) as { enabled: boolean } | null;
      if (!cfg?.enabled) { setPush("disabled"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPush(sub ? "on" : "off");
    })();
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [signedIn]);

  const enablePush = async () => {
    const cfg = (await fetch("/api/push/subscribe").then((r) => r.json())) as { enabled: boolean; publicKey: string };
    if (!cfg.enabled) return;
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(cfg.publicKey) });
    await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
    setPush("on");
  };
  const disablePush = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint, remove: true }) }); await sub.unsubscribe(); }
    setPush("off");
  };

  if (!installEvt && (push === "unsupported" || push === "disabled")) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {installEvt ? <button type="button" onClick={() => installEvt.prompt()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-2 bg-white px-3 font-display text-[13px] font-semibold hover:bg-surface-2"><Download size={14} /> Install app</button> : null}
      {push === "off" ? <button type="button" onClick={enablePush} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-2 bg-white px-3 font-display text-[13px] font-semibold hover:bg-surface-2"><BellRing size={14} /> Enable push notifications</button> : null}
      {push === "on" ? <button type="button" onClick={disablePush} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/5 px-3 font-display text-[13px] font-semibold text-cyan"><BellRing size={14} /> Push on · turn off</button> : null}
    </div>
  );
}
