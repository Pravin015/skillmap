import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, CalendarDays, Globe2, Languages, MapPin, MessageSquare, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { addComment, apply, rateCounterparty, setRequirementStatus, withdrawApplication } from "@/lib/actions/requirements";
import { moderateComment, moderateRequirement } from "@/lib/actions/admin";
import { startConversation } from "@/lib/actions/network";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Avatar, Badge, Button, ButtonLink, Card, Chip, Field, Input, Select, Textarea } from "@/components/ui";
import { reqTone } from "@/components/cards";
import { appStatusLabel, dateRange, fmtDate, modeLabel, rateRange, reqStatusLabel, timeAgo } from "@/lib/utils";

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const r = await db.requirement.findUnique({
    where: { id },
    include: {
      company: { include: { members: { select: { userId: true } } } },
      postedBy: { select: { id: true, name: true, avatarUrl: true } },
      category: true, skills: { orderBy: { name: "asc" } },
      invitedTrainers: { include: { user: { select: { name: true } } } },
      applications: { include: { trainer: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } }, orderBy: { createdAt: "asc" } },
      comments: { where: { deletedAt: null }, include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } }, orderBy: { createdAt: "asc" } },
      ratings: { include: { fromUser: { select: { name: true } }, toUser: { select: { name: true } } } },
    },
  });
  if (!r) notFound();

  const isMember = !!user && r.company.members.some((m) => m.userId === user.id);
  const staff = isStaff(user);
  const myApp = user?.trainerProfile ? r.applications.find((a) => a.trainerId === user.trainerProfile!.id) : null;
  const invited = user?.trainerProfile ? r.invitedTrainers.some((t) => t.id === user.trainerProfile!.id) : false;
  if (r.visibility === "INVITE_ONLY" && !isMember && !staff && !invited) notFound();
  const acceptsApps = ["OPEN", "SHORTLISTING"].includes(r.status);
  const awarded = r.applications.find((a) => a.status === "AWARDED");
  const topLevel = r.comments.filter((c) => !c.parentId);
  const replies = (pid: string) => r.comments.filter((c) => c.parentId === pid);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link href={`/companies/${r.company.slug}`} className="flex items-center gap-1.5 font-medium text-ink hover:text-violet">{r.company.name}{r.company.domainVerifiedAt ? <BadgeCheck size={14} className="text-violet" /> : null}</Link>
            {r.company.type === "TRAINING_PARTNER" ? <Badge tone="violet">partner</Badge> : null}
            <Badge>{r.category.name}</Badge>
            {r.visibility === "INVITE_ONLY" ? <Badge tone="amber">invite-only</Badge> : null}
            <Badge tone={reqTone[r.status]}>{reqStatusLabel[r.status]}</Badge>
            <span className="ml-auto text-xs">Posted {timeAgo(r.createdAt)} by {r.postedBy.name}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">{r.title}</h1>
          <div className="mt-4 flex flex-wrap gap-1.5">{r.skills.map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface-2 p-4 md:grid-cols-3">
            <Meta icon={<CalendarDays size={14} />} l="Dates" v={`${dateRange(r.startDate, r.endDate)} · ${r.days} day${r.days > 1 ? "s" : ""}`} />
            <Meta icon={<MapPin size={14} />} l="Delivery" v={r.mode === "VIRTUAL" ? "Virtual" : `${modeLabel[r.mode]} · ${r.city}`} />
            <Meta icon={<Users size={14} />} l="Participants" v={String(r.participants)} />
            <Meta icon={<Wallet size={14} />} l="Budget" v={rateRange(r.budgetMin, r.budgetMax, r.currency)} accent />
            <Meta icon={<Languages size={14} />} l="Language" v={r.language} />
            <Meta icon={<Globe2 size={14} />} l="Category" v={r.category.name} />
          </dl>
          <div className="prose-invert mt-6 max-w-3xl whitespace-pre-line leading-relaxed text-ink/90">{r.description}</div>
        </Card>

        <section id="comments">
          <div className="mb-3 flex items-center gap-2"><MessageSquare size={18} className="text-cyan" /><h2 className="text-lg font-bold">Questions & discussion</h2><span className="mono text-xs text-dim">{r.comments.length}</span></div>
          <p className="mb-4 text-sm text-muted">Ask about the lab, the audience or the logistics here. The company answers once, for everyone.</p>
          <div className="space-y-3">
            {topLevel.map((c) => (
              <div key={c.id} className="rounded-2xl border border-line bg-white p-4">
                <CommentRow c={c} isCompany={r.company.members.some((m) => m.userId === c.authorId)} staff={staff} />
                {replies(c.id).map((rep) => (
                  <div key={rep.id} className="ml-6 mt-3 border-l-2 border-line-2 pl-4 md:ml-11">
                    <CommentRow c={rep} isCompany={r.company.members.some((m) => m.userId === rep.authorId)} staff={staff} />
                  </div>
                ))}
                {user ? (
                  <details className="ml-6 mt-3 md:ml-11">
                    <summary className="cursor-pointer text-xs text-cyan hover:underline">Reply</summary>
                    <ActionForm action={addComment} className="mt-2 flex gap-2" resetOnSuccess>
                      <input type="hidden" name="requirementId" value={r.id} /><input type="hidden" name="parentId" value={c.id} />
                      <Input name="body" placeholder="Write a reply" required />
                      <SubmitButton size="md" variant="secondary">Reply</SubmitButton>
                    </ActionForm>
                  </details>
                ) : null}
              </div>
            ))}
            {!topLevel.length ? <p className="rounded-xl border border-dashed border-line-2 p-5 text-center text-sm text-muted">No questions yet. Be the first.</p> : null}
          </div>
          {user ? (
            <ActionForm action={addComment} className="mt-4" resetOnSuccess>
              <div className="flex items-start gap-3">
                <Avatar name={user.name} src={user.avatarUrl} size={36} tone={user.role === "COMPANY" ? "violet" : user.role === "TRAINER" ? "cyan" : "amber"} />
                <div className="flex-1 space-y-2">
                  <input type="hidden" name="requirementId" value={r.id} />
                  <Textarea name="body" placeholder={isMember ? "Add context for trainers…" : "Ask a question about this requirement…"} className="min-h-20" required />
                  <SubmitButton variant="secondary" size="sm" pendingText="Posting…">Post comment</SubmitButton>
                </div>
              </div>
            </ActionForm>
          ) : <p className="mt-4 text-sm text-muted"><Link href={`/login?next=/requirements/${r.id}`} className="text-cyan hover:underline">Sign in</Link> to ask a question.</p>}
        </section>

        {r.status === "COMPLETED" && awarded && (isMember || user?.id === awarded.trainer.user.id) ? (
          <Card className="p-5">
            <h2 className="text-lg font-bold">Rate this engagement</h2>
            <p className="text-sm text-muted">Ratings are public and cannot be edited after 30 days.</p>
            <ActionForm action={rateCounterparty} className="mt-3 grid gap-3 md:grid-cols-[120px_1fr_auto]">
              <input type="hidden" name="requirementId" value={r.id} />
              <input type="hidden" name="toUserId" value={isMember ? awarded.trainer.user.id : r.postedBy.id} />
              <Select name="score" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</Select>
              <Input name="review" placeholder={isMember ? `How was ${awarded.trainer.user.name}?` : `How was working with ${r.company.name}?`} />
              <SubmitButton variant="secondary">Save rating</SubmitButton>
            </ActionForm>
            {r.ratings.length ? <ul className="mt-4 space-y-1 text-sm text-muted">{r.ratings.map((x) => <li key={x.id}><span className="text-amber">{"★".repeat(x.score)}</span> {x.fromUser.name} → {x.toUser.name}{x.review ? `: “${x.review}”` : ""}</li>)}</ul> : null}
          </Card>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {isMember ? (
          <Card className="p-5" glow="violet">
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Your requirement</p>
            <p className="mt-1 font-display text-2xl font-bold">{r.applications.filter((a) => a.status !== "WITHDRAWN").length} <span className="text-base font-medium text-muted">applications</span></p>
            <ButtonLink href={`/dashboard/requirements/${r.id}/applicants`} variant="violet" className="mt-3 w-full">Review applicants</ButtonLink>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {r.status === "OPEN" ? <StatusBtn id={r.id} to="SHORTLISTING" label="Start shortlisting" /> : null}
              {r.status === "AWARDED" ? <StatusBtn id={r.id} to="COMPLETED" label="Mark completed" /> : null}
              {["OPEN", "SHORTLISTING"].includes(r.status) ? <StatusBtn id={r.id} to="CANCELLED" label="Cancel" danger /> : null}
              {r.status === "CANCELLED" ? <StatusBtn id={r.id} to="OPEN" label="Reopen" /> : null}
            </div>
            {r.invitedTrainers.length ? <p className="mt-3 text-xs text-muted">Invited: {r.invitedTrainers.map((t) => t.user.name).join(", ")}</p> : null}
          </Card>
        ) : user?.trainerProfile ? (
          <Card className="p-5" glow={acceptsApps && !myApp ? "cyan" : undefined}>
            {myApp ? (
              <>
                <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Your application</p>
                <div className="mt-2"><Badge tone={myApp.status === "AWARDED" ? "lime" : myApp.status === "SHORTLISTED" ? "amber" : myApp.status === "DECLINED" ? "rose" : myApp.status === "WITHDRAWN" ? "neutral" : "cyan"}>{appStatusLabel[myApp.status]}</Badge></div>
                <p className="mt-2 text-sm text-muted">Proposed {rateRange(myApp.proposedRate, null, r.currency)} · sent {fmtDate(myApp.createdAt)}</p>
                {myApp.declineReason ? <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">“{myApp.declineReason}”</p> : null}
                <form action={startConversation} className="mt-3"><input type="hidden" name="userId" value={r.postedBy.id} /><input type="hidden" name="requirementId" value={r.id} /><Button variant="secondary" className="w-full"><MessageSquare size={15} /> Message {r.postedBy.name.split(" ")[0]}</Button></form>
                {["APPLIED", "SHORTLISTED"].includes(myApp.status) ? <form action={withdrawApplication} className="mt-2"><input type="hidden" name="id" value={myApp.id} /><Button variant="ghost" size="sm" className="w-full text-rose">Withdraw application</Button></form> : null}
              </>
            ) : acceptsApps ? (
              <>
                <p className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Apply</p>
                <h3 className="mt-1 font-bold">Tell {r.company.name} why you fit</h3>
                <ActionForm action={apply} className="mt-3 space-y-3">
                  <input type="hidden" name="requirementId" value={r.id} />
                  <Field label="Cover note"><Textarea name="coverNote" required placeholder="Relevant batches you've delivered, what you bring, anything you need from them." /></Field>
                  <Field label={`Proposed day rate (${r.currency})`} hint={`Budget: ${rateRange(r.budgetMin, r.budgetMax, r.currency)}`}><Input name="proposedRate" type="number" min={0} step={500} placeholder={String(r.budgetMax ?? "")} /></Field>
                  <SubmitButton className="w-full" pendingText="Sending…">Send application</SubmitButton>
                </ActionForm>
              </>
            ) : <p className="text-sm text-muted">This requirement is {reqStatusLabel[r.status].toLowerCase()} and no longer accepts applications.</p>}
          </Card>
        ) : !user ? (
          <Card className="p-5" glow="cyan">
            <h3 className="font-bold">Trainers apply free</h3>
            <p className="mt-1 text-sm text-muted">Create a profile, get verified, and apply with your rate.</p>
            <ButtonLink href={`/signup`} className="mt-3 w-full">Join as a trainer</ButtonLink>
            <ButtonLink href={`/login?next=/requirements/${r.id}`} variant="ghost" className="mt-1 w-full">Sign in</ButtonLink>
          </Card>
        ) : null}

        {(isMember || staff) && r.applications.length ? (
          <Card className="p-5">
            <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Applicants</p>
            <ul className="mt-2 space-y-2">{r.applications.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <Avatar name={a.trainer.user.name} src={a.trainer.user.avatarUrl} size={26} />
                <Link href={`/trainers/${a.trainer.slug}`} className="flex-1 truncate hover:text-cyan">{a.trainer.user.name}</Link>
                <Badge tone={a.status === "AWARDED" ? "lime" : a.status === "SHORTLISTED" ? "amber" : a.status === "DECLINED" || a.status === "WITHDRAWN" ? "neutral" : "cyan"}>{appStatusLabel[a.status]}</Badge>
              </li>
            ))}</ul>
          </Card>
        ) : awarded ? (
          <Card className="p-5"><p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">Awarded to</p><Link href={`/trainers/${awarded.trainer.slug}`} className="mt-2 flex items-center gap-2 hover:text-cyan"><Avatar name={awarded.trainer.user.name} src={awarded.trainer.user.avatarUrl} size={30} />{awarded.trainer.user.name}</Link></Card>
        ) : null}

        {staff && r.status !== "CANCELLED" ? (
          <form action={moderateRequirement}><input type="hidden" name="id" value={r.id} /><Button variant="danger" size="sm" className="w-full">Take down (moderation)</Button></form>
        ) : null}
      </aside>
    </div>
  );
}

function Meta({ icon, l, v, accent }: { icon: React.ReactNode; l: string; v: string; accent?: boolean }) {
  return (
    <div>
      <dt className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted">{icon}{l}</dt>
      <dd className={`mt-1 text-sm font-medium ${accent ? "text-cyan" : ""}`}>{v}</dd>
    </div>
  );
}

function StatusBtn({ id, to, label, danger }: { id: string; to: string; label: string; danger?: boolean }) {
  return (
    <form action={setRequirementStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={to} /><Button variant={danger ? "danger" : "secondary"} size="sm" className="w-full">{label}</Button></form>
  );
}

function CommentRow({ c, isCompany, staff }: { c: { id: string; body: string; createdAt: Date; author: { id: string; name: string; avatarUrl: string | null; role: string } }; isCompany: boolean; staff: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={c.author.name} src={c.author.avatarUrl} size={32} tone={isCompany ? "violet" : c.author.role === "TRAINER" ? "cyan" : "amber"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">{c.author.name}</span>{isCompany ? <Badge tone="violet">company</Badge> : null}<span className="text-xs text-dim">{timeAgo(c.createdAt)}</span>
          {staff ? <form action={moderateComment} className="ml-auto"><input type="hidden" name="id" value={c.id} /><button className="text-xs text-rose hover:underline">Remove</button></form> : null}</div>
        <p className="mt-1 whitespace-pre-line text-[15px] text-ink/90">{c.body}</p>
      </div>
    </div>
  );
}
