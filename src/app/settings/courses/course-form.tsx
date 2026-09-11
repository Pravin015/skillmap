"use client";

import type { Category, Course, Skill } from "@prisma/client";
import { saveCourse } from "@/lib/actions/courses";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { CURRENCIES, DELIVERY_MODES, modeLabel } from "@/lib/utils";

export function CourseForm({ course, categories, skills }: { course: (Course & { skills: Skill[] }) | null; categories: Category[]; skills: Skill[] }) {
  const mine = new Set(course?.skills.map((s) => s.slug) ?? []);
  return (
    <ActionForm action={saveCourse} className="mt-4 space-y-4" resetOnSuccess={!course}>
      {course ? <input type="hidden" name="id" value={course.id} /> : null}
      <Field label="Course title"><Input name="title" required defaultValue={course?.title} placeholder="HPE VM Essentials 9.0 Fundamentals (3 days)" /></Field>
      <Field label="Summary" hint="Who it is for and what they can do afterwards."><Textarea name="summary" required defaultValue={course?.summary} className="min-h-20" /></Field>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Level"><Select name="level" defaultValue={course?.level ?? "INTERMEDIATE"}><option value="FOUNDATION">Foundation</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></Select></Field>
        <Field label="Duration (days)"><Input name="durationDays" type="number" min={1} max={60} required defaultValue={course?.durationDays ?? 2} /></Field>
        <Field label="Max participants"><Input name="maxParticipants" type="number" min={1} defaultValue={course?.maxParticipants ?? ""} placeholder="16" /></Field>
        <Field label="Domain"><Select name="categoryId" defaultValue={course?.categoryId ?? ""}><option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Delivery modes">
          <div className="flex flex-wrap gap-2">{DELIVERY_MODES.map((m) => <label key={m} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-sm"><input type="checkbox" name="modes" value={m} defaultChecked={course?.modes.includes(m) ?? true} className="accent-cyan" />{modeLabel[m]}</label>)}</div>
        </Field>
        <Field label="Indicative day rate" hint="Shown to companies only"><Input name="indicativeRate" type="number" min={0} step={500} defaultValue={course?.indicativeRate ?? ""} /></Field>
        <Field label="Currency"><Select name="currency" defaultValue={course?.currency ?? "INR"}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
      </div>
      <Field label="Outline" hint="Modules and labs, one per line."><Textarea name="outline" defaultValue={course?.outline} className="min-h-28" placeholder={"Day 1 · Architecture and installation\nDay 2 · Storage, networking, HA\nDay 3 · Migration lab and day-2 operations"} /></Field>
      <Field label="Outline document" hint="PDF or Office file, optional"><Input name="outlineFile" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
      <Field label="Skills covered">
        <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line bg-surface-2 p-3 scrollbar-thin">
          {skills.map((s) => <label key={s.id} className="cursor-pointer"><input type="checkbox" name="skills" value={s.slug} defaultChecked={mine.has(s.slug)} className="peer sr-only" /><span className="inline-block rounded-full border border-line-2 px-2.5 py-0.5 text-xs text-muted transition peer-checked:border-cyan peer-checked:bg-cyan peer-checked:text-white">{s.name}</span></label>)}
        </div>
      </Field>
      <SubmitButton pendingText="Saving…">{course ? "Save changes" : "Add course"}</SubmitButton>
    </ActionForm>
  );
}
