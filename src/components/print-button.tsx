"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 bg-white px-3 font-display text-sm font-semibold hover:bg-surface-2">
      <Printer size={15} /> Print / save PDF
    </button>
  );
}
