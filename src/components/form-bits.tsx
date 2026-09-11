"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Alert, Button } from "./ui";
import type { ActionState } from "@/lib/types";

export function SubmitButton({ children, variant = "primary", size = "md", className, pendingText }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" | "violet" | "outline"; size?: "sm" | "md" | "lg"; className?: string; pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending}>
      {pending ? <Loader2 size={15} className="animate-spin" /> : null}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

/** Wraps a server action that returns ActionState; shows errors / success inline. */
export function ActionForm({ action, children, className, resetOnSuccess }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode; className?: string; resetOnSuccess?: boolean;
}) {
  const [gen, setGen] = useState(0);
  const wrapped = async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (resetOnSuccess && result?.ok) setGen((g) => g + 1);
    return result;
  };
  const [state, formAction] = useActionState(wrapped, undefined);
  return (
    <form action={formAction} className={className} key={gen}>
      {state?.error ? <div className="mb-4"><Alert tone="rose">{state.error}</Alert></div> : null}
      {state?.ok ? <div className="mb-4"><Alert tone="lime">{state.ok}</Alert></div> : null}
      {children}
    </form>
  );
}
