import Link from "next/link";
import { Avatar } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import type { ConversationRow } from "./data";

export function ConversationList({ convos, me, activeId }: { convos: ConversationRow[]; me: string; activeId?: string }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {convos.map((c) => {
        const other = c.participants.find((p) => p.userId !== me)?.user;
        const mine = c.participants.find((p) => p.userId === me);
        const last = c.messages[0];
        const unread = last && last.senderId !== me && (!mine?.lastReadAt || mine.lastReadAt < last.createdAt);
        if (!other) return null;
        return (
          <Link key={c.id} href={`/messages/${c.id}`} className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-2 ${activeId === c.id ? "bg-cyan/[0.05]" : ""}`}>
            <Avatar name={other.name} src={other.avatarUrl} size={40} tone={other.role === "COMPANY" ? "violet" : other.role === "TRAINER" ? "cyan" : "amber"} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm"><span className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>{other.name}</span>{unread ? <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> : null}<span className="ml-auto text-xs text-dim">{last ? timeAgo(last.createdAt) : ""}</span></p>
              {c.requirement ? <p className="truncate text-[11px] text-violet">{c.requirement.title}</p> : null}
              <p className={`truncate text-sm ${unread ? "text-ink" : "text-muted"}`}>{last ? `${last.senderId === me ? "You: " : ""}${last.body}` : "No messages yet"}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
