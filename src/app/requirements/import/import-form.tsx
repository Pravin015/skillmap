"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Upload } from "lucide-react";
import { importRequirements, type ImportState } from "@/lib/actions/import";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";

function Submit({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "violet" | "secondary" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending}>{pending ? <Loader2 size={15} className="animate-spin" /> : null}{children}</Button>;
}

export function ImportForm({ csvText }: { csvText?: string }) {
  const [state, action] = useActionState<ImportState, FormData>(importRequirements, undefined);
  const valid = state?.rows?.filter((r) => !r.errors.length).length ?? 0;
  return (
    <div className="space-y-4">
      {state?.created ? <Alert tone="lime">Imported {state.created} requirement{state.created > 1 ? "s" : ""} from {state.fileName}. Matching trainers and saved-search alerts have been notified.</Alert> : null}
      {state?.errors?.map((e, i) => <Alert key={i} tone="rose">{e}</Alert>)}

      {!state?.created ? (
        <Card className="p-6">
          <form action={action} className="flex flex-wrap items-end gap-3">
            <Field label="CSV file" hint="Use the template. Up to 50 rows, 2 MB." className="flex-1"><Input name="file" type="file" accept=".csv,text/csv" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
            {csvText ? <input type="hidden" name="csv" value={csvText} /> : null}
            <Submit variant="secondary"><Upload size={15} /> Validate and preview</Submit>
          </form>
        </Card>
      ) : null}

      {state?.rows?.length ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
            <p className="font-display font-semibold">Preview · {state.rows.length} rows</p>
            <Badge tone={valid === state.rows.length ? "lime" : "amber"}>{valid} ready · {state.rows.length - valid} with errors</Badge>
            {valid === state.rows.length ? (
              <form action={action} className="ml-auto">
                <input type="hidden" name="confirm" value="1" />
                <input type="hidden" name="fileName" value={state.fileName ?? ""} />
                <input type="hidden" name="csv" value={rowsToCsv(state.rows)} />
                <Submit variant="violet">Import {valid} requirement{valid > 1 ? "s" : ""}</Submit>
              </form>
            ) : <span className="ml-auto text-xs text-muted">Fix the rows marked in red, then upload again.</span>}
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-2">Line</th><th className="px-4 py-2">Title</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Dates</th><th className="px-4 py-2">Mode</th><th className="px-4 py-2">Pax</th><th className="px-4 py-2">Budget</th><th className="px-4 py-2">Skills</th><th className="px-4 py-2">Issues</th></tr></thead>
            <tbody className="divide-y divide-line">{state.rows.map((r) => (
              <tr key={r.line} className={r.errors.length ? "bg-rose/5" : ""}>
                <td className="px-4 py-2 text-muted">{r.line}</td><td className="px-4 py-2 font-medium">{r.title || "—"}</td><td className="px-4 py-2">{r.category}</td><td className="px-4 py-2 whitespace-nowrap">{r.startDate} → {r.endDate}{r.days ? ` (${r.days}d)` : ""}</td><td className="px-4 py-2">{r.mode.toLowerCase()}{r.city ? ` · ${r.city}` : ""}</td><td className="px-4 py-2">{r.participants || "—"}</td><td className="px-4 py-2 whitespace-nowrap">{r.budgetMin ?? "—"}–{r.budgetMax ?? "—"} {r.currency}</td><td className="px-4 py-2 text-xs">{r.skills.join(", ")}</td>
                <td className="px-4 py-2 text-xs text-rose">{r.errors.join("; ")}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      ) : null}
    </div>
  );
}

/** Re-serialise validated rows so the confirm step never re-reads the file. */
function rowsToCsv(rows: NonNullable<NonNullable<ImportState>["rows"]>) {
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = "title,category,skills,mode,city,start_date,end_date,participants,budget_min,budget_max,currency,language,visibility,description";
  return [head, ...rows.map((r) => [r.title, r.category, r.skills.join(";"), r.mode, r.city, r.startDate, r.endDate, r.participants, r.budgetMin ?? "", r.budgetMax ?? "", r.currency, r.language, r.visibility, r.description].map(esc).join(","))].join("\n");
}
