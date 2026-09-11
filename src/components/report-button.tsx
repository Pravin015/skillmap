"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import type { ReportTarget } from "@prisma/client";
import { createReport } from "@/lib/actions/reports";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { ActionForm, SubmitButton } from "./form-bits";
import { Button, Select, Textarea } from "./ui";

export function ReportButton({ targetType, targetId, size = "sm", className }: { targetType: ReportTarget; targetId: string; size?: "sm" | "md"; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-dim transition hover:bg-surface-2 hover:text-rose ${size === "md" ? "text-sm" : ""}`}>
        <Flag size={size === "md" ? 15 : 13} /> Report
      </button>
      {open ? (
        <div className="mt-2 w-full max-w-sm rounded-xl border border-line bg-white p-3 shadow-lg shadow-navy/10">
          <ActionForm action={createReport} className="space-y-2">
            <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
            <Select name="reason" defaultValue="">{[<option key="" value="" disabled>Why are you reporting this?</option>, ...REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)]}</Select>
            <Textarea name="detail" placeholder="Anything that helps our team (optional)" className="min-h-16" />
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button><SubmitButton size="sm" variant="danger" pendingText="Sending…">Send report</SubmitButton></div>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
