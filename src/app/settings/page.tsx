import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addCertification, deleteCertification, inviteMember, removeMember, updateAccount, updateCompany, updateEmailPrefs, updateTrainerProfile, uploadIdentity } from "@/lib/actions/profile";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Alert, Avatar, Badge, Button, ButtonLink, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { certStatusLabel, COMPANY_SIZES, CURRENCIES, DELIVERY_MODES, fmtDate, modeLabel } from "@/lib/utils";
import { unlinkProvider } from "@/lib/actions/oauth";
import { PROVIDER_LIST, providerName } from "@/lib/oauth";
import { OAuthButtons } from "@/components/oauth-buttons";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await requireUser("/settings");
  const account = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true, emailNotifications: true, identityVerifiedAt: true, identityDocUrl: true, identityNote: true, oauthAccounts: { select: { provider: true, email: true, createdAt: true } } } });
  const hasPassword = !!account?.passwordHash;
  const linked = new Map((account?.oauthAccounts ?? []).map((a) => [a.provider, a]));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow="Settings" title={user.trainerProfile ? "Your trainer profile" : user.membership ? "Company page & team" : "Account"} body={welcome ? "Welcome aboard. Complete the essentials below so people can find you." : undefined} actions={<div className="flex flex-wrap gap-2">{user.trainerProfile ? <><ButtonLink href="/settings/availability" variant="secondary" size="sm">Availability</ButtonLink><ButtonLink href="/settings/courses" variant="secondary" size="sm">Courses</ButtonLink><ButtonLink href="/settings/gallery" variant="secondary" size="sm">Gallery</ButtonLink></> : null}{user.trainerProfile || user.membership ? <ButtonLink href="/settings/billing" variant="secondary" size="sm">Plan & billing</ButtonLink> : null}</div>} />
      {welcome ? <Alert tone="cyan">Account created. {user.trainerProfile ? "Add your skills, rate and certifications to get verified." : "Complete your company page, then post your first requirement."}</Alert> : null}

      {user.trainerProfile ? <TrainerSettings userId={user.id} profileId={user.trainerProfile.id} /> : null}
      {user.membership ? <CompanySettings companyId={user.membership.company.id} isOwner={user.membership.role === "OWNER"} me={user.id} /> : null}

      {user.trainerProfile ? (
        <Card className="p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Identity verification</h2>{account?.identityVerifiedAt ? <Badge tone="lime">Identity verified</Badge> : account?.identityDocUrl ? <Badge tone="amber">Under review</Badge> : <Badge>Not verified</Badge>}</div>
          <p className="mt-1 text-sm text-muted">Upload a government ID (Aadhaar, PAN, passport or driving licence). It is stored privately, visible only to CorpGurus staff, and earns the Identity verified badge.</p>
          {account?.identityNote ? <p className="mt-2 text-sm text-rose">{account.identityNote}</p> : null}
          {!account?.identityVerifiedAt ? (
            <ActionForm action={uploadIdentity} className="mt-4 flex flex-wrap items-end gap-3" resetOnSuccess>
              <Field label="Document" hint="PDF or image, under 8 MB" className="flex-1"><Input name="document" type="file" accept=".pdf,image/*" required className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
              <SubmitButton variant="secondary" pendingText="Uploading…">Submit for review</SubmitButton>
            </ActionForm>
          ) : null}
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="text-lg font-bold">Email notifications</h2>
        <form action={updateEmailPrefs} className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="emailNotifications" value="1" defaultChecked={account?.emailNotifications ?? true} className="accent-cyan" /> Email me about applications, work orders, invoices, invitations and verification results</label>
          <Button variant="secondary" size="sm">Save</Button>
        </form>
        <p className="mt-2 text-xs text-muted">Messages, likes and comments stay in-app only.</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Connected accounts</h2>
        <p className="mt-1 text-sm text-muted">Sign in with Google or LinkedIn. Linking uses the same email as this account.</p>
        <div className="mt-4 divide-y divide-line rounded-xl border border-line">
          {PROVIDER_LIST.map((p) => {
            const a = linked.get(p);
            const canUnlink = !!a && (hasPassword || linked.size > 1);
            return (
              <div key={p} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="font-medium">{providerName(p)}</p><p className="text-xs text-muted">{a ? `Linked${a.email ? ` as ${a.email}` : ""} · ${fmtDate(a.createdAt)}` : "Not linked"}</p></div>
                {a ? <Badge tone="lime">linked</Badge> : <Badge>not linked</Badge>}
                {a && canUnlink ? <form action={unlinkProvider}><input type="hidden" name="provider" value={p} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Unlink</Button></form> : null}
                {a && !canUnlink ? <span className="text-xs text-dim">Set a password before unlinking</span> : null}
              </div>
            );
          })}
        </div>
        {linked.size < PROVIDER_LIST.length ? <div className="mt-4"><OAuthButtons label="Link" next="/settings" divider={false} /></div> : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">{hasPassword ? "Password" : "Set a password"}</h2>
        {!hasPassword ? <p className="mt-1 text-sm text-muted">You currently sign in through a linked provider. Setting a password adds email sign-in as a backup.</p> : null}
        <ActionForm action={updateAccount} className="mt-4 grid gap-4 md:grid-cols-2">
          {hasPassword ? <Field label="Current password"><Input name="current" type="password" required autoComplete="current-password" /></Field> : <input type="hidden" name="current" value="" />}
          <Field label="New password"><Input name="next" type="password" required minLength={8} autoComplete="new-password" /></Field>
          <div className="md:col-span-2"><SubmitButton variant="secondary">{hasPassword ? "Update password" : "Set password"}</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}

async function TrainerSettings({ userId, profileId }: { userId: string; profileId: string }) {
  const [p, skills, u] = await Promise.all([
    db.trainerProfile.findUnique({ where: { id: profileId }, include: { skills: true, certifications: { orderBy: { createdAt: "desc" } } } }),
    db.skill.findMany({ orderBy: { name: "asc" } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true, avatarUrl: true } }),
  ]);
  if (!p || !u) return null;
  const mine = new Set(p.skills.map((s) => s.slug));
  return (
    <>
      <Card className="p-6">
        <ActionForm action={updateTrainerProfile} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={u.name} src={u.avatarUrl} size={64} />
            <Field label="Photo" hint="PNG or JPG, under 5 MB" className="flex-1"><Input name="avatar" type="file" accept="image/*" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name"><Input name="name" defaultValue={u.name} required /></Field>
            <Field label="Years of experience"><Input name="yearsExperience" type="number" min={0} defaultValue={p.yearsExperience} /></Field>
          </div>
          <Field label="Headline" hint="Shown in search results. Lead with what you teach."><Input name="headline" defaultValue={p.headline} required /></Field>
          <Field label="About" hint="Who you have trained, how you deliver, what participants leave with."><Textarea name="bio" defaultValue={p.bio} className="min-h-32" /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cities" hint="Comma separated"><Input name="cities" defaultValue={p.cities.join(", ")} placeholder="Bengaluru, Chennai" /></Field>
            <Field label="Languages" hint="Comma separated"><Input name="languages" defaultValue={p.languages.join(", ")} placeholder="English, Hindi" /></Field>
          </div>
          <Field label="Delivery modes">
            <div className="flex flex-wrap gap-3">{DELIVERY_MODES.map((m) => <label key={m} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"><input type="checkbox" name="deliveryModes" value={m} defaultChecked={p.deliveryModes.includes(m)} className="accent-cyan" />{modeLabel[m]}</label>)}</div>
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Currency"><Select name="currency" defaultValue={p.currency}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Day rate · min"><Input name="dayRateMin" type="number" min={0} step={500} defaultValue={p.dayRateMin ?? ""} /></Field>
            <Field label="Day rate · max"><Input name="dayRateMax" type="number" min={0} step={500} defaultValue={p.dayRateMax ?? ""} /></Field>
          </div>
          <p className="-mt-2 text-xs text-dim">Rates are visible only to signed-in company accounts, never to guests or other trainers.</p>
          <Field label="Availability note" hint="e.g. “Booked until 20 Oct. Weekends possible.”"><Input name="availabilityNote" defaultValue={p.availabilityNote ?? ""} /></Field>
          <Field label="Intro video link" hint="YouTube, Vimeo or Loom. Shown on your profile."><Input name="videoUrl" defaultValue={p.videoUrl ?? ""} placeholder="https://" /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="GSTIN" hint="Printed on your invoices"><Input name="gstin" defaultValue={p.gstin ?? ""} placeholder="Optional" /></Field>
            <Field label="Payment details" hint="Bank or UPI, printed on invoices"><Textarea name="paymentDetails" defaultValue={p.paymentDetails ?? ""} className="min-h-16" /></Field>
          </div>
          <Field label="Skills" hint="Tick everything you can deliver. Requirements with these skills notify you.">
            <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line bg-surface-2 p-3 scrollbar-thin">
              {skills.map((s) => <label key={s.id} className="cursor-pointer"><input type="checkbox" name="skills" value={s.slug} defaultChecked={mine.has(s.slug)} className="peer sr-only" /><span className="inline-block rounded-full border border-line-2 px-2.5 py-0.5 text-xs text-muted transition peer-checked:border-cyan peer-checked:bg-cyan peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-cyan/50">{s.name}</span></label>)}
            </div>
          </Field>
          <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
        </ActionForm>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Certifications</h2>{p.verifiedAt ? <Badge tone="lime">Verified trainer</Badge> : <Badge tone="amber">Not yet verified</Badge>}</div>
        <p className="mt-1 text-sm text-muted">Upload the certificate PDF or image. An administrator verifies it and your profile earns the badge.</p>
        {p.certifications.length ? (
          <div className="mt-4 divide-y divide-line rounded-xl border border-line">
            {p.certifications.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="font-medium">{c.name}</p><p className="text-xs text-muted">{c.issuer}{c.credentialId ? ` · ${c.credentialId}` : ""}{c.issuedOn ? ` · ${fmtDate(c.issuedOn)}` : ""}{c.fileUrl ? <> · <a href={c.fileUrl} target="_blank" className="text-cyan hover:underline">file</a></> : null}</p>{c.reviewNote ? <p className="text-xs text-rose">{c.reviewNote}</p> : null}</div>
                <Badge tone={c.status === "VERIFIED" ? "lime" : c.status === "PENDING" ? "amber" : "rose"}>{certStatusLabel[c.status]}</Badge>
                {c.status !== "VERIFIED" ? <form action={deleteCertification}><input type="hidden" name="id" value={c.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Remove</Button></form> : null}
              </div>
            ))}
          </div>
        ) : null}
        <ActionForm action={addCertification} className="mt-5 grid gap-4 md:grid-cols-2" resetOnSuccess>
          <Field label="Certification"><Input name="name" required placeholder="HPE ASE – Hybrid Cloud" /></Field>
          <Field label="Issuer"><Input name="issuer" required placeholder="Hewlett Packard Enterprise" /></Field>
          <Field label="Credential ID"><Input name="credentialId" placeholder="Optional" /></Field>
          <Field label="Certificate file" hint="PDF or image"><Input name="file" type="file" accept=".pdf,image/*" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
          <Field label="Issued on"><Input name="issuedOn" type="date" /></Field>
          <Field label="Expires on"><Input name="expiresOn" type="date" /></Field>
          <div className="md:col-span-2"><SubmitButton variant="secondary" pendingText="Submitting…">Submit for verification</SubmitButton></div>
        </ActionForm>
      </Card>
    </>
  );
}

async function CompanySettings({ companyId, isOwner, me }: { companyId: string; isOwner: boolean; me: string }) {
  const [c, meUser] = await Promise.all([
    db.company.findUnique({ where: { id: companyId }, include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }, orderBy: { joinedAt: "asc" } } } }),
    db.user.findUnique({ where: { id: me }, select: { name: true } }),
  ]);
  if (!c) return null;
  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Company page</h2>{c.domainVerifiedAt ? <Badge tone="lime">Domain verified</Badge> : <Badge tone="amber">{c.domain ? `Verification pending · ${c.domain}` : "No work domain"}</Badge>}</div>
        <ActionForm action={updateCompany} className="mt-4 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={c.name} src={c.logoUrl} size={64} tone="violet" className="rounded-xl" />
            <Field label="Logo" className="flex-1"><Input name="logo" type="file" accept="image/*" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name"><Input name="name" defaultValue={c.name} required /></Field>
            <Field label="Your name"><Input name="memberName" defaultValue={meUser?.name} required /></Field>
            <Field label="Industry"><Input name="industry" defaultValue={c.industry} placeholder="IT Services" /></Field>
            <Field label="Company size"><Select name="size" defaultValue={c.size || ""}><option value="">—</option>{COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Website"><Input name="website" defaultValue={c.website ?? ""} placeholder="https://" /></Field>
            <Field label="Cities" hint="Comma separated"><Input name="cities" defaultValue={c.cities.join(", ")} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="GSTIN" hint={c.gstVerifiedAt ? "Verified by CorpGurus" : "Staff verify it for the GST verified badge"}><Input name="gstin" defaultValue={c.gstin ?? ""} placeholder="27AAAAA0000A1Z5" /></Field>
            <Field label="Billing address" hint="Printed on invoices from trainers"><Textarea name="billingAddress" defaultValue={c.billingAddress ?? ""} className="min-h-16" /></Field>
          </div>
          <Field label="Company type"><Select name="type" defaultValue={c.type}><option value="DIRECT">Direct employer · we train our own people</option><option value="TRAINING_PARTNER">Training partner · we deliver for clients</option></Select></Field>
          <Field label="About" hint="What you train, how often, and what you provide trainers (lab, courseware, venue)."><Textarea name="description" defaultValue={c.description} className="min-h-28" /></Field>
          <SubmitButton variant="violet" pendingText="Saving…">Save company page</SubmitButton>
        </ActionForm>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Team</h2>
        <p className="mt-1 text-sm text-muted">Owners manage members and billing. Recruiters post requirements, shortlist and message.</p>
        <div className="mt-4 divide-y divide-line rounded-xl border border-line">
          {c.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.user.name} src={m.user.avatarUrl} size={36} tone="violet" />
              <div className="min-w-0 flex-1"><p className="font-medium">{m.user.name}{m.userId === me ? <span className="text-muted"> (you)</span> : null}</p><p className="text-xs text-muted">{m.user.email}</p></div>
              <Badge tone={m.role === "OWNER" ? "violet" : "neutral"}>{m.role}</Badge>
              {isOwner && m.userId !== me ? <form action={removeMember}><input type="hidden" name="id" value={m.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Remove</Button></form> : null}
            </div>
          ))}
        </div>
        {isOwner ? (
          <ActionForm action={inviteMember} className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_160px_auto] md:items-end" resetOnSuccess>
            <Field label="Name"><Input name="name" required placeholder="Kavya Singh" /></Field>
            <Field label="Work email"><Input name="email" type="email" required placeholder="kavya@company.com" /></Field>
            <Field label="Role"><Select name="role" defaultValue="RECRUITER"><option value="RECRUITER">Recruiter</option><option value="OWNER">Owner</option></Select></Field>
            <SubmitButton variant="secondary">Add member</SubmitButton>
          </ActionForm>
        ) : null}
      </Card>
    </>
  );
}
