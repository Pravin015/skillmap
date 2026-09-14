"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Polls a tiny counts endpoint and refreshes server components when something changed. Fast interval on conversation pages, slow elsewhere. */
export function LiveRefresh({ conversationId, intervalMs }: { conversationId?: string; intervalMs?: number }) {
  const router = useRouter();
  const last = useRef<string | null>(null);
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/me/counts${conversationId ? `?conversation=${conversationId}` : ""}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { sig: string };
        if (last.current !== null && last.current !== j.sig && !stop) router.refresh();
        last.current = j.sig;
      } catch { /* offline */ }
    };
    tick();
    const id = setInterval(tick, intervalMs ?? (conversationId ? 3000 : 20000));
    return () => { stop = true; clearInterval(id); };
  }, [conversationId, intervalMs, router]);
  return null;
}
