"use client";

import { useState } from "react";
import { Input } from "./ui";
import { cn } from "@/lib/utils";

type Group = { name: string; slug: string; skills: { slug: string; name: string; vendor: string | null }[] };

/** Skills grouped by domain, with vendor hints; posts one hidden `skills` input per selection. */
export function GroupedSkillPicker({ groups, initial = [], name = "skills", max = 15 }: { groups: Group[]; initial?: string[]; name?: string; max?: number }) {
  const [picked, setPicked] = useState<string[]>(initial);
  const [filter, setFilter] = useState("");
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length >= max ? p : [...p, slug]));
  const f = filter.toLowerCase();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Skills <span className="text-xs text-muted">({picked.length}/{max} selected)</span></p>
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter skills…" className="h-8 w-52 text-xs" />
      </div>
      <div className="mt-3 max-h-80 space-y-4 overflow-y-auto rounded-xl border border-line bg-surface-2/50 p-3">
        {groups.map((g) => {
          const visible = g.skills.filter((s) => !f || s.name.toLowerCase().includes(f) || (s.vendor ?? "").toLowerCase().includes(f));
          if (!visible.length) return null;
          return (
            <div key={g.slug}>
              <p className="mono mb-1.5 text-[11px] uppercase tracking-wider text-muted">{g.name}</p>
              <div className="flex flex-wrap gap-1.5">{visible.map((s) => <button type="button" key={s.slug} onClick={() => toggle(s.slug)} className={cn("rounded-full border px-2.5 py-1 text-xs transition", picked.includes(s.slug) ? "border-cyan bg-cyan text-white" : "border-line-2 bg-white text-ink/80 hover:border-cyan hover:text-cyan")}>{s.name}{s.vendor ? <span className={picked.includes(s.slug) ? "ml-1 text-white/70" : "ml-1 text-muted"}>· {s.vendor}</span> : null}</button>)}</div>
            </div>
          );
        })}
      </div>
      {picked.map((s) => <input key={s} type="hidden" name={name} value={s} />)}
    </div>
  );
}
