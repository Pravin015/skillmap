import Link from "next/link";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Card } from "./ui";

export type ChecklistStep = { key: string; label: string; hint: string; href: string; done: boolean };

/**
 * Onboarding checklist for the dashboard. Each step links to where it is completed; the card collapses to a
 * one-line "all set" banner once every step is done so it stops taking space.
 */
export function OnboardingChecklist({ steps, title = "Get set up", audience }: { steps: ChecklistStep[]; title?: string; audience: "trainer" | "company" }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const next = steps.find((s) => !s.done);
  if (done === steps.length) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-lime/30 bg-lime/5 px-5 py-3 text-sm">
        <Sparkles size={16} className="text-lime" />
        <span className="font-semibold text-lime">You&apos;re all set.</span>
        <span className="text-muted">{audience === "trainer" ? "Your profile is complete and companies see you first in search." : "Your company page is complete and trainers can trust your requirements."}</span>
      </div>
    );
  }
  return (
    <Card className="p-5" glow={audience === "trainer" ? "cyan" : "violet"}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold">{title}</p>
          <p className="text-sm text-muted">{done} of {steps.length} done{next ? <> · next: <Link href={next.href} className="font-medium text-cyan hover:underline">{next.label}</Link></> : null}</p>
        </div>
        <span className="mono text-sm text-cyan">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${audience === "trainer" ? "bg-cyan" : "bg-violet"}`} style={{ width: `${pct}%` }} /></div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition ${s.done ? "border-line/60 bg-surface-2/60 text-muted" : "border-line bg-white hover:border-cyan/50"}`}>
              {s.done ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-lime" /> : <Circle size={18} className="mt-0.5 shrink-0 text-dim" />}
              <span className="min-w-0"><span className={`block text-sm font-medium ${s.done ? "line-through" : ""}`}>{s.label}</span><span className="block text-xs text-muted">{s.hint}</span></span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
