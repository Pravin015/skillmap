"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Upload } from "lucide-react";
import { applyLinkedIn, parseLinkedIn, type LinkedInState } from "@/lib/actions/linkedin";
import { Alert, Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";

function Submit({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending}>{pending ? <Loader2 size={15} className="animate-spin" /> : null}{children}</Button>;
}

export function LinkedInImportForm() {
  const [parsed, parseAction] = useActionState<LinkedInState, FormData>(parseLinkedIn, undefined);
  const [applied, applyAction] = useActionState<LinkedInState, FormData>(applyLinkedIn, undefined);
  const p = parsed?.profile;
  return (
    <div className="space-y-4">
      {applied?.applied ? <Alert tone="lime">Imported: {applied.applied.join(", ")}. Review the result on your profile and settings.</Alert> : null}
      {applied?.error ? <Alert tone="rose">{applied.error}</Alert> : null}
      {parsed?.error ? <Alert tone="rose">{parsed.error}</Alert> : null}

      <Card className="p-6">
        <form action={parseAction} className="space-y-4">
          <Field label="LinkedIn PDF" hint="On LinkedIn open your profile → More → Save to PDF, then upload that file."><Input name="file" type="file" accept=".pdf,application/pdf" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
          <details><summary className="cursor-pointer text-sm text-cyan">Or paste the profile text instead</summary><Textarea name="text" className="mt-2 min-h-32" placeholder="Paste the text of your LinkedIn profile here" /></details>
          <Submit variant="secondary"><Upload size={15} /> Read and preview</Submit>
        </form>
      </Card>

      {p ? (
        <form action={applyAction}>
          <input type="hidden" name="profile" value={JSON.stringify(p)} />
          <Card className="divide-y divide-line">
            <div className="px-6 py-4"><p className="font-display font-semibold">Review what we found{p.name ? ` for ${p.name}` : ""}</p><p className="text-xs text-muted">Tick what to apply. Nothing changes until you click Apply. Certifications import as pending and still need staff verification.</p></div>
            <Section title="Headline" on={!!p.headline}>{p.headline ? <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="use_headline" value="1" defaultChecked className="mt-1 accent-cyan" />{p.headline}</label> : <Empty />}</Section>
            <Section title="About" on={!!p.summary}>{p.summary ? <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="use_summary" value="1" defaultChecked className="mt-1 accent-cyan" /><span className="line-clamp-6 whitespace-pre-line">{p.summary}</span></label> : <Empty />}</Section>
            <Section title="Experience" on={!!p.yearsExperience}>{p.yearsExperience ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="use_years" value="1" defaultChecked className="accent-cyan" />About {p.yearsExperience} years, based on the earliest role found</label> : <Empty />}</Section>
            <Section title={`Skills · ${p.skills.length}`} on={p.skills.length > 0}>
              <div className="flex flex-wrap gap-2">{(parsed?.skillMatches ?? []).map((s) => s.slug ? <label key={s.name} className="cursor-pointer"><input type="checkbox" name="skills" value={s.slug} defaultChecked className="peer sr-only" /><span className="inline-block rounded-full border border-line-2 px-2.5 py-0.5 text-xs text-muted peer-checked:border-cyan peer-checked:bg-cyan peer-checked:text-white">{s.name}</span></label> : <span key={s.name} className="inline-block rounded-full border border-dashed border-line-2 px-2.5 py-0.5 text-xs text-dim" title="Not in the CorpGurus skill list yet. Ask an administrator to add it.">{s.name} · not listed</span>)}</div>
            </Section>
            <Section title={`Languages · ${p.languages.length}`} on={p.languages.length > 0}>{p.languages.length ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="use_languages" value="1" defaultChecked className="accent-cyan" />{p.languages.join(", ")}</label> : <Empty />}</Section>
            <Section title={`Certifications · ${p.certifications.length}`} on={p.certifications.length > 0}>
              <div className="space-y-1">{p.certifications.map((c, i) => <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" name="certs" value={i} defaultChecked className="accent-cyan" />{c.name}<Badge tone="amber">pending after import</Badge></label>)}</div>
            </Section>
            <Section title={`Work history · ${p.experiences.length}`} on={p.experiences.length > 0}>
              <div className="space-y-2">{p.experiences.map((e, i) => <label key={i} className="flex items-start gap-2 text-sm"><input type="checkbox" name="experiences" value={i} defaultChecked className="mt-1 accent-cyan" /><span><span className="font-medium">{e.title}</span> · {e.organisation}<span className="block text-xs text-muted">{e.start ?? "?"} → {e.current ? "present" : e.end ?? "?"}{e.description ? ` · ${e.description.slice(0, 120)}${e.description.length > 120 ? "…" : ""}` : ""}</span></span></label>)}</div>
            </Section>
            <div className="flex justify-end px-6 py-4"><Submit>Apply selected to my profile</Submit></div>
          </Card>
        </form>
      ) : null}
    </div>
  );
}

function Section({ title, on, children }: { title: string; on: boolean; children: React.ReactNode }) {
  return <div className={`px-6 py-4 ${on ? "" : "opacity-60"}`}><p className="mono mb-2 text-[11px] uppercase tracking-wider text-muted">{title}</p>{children}</div>;
}
function Empty() { return <p className="text-xs text-dim">Not found in the PDF.</p>; }
