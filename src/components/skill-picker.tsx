"use client";

import { useState } from "react";
import type { Skill } from "@prisma/client";
import { Input } from "./ui";
import { cn } from "@/lib/utils";

/** Filterable chip picker that posts one hidden `<name>` input per selected skill slug. */
export function SkillPicker({ skills, name = "skills", label = "Skills", initial = [] }: { skills: Pick<Skill, "id" | "slug" | "name">[]; name?: string; label?: string; initial?: string[] }) {
  const [picked, setPicked] = useState<string[]>(initial);
  const [filter, setFilter] = useState("");
  const visible = skills.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()));
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  return (
    <div>
      <p className="text-sm font-medium">{label}{picked.length ? <span className="ml-1 text-xs text-muted">({picked.length} selected)</span> : null}</p>
      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter skills…" className="mb-2 mt-1.5" />
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line bg-surface-2/60 p-2">
        {visible.map((s) => <button type="button" key={s.id} onClick={() => toggle(s.slug)} className={cn("rounded-full border px-2.5 py-0.5 text-xs transition", picked.includes(s.slug) ? "border-cyan bg-cyan text-white" : "border-line-2 bg-white text-muted hover:text-ink")}>{s.name}</button>)}
        {!visible.length ? <span className="text-xs text-muted">No skills match.</span> : null}
      </div>
      {picked.map((s) => <input key={s} type="hidden" name={name} value={s} />)}
    </div>
  );
}
