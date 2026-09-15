import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { memberCan } from "@/lib/permissions";
import { loadInvoiceDoc } from "@/lib/documents";
import { renderDocumentPdf } from "@/lib/pdf/documents";

/** PDF of a tax invoice for the trainer who raised it, the billed company's members and staff. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { id } = await params;
  const doc = await loadInvoiceDoc(id);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const allowed = doc.inv.trainer.user.id === user.id || memberCan(doc.inv.company.members, user.id, "view") || isStaff(user);
  if (!allowed) return NextResponse.json({ error: "not found" }, { status: 404 });
  const buffer = await renderDocumentPdf(doc.model);
  return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${doc.filename}"`, "Cache-Control": "private, no-store" } });
}
