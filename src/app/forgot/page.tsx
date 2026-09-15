import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requestPasswordReset } from "@/lib/actions/account-security";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Card, Field, Input } from "@/components/ui";

export const metadata = { title: "Forgot password" };

export default async function ForgotPage() {
  if (await getCurrentUser()) redirect("/settings");
  return (
    <div className="mx-auto max-w-md pt-6 md:pt-14">
      <p className="mono mb-2 text-[11px] uppercase tracking-[0.14em] text-cyan">Account</p>
      <h1 className="text-3xl font-bold">Forgot your password?</h1>
      <p className="mt-2 text-muted">Enter the email you signed up with and we will send a one-hour link to choose a new one.</p>
      <Card className="mt-6 p-6">
        <ActionForm action={requestPasswordReset} className="space-y-4">
          <Field label="Email"><Input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></Field>
          <SubmitButton className="w-full" size="lg" pendingText="Sending…">Send reset link</SubmitButton>
        </ActionForm>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">Remembered it? <Link href="/login" className="text-cyan hover:underline">Sign in</Link></p>
    </div>
  );
}
