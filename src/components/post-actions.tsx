"use client";

import { useState } from "react";
import { Repeat2, UserPlus, UserCheck } from "lucide-react";
import { repost, toggleFollow } from "@/lib/actions/feed";
import { ActionForm, SubmitButton } from "./form-bits";
import { Button, Textarea } from "./ui";
import { cn } from "@/lib/utils";

export function RepostButton({ postId, count }: { postId: string; count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-surface-2", open ? "text-lime" : "text-muted hover:text-ink")}>
        <Repeat2 size={16} />{count}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-80 rounded-xl border border-line bg-white p-3 shadow-lg shadow-navy/10">
          <ActionForm action={repost} className="space-y-2">
            <input type="hidden" name="postId" value={postId} />
            <Textarea name="body" placeholder="Add a note (optional)" className="min-h-20" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <SubmitButton size="sm" pendingText="Reposting…"><Repeat2 size={14} /> Repost</SubmitButton>
            </div>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}

export function FollowButton({ userId, companyId, following, size = "md", className }: { userId?: string; companyId?: string; following: boolean; size?: "sm" | "md"; className?: string }) {
  return (
    <form action={toggleFollow} className={className}>
      {userId ? <input type="hidden" name="userId" value={userId} /> : null}
      {companyId ? <input type="hidden" name="companyId" value={companyId} /> : null}
      <Button variant={following ? "outline" : "secondary"} size={size} className="w-full">
        {following ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
      </Button>
    </form>
  );
}
