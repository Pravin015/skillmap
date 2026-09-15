import { NextResponse } from "next/server";
import { applyVerifyToken } from "@/lib/actions/account-security";
import { appUrl } from "@/lib/oauth";

/** Email links land here: confirms the address (or applies an email change) and bounces to the right page. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const to = await applyVerifyToken(token);
  return NextResponse.redirect(`${appUrl()}${to}`);
}
