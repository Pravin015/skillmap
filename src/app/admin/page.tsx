import Link from "next/link";
import { db } from "@/lib/db";
import { reviewCertification, verifyCompanyDomain } from "@/lib/actions/admin";
import { Avatar, Button, Card, Empty, Input, PageHeader, Stat } from "@/components/ui";
import { fmtDate, timeAgo } from "@/lib/utils";

export const metadata = { title: "Admin queue" };

export default async function AdminQueue() {
  const [certs, companies, counts, recentAudit] = await Promise.all([
    db.certification.findMany({ where: { status: "PENDING" }, include: { trainer: { include: { user: { select: { name: true, avatarUrl: true } } } } }, orderBy: { createdAt: "asc" } }),
    db.company.findMany({ where: { domainVerifiedAt: null, domain: { not: null } }, include: { members: { where: { role: "OWNER" }, include: { user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: "asc" } }),
    Promise.all([db.user.count(), db.trainerProfile.count(), db.company.count(), db.requirement.count({ where: { status: { in: ["OPEN", "SHORTLISTING"] } } }), db.application.count(), db.user.count({ where: { status: "SUSPENDED" } })]),
    db.auditLog.findMany({ include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const [users, trainers, comps, openReqs, apps, suspended] = counts;

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Verification queue" body="Certificates and company domains waiting for review. Decisions notify the member and are written to the audit log." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Users" value={users} /><Stat label="Trainers" value={trainers} /><Stat label="Companies" value={comps} tone="violet" /><Stat label="Open reqs" value={openReqs} tone="amber" /><Stat label="Applications" value={apps} tone="lime" /><Stat label="Suspended" value={suspended} tone="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold">Certifications <span className="mono text-xs text-amber">{certs.length} pending</span></h2>
            {certs.length ? (
              <div className="space-y-3">{certs.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar name={c.trainer.user.name} src={c.trainer.user.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{c.name} <span className="text-muted">· {c.issuer}</span></p>
                      <p className="text-sm text-muted"><Link href={`/trainers/${c.trainer.slug}`} className="text-cyan hover:underline">{c.trainer.user.name}</Link>{c.credentialId ? <span className="mono"> · ID {c.credentialId}</span> : null}{c.issuedOn ? ` · issued ${fmtDate(c.issuedOn)}` : ""} · submitted {timeAgo(c.createdAt)}</p>
                      {c.fileUrl ? <a href={c.fileUrl} target="_blank" className="mt-1 inline-block text-sm text-cyan hover:underline">Open certificate file ↗</a> : <p className="mt-1 text-xs text-amber">No file attached. Verify against the issuer&apos;s registry using the credential ID.</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    <form action={reviewCertification}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="decision" value="VERIFIED" /><Button size="sm">Verify</Button></form>
                    <form action={reviewCertification} className="flex flex-1 gap-2"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="decision" value="REJECTED" /><Input name="note" placeholder="Reason for rejection (sent to trainer)" className="h-8 py-1 text-xs" /><Button size="sm" variant="danger">Reject</Button></form>
                  </div>
                </Card>
              ))}</div>
            ) : <Empty title="Queue is clear" body="No certifications waiting." />}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Company domains <span className="mono text-xs text-amber">{companies.length} pending</span></h2>
            {companies.length ? (
              <div className="space-y-3">{companies.map((c) => (
                <Card key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium"><Link href={`/companies/${c.slug}`} className="hover:text-[#b79cff]">{c.name}</Link> <span className="mono text-sm text-muted">· {c.domain}</span></p>
                    <p className="text-sm text-muted">Owner: {c.members[0]?.user.name} · {c.members[0]?.user.email}</p>
                  </div>
                  <form action={verifyCompanyDomain}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="verify" value="1" /><Button size="sm" variant="violet">Verify domain</Button></form>
                </Card>
              ))}</div>
            ) : <Empty title="No domains waiting" />}
          </section>
        </div>

        <aside>
          <Card className="p-5">
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Audit log</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              {recentAudit.map((a) => <li key={a.id}><span className="mono text-xs text-amber">{a.action}</span><span className="block text-muted">{a.actor.name} · {timeAgo(a.createdAt)}</span></li>)}
              {!recentAudit.length ? <li className="text-muted">No actions yet.</li> : null}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
