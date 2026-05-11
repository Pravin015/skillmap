// Detail page for an aggregated ExternalJob.
//
// The B2B partner contract uses this URL as the canonical `externalUrl`
// and `applyUrl`. When students arrive via a partner curation panel we
// want them to:
//   - see the role in full on our side (NOT bounce straight to the
//     source) so we can build conversion data + show our branding;
//   - click "Apply" → redirect to the source's actual posting page
//     (tracking the click via /api/external-jobs/[id]/click as before).
//
// Tracking query params (?ref=&institute=&student=) are POSTed to the
// JobReferral table on mount.
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ExternalJobActions from "@/components/ExternalJobActions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExternalJobDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const job = await prisma.externalJob.findUnique({
    where: { id },
    include: { source: true },
  });
  if (!job) notFound();

  const ref = typeof sp.ref === "string" ? sp.ref : null;
  const institute = typeof sp.institute === "string" ? sp.institute : null;
  const student = typeof sp.student === "string" ? sp.student : null;
  const autoApply = sp.action === "apply";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {ref && (
        <div className="rounded-xl border p-3 mb-5 text-xs flex items-center gap-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="text-base">↩</span>
          <span style={{ color: "var(--muted)" }}>
            Referred from <strong>{institute || ref}</strong>
          </span>
        </div>
      )}

      <div className="flex items-start gap-4 mb-6">
        {job.companyLogoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={job.companyLogoUrl} alt={job.company} className="w-14 h-14 rounded-xl object-cover border" style={{ borderColor: "var(--border)" }} />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {job.company[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-2xl" style={{ color: "var(--ink)" }}>{job.title}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{job.company} · {job.location}</p>
          <div className="flex gap-2 flex-wrap mt-2 text-[11px]">
            {job.workMode && <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{job.workMode}</span>}
            {job.jobType && <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{job.jobType}</span>}
            {job.experienceLevel && <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{job.experienceLevel}</span>}
            {job.salaryText && <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>{job.salaryText}</span>}
          </div>
        </div>
      </div>

      {job.description && (
        <div className="rounded-2xl border bg-white p-5 mb-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-2">About this role</h2>
          <p className="text-sm whitespace-pre-line" style={{ color: "var(--muted)" }}>{job.description}</p>
        </div>
      )}

      {job.skills.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 mb-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-2">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--border)" }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <ExternalJobActions
        jobId={job.id}
        sourceName={job.source.displayName}
        ref={ref}
        institute={institute}
        student={student}
        autoApply={autoApply}
      />

      <div className="mt-6 text-xs text-center">
        <Link href="/jobs/external" style={{ color: "var(--muted)" }}>← Back to all jobs</Link>
      </div>
    </div>
  );
}
