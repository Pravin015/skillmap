import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Configured = () => !!process.env.S3_BUCKET && !!process.env.S3_ACCESS_KEY_ID && !!process.env.S3_SECRET_ACCESS_KEY;
let s3: S3Client | null = null;
function client() {
  if (!s3) s3 = new S3Client({ region: process.env.S3_REGION || "auto", endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: !!process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
  return s3;
}
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".pdf": "application/pdf", ".ppt": "application/vnd.ms-powerpoint", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

/** Public files go to S3-compatible storage when configured (Cloudflare R2, MinIO, AWS), else to public/uploads. */
async function store(folder: string, name: string, buf: Buffer) {
  const ext = path.extname(name).toLowerCase();
  if (s3Configured()) {
    const key = `uploads/${folder}/${name}`;
    await client().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: buf, ContentType: MIME[ext] ?? "application/octet-stream", CacheControl: "public, max-age=31536000, immutable" }));
    const base = (process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`).replace(/\/$/, "");
    return `${base}/${key}`;
  }
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${folder}/${name}`;
}

const IMAGE = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const DOC = [".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx"];

/** Saves an uploaded file under public/uploads/<folder>/ and returns its public URL, or null when no file was sent. */
export async function saveUpload(file: File | null, folder: string, kinds: ("image" | "doc")[] = ["image", "doc"], maxMb = 5) {
  if (!file || !file.size) return null;
  if (file.size > maxMb * 1024 * 1024) throw new Error(`File must be under ${maxMb} MB`);
  const ext = path.extname(file.name).toLowerCase();
  const allowed = [...(kinds.includes("image") ? IMAGE : []), ...(kinds.includes("doc") ? DOC : [])];
  if (!allowed.includes(ext)) throw new Error(`Upload ${kinds.includes("image") && kinds.includes("doc") ? "an image, PDF or Office document" : kinds.includes("image") ? "an image" : "a PDF or Office document"}`);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  return store(folder, name, Buffer.from(await file.arrayBuffer()));
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
