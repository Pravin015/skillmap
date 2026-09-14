import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { skipOnboarding } from "@/lib/actions/onboarding";

/** Stepper shell for the onboarding wizards. Steps before `current` are done; each is a link so people can go back. */
export function Wizard({ base, steps, current, title, body, children, aside }: { base: string; steps: string[]; current: number; title: ReactNode; body?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {steps.map((s, i) => {
            const n = i + 1, done = n < current, active = n === current;
            return (
              <li key={s} className="flex items-center gap-2">
                <Link href={`${base}?step=${n}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display font-semibold ${active ? "bg-cyan text-white" : done ? "bg-lime/10 text-lime" : "bg-surface-2 text-muted"}`}>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">{done ? <Check size={11} /> : n}</span>{s}
                </Link>
                {i < steps.length - 1 ? <span className="h-px w-4 bg-line" /> : null}
              </li>
            );
          })}
        </ol>
        <form action={skipOnboarding} className="ml-auto"><button className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">Skip setup for now</button></form>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">Step {current} of {steps.length}</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight md:text-[38px]">{title}</h1>
          {body ? <p className="mt-2 max-w-2xl text-muted">{body}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {aside ? <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">{aside}</aside> : null}
      </div>
    </div>
  );
}

export function WizardNav({ back, skip, submitLabel = "Save and continue" }: { back?: string; skip?: string; submitLabel?: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
      {back ? <Link href={back} className="text-sm text-muted hover:text-ink">← Back</Link> : null}
      <span className="ml-auto" />
      {skip ? <Link href={skip} className="text-sm text-muted hover:text-ink">Skip this step</Link> : null}
      <button type="submit" className="inline-flex h-10 items-center rounded-full bg-cyan px-5 font-display text-sm font-semibold text-white hover:bg-violet">{submitLabel} →</button>
    </div>
  );
}
