import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "./signup-form";
import { OAuthButtons } from "@/components/oauth-buttons";

export const metadata = { title: "Join" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { as } = await searchParams;
  return (
    <div className="mx-auto max-w-lg pt-6 md:pt-14">
      <p className="mono mb-2 text-[11px] uppercase tracking-[0.14em] text-cyan">Join CorpGurus</p>
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-muted">Free for trainers. Free for companies to post their first requirements.</p>
      <SignupForm initialRole={as === "company" ? "COMPANY" : "TRAINER"} oauth={<OAuthButtons as={as === "company" ? "company" : "trainer"} label="Sign up with" />} />
      <p className="mt-4 text-center text-sm text-muted">
        Already a member? <Link href="/login" className="text-cyan hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
