import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

export async function GET() {
  return NextResponse.json({ enabled: pushConfigured(), publicKey: vapidPublicKey() });
}

/** Save or remove a browser push subscription for the signed-in member. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string }; remove?: boolean } | null;
  if (!body?.endpoint) return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  if (body.remove) { await db.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } }); return NextResponse.json({ ok: true }); }
  if (!body.keys?.p256dh || !body.keys.auth) return NextResponse.json({ error: "bad keys" }, { status: 400 });
  await db.pushSubscription.upsert({ where: { endpoint: body.endpoint }, create: { userId: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: req.headers.get("user-agent") }, update: { userId: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth } });
  return NextResponse.json({ ok: true });
}
