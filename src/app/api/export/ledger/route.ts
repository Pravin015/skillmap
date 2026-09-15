import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ledgerCsv, ledgerFor } from "@/lib/ledger";

/** Ledger CSV for the signed-in trainer or company (?party=<id> narrows to one counterparty). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const scope = user.trainerProfile ? { trainerId: user.trainerProfile.id } : user.membership ? { companyId: user.membership.company.id } : null;
  if (!scope) return NextResponse.json({ error: "no ledger for this account" }, { status: 403 });
  const party = new URL(req.url).searchParams.get("party");
  const { entries } = await ledgerFor(scope);
  const rows = party ? entries.filter((e) => e.partyId === party) : entries;
  return new NextResponse(ledgerCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="corpgurus-ledger-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
