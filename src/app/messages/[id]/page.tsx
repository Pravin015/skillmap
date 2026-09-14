import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip, Send } from "lucide-react";
import { LiveRefresh } from "@/components/live-refresh";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sendMessage } from "@/lib/actions/network";
import { Avatar, Button, Input } from "@/components/ui";
import { ConversationList } from "../list";
import { loadConversations } from "../data";
import { fmtDate } from "@/lib/utils";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const convo = await db.conversation.findFirst({
    where: { id, participants: { some: { userId: user.id } } },
    include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, role: true, trainerProfile: { select: { slug: true } }, memberships: { select: { company: { select: { name: true, slug: true } } } } } } } }, messages: { include: { sender: { select: { name: true } } }, orderBy: { createdAt: "asc" } }, requirement: { select: { id: true, title: true } } },
  });
  if (!convo) notFound();
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: user.id } }, data: { lastReadAt: new Date() } });
  const other = convo.participants.find((p) => p.userId !== user.id)!.user;
  const convos = await loadConversations(user.id);
  const otherHref = other.trainerProfile ? `/trainers/${other.trainerProfile.slug}` : other.memberships[0] ? `/companies/${other.memberships[0].company.slug}` : "#";

  const rows = convo.messages.map((m, i) => ({ m, showDay: i === 0 || fmtDate(m.createdAt) !== fmtDate(convo.messages[i - 1].createdAt) }));
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <LiveRefresh conversationId={id} />
      <aside className="hidden lg:block"><ConversationList convos={convos} me={user.id} activeId={id} /></aside>
      <section className="flex h-[calc(100vh-11rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-line bg-white">
        <header className="flex items-center gap-3 border-b border-line px-5 py-3">
          <Avatar name={other.name} src={other.avatarUrl} size={36} tone={other.role === "COMPANY" ? "violet" : "cyan"} />
          <div className="min-w-0">
            <Link href={otherHref} className="font-semibold hover:text-cyan">{other.name}</Link>
            <p className="truncate text-xs text-muted">{other.memberships[0] ? other.memberships[0].company.name : "Trainer"}{convo.requirement ? <> · <Link href={`/requirements/${convo.requirement.id}`} className="text-violet hover:underline">{convo.requirement.title}</Link></> : null}</p>
          </div>
          <Link href="/messages" className="ml-auto text-xs text-muted hover:text-ink lg:hidden">All conversations</Link>
        </header>
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {rows.map(({ m, showDay }) => {
            const dayLabel = fmtDate(m.createdAt);
            const mine = m.senderId === user.id;
            return (
              <div key={m.id}>
                {showDay ? <p className="mono my-3 text-center text-[10px] uppercase tracking-[0.14em] text-dim">{dayLabel}</p> : null}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${mine ? "rounded-br-sm bg-cyan text-white" : "rounded-bl-sm bg-surface-2 text-ink border border-line"}`}>
                    <p className="whitespace-pre-line">{m.body}</p>
                    {m.attachmentUrl ? (/\.(png|jpe?g|webp|gif)$/i.test(m.attachmentUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer"><img src={m.attachmentUrl} alt={m.attachmentName ?? ""} className="mt-2 max-h-64 rounded-lg" /></a>
                    ) : <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${mine ? "border-white/30 text-white" : "border-line text-cyan"}`}><Paperclip size={12} />{m.attachmentName ?? "Attachment"}</a>) : null}
                    <p className={`mono mt-1 text-[10px] ${mine ? "text-white/70" : "text-dim"}`}>{new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(m.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {!convo.messages.length ? <p className="py-10 text-center text-sm text-muted">Say hello to {other.name.split(" ")[0]}.</p> : null}
        </div>
        <form action={sendMessage} className="flex gap-2 border-t border-line p-3">
          <input type="hidden" name="conversationId" value={id} />
          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line-2 bg-white text-muted hover:bg-surface-2" title="Attach a file"><Paperclip size={16} /><input type="file" name="attachment" accept="image/*,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" className="sr-only" /></label>
          <Input name="body" placeholder={`Message ${other.name.split(" ")[0]}…`} autoComplete="off" autoFocus />
          <Button type="submit"><Send size={15} /> Send</Button>
        </form>
      </section>
    </div>
  );
}
