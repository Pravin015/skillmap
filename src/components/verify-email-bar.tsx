"use client";

import { MailCheck } from "lucide-react";
import { resendVerification } from "@/lib/actions/account-security";
import { ActionForm, SubmitButton } from "@/components/form-bits";

/** Slim bar under the header until the sign-in email is confirmed. */
export function VerifyEmailBar({ email }: { email: string }) {
  return (
    <div className="border-b border-amber/30 bg-amber/10 text-sm text-amber">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 md:px-6">
        <MailCheck size={16} /><span>Confirm <span className="font-semibold">{email}</span> to keep receiving invoices, purchase orders and alerts.</span>
        <ActionForm action={resendVerification} className="ml-auto [&>div]:mb-0 [&>div]:mr-2 [&>div]:inline-block"><SubmitButton size="sm" variant="secondary" pendingText="Sending…">Resend link</SubmitButton></ActionForm>
      </div>
    </div>
  );
}
