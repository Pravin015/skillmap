// POST /api/institution/students/bulk
// Accepts CSV text body and creates STUDENT users in batch under the
// caller's institution. Skips rows with duplicate emails. Returns
// per-row results so the UI can show what succeeded vs what failed.
//
// Expected CSV format (header row required, columns can be in any order):
//   name,email,degree,gradYear,phone
//
// Only `name` + `email` are required. Other columns are optional.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateProfileNumber } from "@/lib/profile-number";

const MAX_ROWS = 500; // hard cap so a runaway CSV can't melt the DB

interface RowResult {
  row: number;
  email: string;
  status: "created" | "skipped" | "failed";
  reason?: string;
  tempPassword?: string;
  profileNumber?: string;
}

// Tiny CSV parser — quoted fields with embedded commas, escaped quotes ("").
// We don't pull in a library since the input is tiny + we control the schema.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped ""
        else inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') { inQuotes = true; continue; }
    if (c === ",") { cur.push(field); field = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") {
      cur.push(field);
      // Drop fully-empty rows
      if (cur.length > 1 || cur[0].trim() !== "") rows.push(cur);
      cur = [];
      field = "";
      continue;
    }
    field += c;
  }
  // Final row without trailing newline
  if (field || cur.length > 0) {
    cur.push(field);
    if (cur.length > 1 || cur[0].trim() !== "") rows.push(cur);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!userId || (userRole !== "INSTITUTION" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Only institutions can bulk-onboard students" }, { status: 403 });
  }

  // Accept either raw CSV (text/csv) or { csv: "..." } JSON for easier UI calling.
  const contentType = req.headers.get("content-type") || "";
  let csvText = "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    csvText = String(body.csv || "");
  } else {
    csvText = await req.text();
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  // Map header columns
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIdx = (key: string) => header.indexOf(key);

  const nameIdx = colIdx("name");
  const emailIdx = colIdx("email");
  const degreeIdx = colIdx("degree");
  const gradYearIdx = colIdx("gradyear");
  const phoneIdx = colIdx("phone");

  if (nameIdx === -1 || emailIdx === -1) {
    return NextResponse.json(
      { error: "CSV must include 'name' and 'email' columns. Optional: degree, gradYear, phone." },
      { status: 400 }
    );
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ROWS} students per upload. Split your CSV into smaller batches.` },
      { status: 413 }
    );
  }

  const institution = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, organisation: true },
  });
  const collegeName = institution?.organisation || institution?.name || null;

  const results: RowResult[] = [];

  // Process rows sequentially. With <=500 rows + ~3 DB roundtrips each
  // (existing-check + user.create + profile.create), this runs in <30s
  // even on the worst-case shared Postgres tier.
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for header row
    const name = (row[nameIdx] || "").trim();
    const email = (row[emailIdx] || "").trim().toLowerCase();
    const degree = degreeIdx >= 0 ? (row[degreeIdx] || "").trim() : "";
    const gradYear = gradYearIdx >= 0 ? (row[gradYearIdx] || "").trim() : "";
    const phone = phoneIdx >= 0 ? (row[phoneIdx] || "").trim() : "";

    if (!name || !email) {
      results.push({ row: rowNum, email, status: "failed", reason: "Missing name or email" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ row: rowNum, email, status: "failed", reason: "Invalid email format" });
      continue;
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        results.push({ row: rowNum, email, status: "skipped", reason: "Email already registered" });
        continue;
      }

      const tempPassword = Math.random().toString(36).slice(-8) + "S1!";
      const hashed = await bcrypt.hash(tempPassword, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: "STUDENT",
          degree: degree || null,
          gradYear: gradYear || null,
          phone: phone || null,
          mustChangePassword: true,
        },
      });

      const profile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          profileNumber: generateProfileNumber(),
          institutionId: userId,
          collegeName,
        },
      });

      results.push({
        row: rowNum,
        email,
        status: "created",
        tempPassword,
        profileNumber: profile.profileNumber,
      });
    } catch (err) {
      console.error(`Bulk row ${rowNum} failed:`, err);
      results.push({ row: rowNum, email, status: "failed", reason: "Internal error — try this row again later" });
    }
  }

  const summary = {
    total: dataRows.length,
    created: results.filter((r) => r.status === "created").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
  };

  return NextResponse.json({ summary, results });
}
