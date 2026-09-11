import { requireUser } from "@/lib/auth";
import { Empty, PageHeader } from "@/components/ui";
import { ConversationList } from "./list";
import { loadConversations } from "./data";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const convos = await loadConversations(user.id);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Inbox" title="Messages" body="Direct conversations with your connections and applicants." />
      {convos.length ? <ConversationList convos={convos} me={user.id} /> : <Empty title="No conversations yet" body="Message a trainer from their profile, or an applicant from the applicants view." />}
    </div>
  );
}
