import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Liveness + database check for load balancers and uptime monitors. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up", time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, db: "down", error: (e as Error).message }, { status: 503 });
  }
}
