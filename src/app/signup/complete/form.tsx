"use client";

import { useState } from "react";
import { Building2, GraduationCap } from "lucide-react";
import { completeOAuthSignup } from "@/lib/actions/oauth";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Card, Field, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

export function CompleteForm({ name, initialRole }: { name: string; initialRole: "TRAINER" | "COMPANY" }) {
  const [role, setRole] = useState<"TRAINER" | "COMPANY">(initialRole);
  return (
    <Card className="mt-4 p-6">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface-2 p-1">
        <Tab active={role === "TRAINER"} onClick={() => setRole("TRAINER")} icon={<GraduationCap size={16} />} label="I'm a trainer" sub="Find engagements" tone="cyan" />
        <Tab active={role === "COMPANY"} onClick={() => setRole("COMPANY")} icon={<Building2 size={16} />} label="I hire trainers" sub="Post requirements" tone="violet" />
      </div>
      <ActionForm action={completeOAuthSignup} className="space-y-4">
        <input type="hidden" name="role" value={role} />
        <Field label="Full name"><Input name="name" defaultValue={name} required autoComplete="name" /></Field>
        {role === "TRAINER" ? (
          <Field label="Headline" hint="One line companies will see in search results."><Input name="headline" required placeholder="HPE & Aruba certified instructor · 12 yrs" /></Field>
        ) : (
          <>
            <Field label="Company name"><Input name="companyName" required placeholder="TechSphere Solutions" /></Field>
            <Field label="Company type" hint="Training partners resell training and subcontract delivery to freelance trainers.">
              <Select name="companyType" defaultValue="DIRECT">
                <option value="DIRECT">Direct employer · we train our own people</option>
                <option value="TRAINING_PARTNER">Training partner · we deliver for clients</option>
              </Select>
            </Field>
          </>
        )}
        <SubmitButton className="w-full" size="lg" variant={role === "COMPANY" ? "violet" : "primary"} pendingText="Creating account…">
          {role === "TRAINER" ? "Create trainer account" : "Create company account"}
        </SubmitButton>
      </ActionForm>
    </Card>
  );
}

function Tab({ active, onClick, icon, label, sub, tone }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string; tone: "cyan" | "violet" }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
        active ? (tone === "cyan" ? "bg-white text-cyan shadow-sm ring-1 ring-cyan/40" : "bg-white text-violet shadow-sm ring-1 ring-violet/40") : "text-muted hover:text-ink")}>
      {icon}
      <span><span className="block font-display text-sm font-semibold">{label}</span><span className="block text-[11px] opacity-70">{sub}</span></span>
    </button>
  );
}
