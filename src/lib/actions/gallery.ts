"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";
import type { ActionState } from "@/lib/types";

function refresh(slug: string) {
  revalidatePath("/settings/gallery");
  revalidatePath(`/trainers/${slug}`);
  revalidatePath("/feed");
}

export async function addPhoto(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainers have a gallery." };
  let url: string | null = null;
  try { url = await saveUpload(fd.get("photo") as File | null, "gallery", ["image"], 10); } catch (e) { return { error: (e as Error).message }; }
  if (!url) return { error: "Choose a photo." };
  const caption = String(fd.get("caption") ?? "").trim().slice(0, 300);
  const takenOn = String(fd.get("takenOn") || "");
  const companyId = String(fd.get("companyId") || "") || null;
  const share = String(fd.get("share")) === "1";
  const count = await db.galleryPhoto.count({ where: { trainerId: user.trainerProfile.id } });
  if (count >= 60) return { error: "Gallery is limited to 60 photos. Remove some to add more." };
  await db.galleryPhoto.create({ data: { trainerId: user.trainerProfile.id, url, caption, takenOn: takenOn ? new Date(takenOn) : null, companyId } });
  if (share) await db.post.create({ data: { authorId: user.id, body: caption || "From a recent session.", imageUrl: url } });
  refresh(user.trainerProfile.slug);
  return { ok: share ? "Added to your gallery and shared to the feed." : "Added to your gallery." };
}

export async function deletePhoto(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  await db.galleryPhoto.deleteMany({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  refresh(user.trainerProfile.slug);
}
