import Link from "next/link";
import { resetPassword } from "@/lib/actions/account-security";
import { peekToken } from "@/lib/tokens";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Alert, Card, Field, Input } from "@/components/ui";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await peekToken(token, "PASSWORD_RESET");
  return (
    <div className="mx-auto max-w-md pt-6 md:pt-14">
      <p className="mono mb-2 text-[11px] uppercase tracking-[0.14em] text-cyan">Account</p>
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      {valid ? (
        <Card className="mt-6 p-6">
          <ActionForm action={resetPassword} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <Field label="New password" hint="At least 8 characters"><Input name="password" type="password" autoComplete="new-password" required minLength={8} /></Field>
            <Field label="Repeat it"><Input name="confirm" type="password" autoComplete="new-password" required minLength={8} /></Field>
            <SubmitButton className="w-full" size="lg" pendingText="Saving…">Set password and sign in</SubmitButton>
          </ActionForm>
        </Card>
      ) : (
        <div className="mt-6"><Alert tone="rose">This link is invalid, already used or older than an hour. <Link href="/forgot" className="underline">Request a new one</Link>.</Alert></div>
      )}
    </div>
  );
}
