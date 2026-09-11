"use client";

import { useRef, useState } from "react";
import { FileText, ImagePlus, X } from "lucide-react";
import { createPost } from "@/lib/actions/feed";
import { ActionForm, SubmitButton } from "./form-bits";
import { Avatar, Textarea } from "./ui";

export function PostComposer({ name, avatarUrl, tone, placeholder }: { name: string; avatarUrl: string | null; tone: "cyan" | "violet" | "amber"; placeholder?: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const clear = (which: "image" | "doc") => {
    if (which === "image") { setImage(null); if (imgRef.current) imgRef.current.value = ""; }
    else { setDoc(null); if (docRef.current) docRef.current.value = ""; }
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <ActionForm action={createPost} resetOnSuccess>
        <div className="flex items-start gap-3">
          <Avatar name={name} src={avatarUrl} size={40} tone={tone} />
          <div className="min-w-0 flex-1">
            <Textarea name="body" required maxLength={3000} placeholder={placeholder ?? "Share a session takeaway, a new certification, or a question for other trainers…"} className="min-h-24 border-0 bg-surface-2 focus:bg-white" />
            {image || doc ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {image ? <span className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs"><ImagePlus size={14} className="text-cyan" />{image}<button type="button" onClick={() => clear("image")} aria-label="Remove image"><X size={14} /></button></span> : null}
                {doc ? <span className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs"><FileText size={14} className="text-cyan" />{doc}<button type="button" onClick={() => clear("doc")} aria-label="Remove document"><X size={14} /></button></span> : null}
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-1">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
                <ImagePlus size={16} /> Photo
                <input ref={imgRef} type="file" name="image" accept="image/*" className="sr-only" onChange={(e) => setImage(e.target.files?.[0]?.name ?? null)} />
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
                <FileText size={16} /> Document
                <input ref={docRef} type="file" name="doc" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" className="sr-only" onChange={(e) => setDoc(e.target.files?.[0]?.name ?? null)} />
              </label>
              <span className="ml-auto"><SubmitButton size="sm" pendingText="Posting…">Post</SubmitButton></span>
            </div>
          </div>
        </div>
      </ActionForm>
    </div>
  );
}
