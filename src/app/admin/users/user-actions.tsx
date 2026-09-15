"use client";

import { useState, useSyncExternalStore } from "react";
import { KeyRound, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Field, Input, Select } from "@/components/ui";
import { bulkUsers, deleteUser, resetUserPassword, updateUserDetails } from "@/lib/actions/admin";

/** Bulk toolbar. Row checkboxes point at this form with form="bulk-users", so per-row forms stay valid HTML. */
export function BulkBar() {
  const selected = useSyncExternalStore(subscribeChecks, countChecked, () => 0);
  const [action, setAction] = useState("disable");
  return (
    <ActionForm id="bulk-users" action={bulkUsers} className="mb-3 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface-2/60 px-4 py-3">
      <p className="mr-2 self-center text-sm"><span className="font-display font-semibold">{selected}</span> <span className="text-muted">selected</span></p>
      <Field label="Bulk action" className="w-44"><Select name="action" value={action} onChange={(e) => setAction(e.target.value)}><option value="disable">Disable accounts</option><option value="enable">Enable accounts</option><option value="delete">Delete accounts</option></Select></Field>
      {action === "delete" ? <Field label="Type DELETE to confirm" className="w-36"><Input name="confirm" placeholder="DELETE" className="uppercase" /></Field> : null}
      <SubmitButton size="sm" variant={action === "delete" ? "danger" : "secondary"} pendingText="Working…">Apply to selected</SubmitButton>
    </ActionForm>
  );
}

const countChecked = () => document.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked').length;
const subscribeChecks = (cb: () => void) => { document.addEventListener("change", cb); return () => document.removeEventListener("change", cb); };

export function SelectAll() {
  return <input type="checkbox" aria-label="Select all" className="accent-cyan" onChange={(e) => { document.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((c) => { c.checked = e.target.checked; }); document.dispatchEvent(new Event("change")); }} />;
}

/** Per-row menu: edit details, reset password, delete. */
export function UserActions({ user }: { user: { id: string; name: string; email: string; phone: string | null } }) {
  const [open, setOpen] = useState<null | "edit" | "reset" | "delete">(null);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => (o ? null : "edit"))} className="rounded-lg border border-line-2 bg-white p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label={`More actions for ${user.name}`}><MoreHorizontal size={15} /></button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close" onClick={() => setOpen(null)} />
          <div className="absolute right-0 z-40 mt-1 w-80 rounded-xl border border-line bg-white p-3 text-left shadow-lg shadow-navy/10">
            <div className="mb-3 flex gap-1 rounded-lg bg-surface-2 p-1 text-xs font-semibold">
              {([["edit", "Edit", Pencil], ["reset", "Password", KeyRound], ["delete", "Delete", Trash2]] as const).map(([k, l, I]) => <button key={k} type="button" onClick={() => setOpen(k)} className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 ${open === k ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}><I size={13} /> {l}</button>)}
            </div>
            {open === "edit" ? (
              <ActionForm action={updateUserDetails} className="space-y-2">
                <input type="hidden" name="id" value={user.id} />
                <Field label="Name"><Input name="name" defaultValue={user.name} required /></Field>
                <Field label="Email"><Input name="email" type="email" defaultValue={user.email} required /></Field>
                <Field label="Phone"><Input name="phone" defaultValue={user.phone ?? ""} placeholder="+91…" /></Field>
                <SubmitButton size="sm" pendingText="Saving…">Save changes</SubmitButton>
              </ActionForm>
            ) : open === "reset" ? (
              <ActionForm action={resetUserPassword} className="space-y-2">
                <input type="hidden" name="id" value={user.id} />
                <p className="text-xs text-muted">Generates a temporary password and shows it here once. The user is asked to change it under Settings.</p>
                <SubmitButton size="sm" variant="secondary" pendingText="Resetting…">Reset password</SubmitButton>
              </ActionForm>
            ) : (
              <ActionForm action={deleteUser} className="space-y-2">
                <input type="hidden" name="id" value={user.id} />
                <p className="text-xs text-muted">The account stops signing in, personal details are blanked and it disappears from search and teams. Invoices and work orders that name it are kept.</p>
                <Field label="Type DELETE to confirm"><Input name="confirm" placeholder="DELETE" className="uppercase" /></Field>
                <SubmitButton size="sm" variant="danger" pendingText="Deleting…">Delete account</SubmitButton>
              </ActionForm>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
