"use client";

import { useActionState, useState } from "react";
import { Alert } from "./ui";
import { CopyButton } from "./copy-button";
import type { ActionState } from "@/lib/types";

/** Like ActionForm, but when the success message carries a one-time secret (API key or webhook signing secret) it is shown in a copyable box. */
export function SecretForm({ action, children, className }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; children: React.ReactNode; className?: string }) {
  const [gen, setGen] = useState(0);
  const wrapped = async (prev: ActionState, fd: FormData) => { const r = await action(prev, fd); if (r?.ok) setGen((g) => g + 1); return r; };
  const [state, formAction] = useActionState(wrapped, undefined);
  const secret = state?.ok?.match(/(cg_live_[A-Za-z0-9_-]+|whsec_[A-Za-z0-9_-]+)/)?.[1];
  const message = secret ? state!.ok!.replace(`KEY:${secret}`, "").replace(secret, "").replace(/Signing secret:\s*$/, "").trim() : state?.ok;
  return (
    <div>
      {state?.error ? <div className="mb-4"><Alert tone="rose">{state.error}</Alert></div> : null}
      {secret ? (
        <div className="mb-4 rounded-xl border border-lime/40 bg-lime/5 p-4">
          <p className="text-sm font-semibold text-lime">{message || "Created."} Copy it now, it will not be shown again.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2"><code className="mono min-w-0 flex-1 break-all rounded-lg border border-line bg-white px-3 py-2 text-xs">{secret}</code><CopyButton text={secret} label="Copy" /></div>
        </div>
      ) : state?.ok ? <div className="mb-4"><Alert tone="lime">{state.ok}</Alert></div> : null}
      <form action={formAction} className={className} key={gen}>{children}</form>
    </div>
  );
}
