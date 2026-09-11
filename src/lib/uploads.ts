import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const DOC = [".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx"];

/** Saves an uploaded file under public/uploads/<folder>/ and returns its public URL, or null when no file was sent. */
export async function saveUpload(file: File | null, folder: string, kinds: ("image" | "doc")[] = ["image", "doc"], maxMb = 5) {
  if (!file || !file.size) return null;
  if (file.size > maxMb * 1024 * 1024) throw new Error(`File must be under ${maxMb} MB`);
  const ext = path.extname(file.name).toLowerCase();
  const allowed = [...(kinds.includes("image") ? IMAGE : []), ...(kinds.includes("doc") ? DOC : [])];
  if (!allowed.includes(ext)) throw new Error(`Upload ${kinds.includes("image") && kinds.includes("doc") ? "an image, PDF or Office document" : kinds.includes("image") ? "an image" : "a PDF or Office document"}`);
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}

/** Stores under private-uploads/ (outside public/). Served only through /api/private/[...path] to staff. */
export async function savePrivateUpload(file: File | null, folder: string, maxMb = 8) {
  if (!file || !file.size) return null;
  if (file.size > maxMb * 1024 * 1024) throw new Error(`File must be under ${maxMb} MB`);
  const ext = path.extname(file.name).toLowerCase();
  if (![...IMAGE, ".pdf"].includes(ext)) throw new Error("Upload a PDF or image");
  const dir = path.join(process.cwd(), "private-uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/private/${folder}/${name}`;
}

export const isImageUrl = (u: string) => IMAGE.includes(path.extname(u).toLowerCase());
