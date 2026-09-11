"use client";

import { useState } from "react";
import { BellPlus } from "lucide-react";
import { saveSearch } from "@/lib/actions/saved-searches";
import { ActionForm, SubmitButton } from "./form-bits";
import { Button, Input } from "./ui";

/** Saves the current filter set; alerts go out when new matches appear. */
export function SaveSearchButton({ kind, params, suggestedName }: { kind: "TRAINERS" | "REQUIREMENTS"; params: Record<string, string | undefined>; suggestedName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)}><BellPlus size={15} /> Save search</Button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-line bg-white p-4 shadow-lg shadow-navy/10">
          <p className="text-sm font-semibold">Save this search</p>
          <p className="mt-0.5 text-xs text-muted">You will be notified (in-app and by email) when a new {kind === "TRAINERS" ? "trainer" : "requirement"} matches.</p>
          <ActionForm action={saveSearch} className="mt-3 space-y-2">
            <input type="hidden" name="kind" value={kind} />
            {Object.entries(params).map(([k, v]) => (v ? <input key={k} type="hidden" name={`p_${k}`} value={v} /> : null))}
            <Input name="name" defaultValue={suggestedName} placeholder="Name this search" />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="alerts" value="1" defaultChecked className="accent-cyan" /> Send me alerts</label>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button><SubmitButton size="sm" pendingText="Saving…">Save</SubmitButton></div>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
