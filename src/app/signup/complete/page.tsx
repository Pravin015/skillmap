import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PENDING_COOKIE, providerName, readPending } from "@/lib/oauth";
import { Avatar } from "@/components/ui";
import { CompleteForm } from "./form";

export const metadata = { title: "Finish signing up" };

export default async function CompleteSignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const jar = await cookies();
  const pending = await readPending(jar.get(PENDING_COOKIE)?.value);
  if (!pending) redirect("/login?error=expired");
  return (
    <div className="mx-auto max-w-lg pt-6 md:pt-14">
      <p className="mono mb-2 text-[12px] uppercase tracking-[0.08em] text-cyan">One more step</p>
      <h1 className="text-3xl font-bold">Finish creating your account</h1>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
        <Avatar name={pending.name} src={pending.picture} size={40} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{pending.name}</p>
          <p className="truncate text-sm text-muted">{pending.email ?? "No email shared"} · via {providerName(pending.provider)}</p>
        </div>
      </div>
      <CompleteForm name={pending.name} initialRole={pending.as === "company" ? "COMPANY" : "TRAINER"} />
    </div>
  );
}
