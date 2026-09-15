"use client";

import { createContext, useActionState, useContext, useRef, useState, useTransition, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Alert, Button } from "./ui";
import type { ActionState } from "@/lib/types";

const PendingContext = createContext(false);

export function SubmitButton({ children, variant = "primary", size = "md", className, pendingText }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" | "violet" | "outline" | "dark"; size?: "sm" | "md" | "lg"; className?: string; pendingText?: string;
}) {
  const { pending } = useFormStatus();
  const ctxPending = useContext(PendingContext);
  const busy = pending || ctxPending;
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={busy}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : null}
      {busy && pendingText ? pendingText : children}
    </Button>
  );
}

/**
 * Wraps a server action that returns ActionState; shows errors / success inline.
 * Submission is dispatched manually inside a transition so React does not reset the form after a failed action:
 * whatever the person typed stays in place while they fix the one field that was wrong.
 */
export function ActionForm({ action, children, className, resetOnSuccess, id }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode; className?: string; resetOnSuccess?: boolean; id?: string;
}) {
  const [gen, setGen] = useState(0);
  const keepValues = useRef(false);
  // React 19 calls form.reset() once an action settles. Skip that reset when the action failed, so typed values stay.
  const patchReset = (el: HTMLFormElement | null) => {
    if (!el || el.dataset.keep) return;
    el.dataset.keep = "1";
    const orig = el.reset.bind(el);
    el.reset = () => { if (!keepValues.current) orig(); };
  };
  const wrapped = async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    keepValues.current = !!result?.error;
    if (resetOnSuccess && result?.ok) setGen((g) => g + 1);
    return result;
  };
  const [state, formAction] = useActionState(wrapped, undefined);
  const [isPending, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? submitter : undefined);
    startTransition(() => formAction(fd));
  };
  return (
    <PendingContext.Provider value={isPending}>
      <form ref={patchReset} onSubmit={onSubmit} className={className} key={gen} id={id}>
        {state?.error ? <div className="mb-4"><Alert tone="rose">{state.error}</Alert></div> : null}
        {state?.ok ? <div className="mb-4"><Alert tone="lime">{state.ok}</Alert></div> : null}
        {children}
      </form>
    </PendingContext.Provider>
  );
}
