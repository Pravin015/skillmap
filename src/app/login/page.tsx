import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { login } from "@/lib/actions/auth";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Alert, Card, Field, Input } from "@/components/ui";
import { OAuthButtons } from "@/components/oauth-buttons";

const ERRORS: Record<string, string> = {
  provider: "That sign-in provider is not configured yet.",
  denied: "Sign-in was cancelled at the provider.",
  state: "The sign-in link expired or was tampered with. Try again.",
  exchange: "The provider rejected the sign-in. Try again in a moment.",
  suspended: "This account is suspended. Contact support@corpgurus.com.",
  expired: "Your sign-in session expired. Start again.",
};

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto max-w-md pt-6 md:pt-14">
      <p className="mono mb-2 text-[11px] uppercase tracking-[0.14em] text-cyan">Welcome back</p>
      <h1 className="text-3xl font-bold">Sign in to CorpGurus</h1>
      <p className="mt-2 text-muted">Pick up where you left off.</p>
      {error ? <div className="mt-4"><Alert tone="rose">{ERRORS[error] ?? "Sign-in failed. Try again."}</Alert></div> : null}
      <Card className="mt-6 p-6">
        <OAuthButtons next={next} />
        <ActionForm action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="Email"><Input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></Field>
          <Field label="Password"><Input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></Field>
          <SubmitButton className="w-full" size="lg" pendingText="Signing in…">Sign in</SubmitButton>
        </ActionForm>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        New here? <Link href="/signup" className="text-cyan hover:underline">Create an account</Link>
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-line-2 p-4 text-xs text-dim">
        <p className="mono mb-1 uppercase tracking-wider text-muted">Demo accounts · password <span className="text-ink">Password@123</span></p>
        <p>trainer: <span className="text-ink">ananya@corpgurus.demo</span> · company: <span className="text-ink">rahul@techsphere.demo</span> · partner: <span className="text-ink">meera@skillbridge.demo</span> · admin: <span className="text-ink">admin@corpgurus.demo</span> · super: <span className="text-ink">pravin@corpgurus.demo</span></p>
      </div>
    </div>
  );
}
