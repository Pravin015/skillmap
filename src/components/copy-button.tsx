"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* ignore */ } }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 bg-white px-3 font-display text-sm font-semibold hover:bg-surface-2">
      {done ? <Check size={15} className="text-lime" /> : <Copy size={15} />}{done ? "Copied" : label}
    </button>
  );
}
