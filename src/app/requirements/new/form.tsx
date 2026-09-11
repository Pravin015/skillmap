"use client";

import { useState } from "react";
import type { Category, Skill } from "@prisma/client";
import { createRequirement } from "@/lib/actions/requirements";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { cn, CURRENCIES, DELIVERY_MODES, LANGUAGES, modeLabel } from "@/lib/utils";

export type Preset = { title: string; description: string; categoryId: string; mode: string; participants?: number; skills: string[]; inviteTrainerId: string; trainerName: string };

export function NewRequirementForm({ categories, skills, preset }: { categories: Category[]; skills: Skill[]; preset?: Preset }) {
  const [mode, setMode] = useState(preset?.mode ?? "ONSITE");
  const [picked, setPicked] = useState<string[]>(preset?.skills ?? []);
  const [filter, setFilter] = useState("");
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  const visible = skills.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <ActionForm action={createRequirement}>
      <Card className="space-y-5 p-6">
        {preset ? <input type="hidden" name="inviteTrainerId" value={preset.inviteTrainerId} /> : null}
        <Field label="Title" hint="What, how long, for whom. e.g. “HPE VM Essentials 9.0 · 3-day ILT for bank ops team”"><Input name="title" required minLength={8} defaultValue={preset?.title} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Domain"><Select name="categoryId" required defaultValue={preset?.categoryId ?? ""}><option value="" disabled>Choose a domain</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Language"><Select name="language" defaultValue="English">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        </div>
        <Field label="Skills required" hint="Pick everything the trainer must be able to teach. Trainers with matching skills are notified.">
          <div className="rounded-lg border border-line bg-surface-2 p-3">
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter skills…" className="mb-2" />
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto scrollbar-thin">
              {visible.map((s) => (
                <button type="button" key={s.id} onClick={() => toggle(s.slug)} className={cn("rounded-full border px-2.5 py-0.5 text-xs transition", picked.includes(s.slug) ? "border-cyan bg-cyan text-white" : "border-line-2 text-muted hover:border-line-2 hover:text-ink")}>{s.name}</button>
              ))}
            </div>
            {picked.map((s) => <input key={s} type="hidden" name="skills" value={s} />)}
            <p className="mono mt-2 text-[11px] uppercase tracking-wider text-dim">{picked.length} selected</p>
          </div>
        </Field>
        <Field label="Description" hint="Audience level, outcomes, what you provide (lab, courseware, venue), and what you expect the trainer to bring.">
          <Textarea name="description" required minLength={40} className="min-h-40" defaultValue={preset?.description} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Delivery mode"><Select name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>{DELIVERY_MODES.map((m) => <option key={m} value={m}>{modeLabel[m]}</option>)}</Select></Field>
          <Field label="City" hint={mode === "VIRTUAL" ? "Not needed for virtual" : "Where the sessions happen"}><Input name="city" disabled={mode === "VIRTUAL"} placeholder="Mumbai" /></Field>
          <Field label="Participants"><Input name="participants" type="number" min={1} required placeholder="16" defaultValue={preset?.participants} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Start date"><Input name="startDate" type="date" required /></Field>
          <Field label="End date"><Input name="endDate" type="date" required /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Currency"><Select name="currency" defaultValue="INR">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Budget per day · min"><Input name="budgetMin" type="number" min={0} step={500} placeholder="25000" /></Field>
          <Field label="Budget per day · max"><Input name="budgetMax" type="number" min={0} step={500} placeholder="35000" /></Field>
        </div>
        <Field label="Visibility" hint="Invite-only requirements are hidden from search; you invite trainers from their profile.">
          <Select name="visibility" defaultValue="PUBLIC"><option value="PUBLIC">Public · any trainer can see and apply</option><option value="INVITE_ONLY">Invite-only · only trainers you invite</option></Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2"><SubmitButton variant="violet" size="lg" pendingText="Publishing…">Publish requirement</SubmitButton></div>
      </Card>
    </ActionForm>
  );
}
