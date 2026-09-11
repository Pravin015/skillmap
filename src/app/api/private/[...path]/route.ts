import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser, isStaff } from "@/lib/auth";

const TYPES: Record<string, string> = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

/** Staff-only access to private uploads (identity documents). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { path: parts } = await params;
  const rel = parts.join("/");
  if (rel.includes("..")) return NextResponse.json({ error: "bad path" }, { status: 400 });
  const abs = path.join(process.cwd(), "private-uploads", rel);
  try {
    const buf = await readFile(abs);
    return new NextResponse(buf, { headers: { "Content-Type": TYPES[path.extname(abs).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
