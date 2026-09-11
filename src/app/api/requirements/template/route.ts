import { NextResponse } from "next/server";

const TEMPLATE = `title,category,skills,mode,city,start_date,end_date,participants,budget_min,budget_max,currency,language,visibility,description
"HPE VM Essentials 9.0 · 3-day ILT for bank ops team",IT & Cloud,HPE VM Essentials;Morpheus,onsite,Mumbai,2026-11-03,2026-11-05,14,30000,40000,INR,English,public,"Vendor-authorised course for L2/L3 admins moving off VMware. Official courseware and HPE lab provided by us. Trainer must be HPE ASE for the track."
"PAN-OS essentials · 5 days virtual",Cybersecurity,Palo Alto PAN-OS,virtual,,2026-11-10,2026-11-14,12,28000,35000,INR,English,public,"EDU-210 aligned delivery for a SOC L1 team. We provide lab firewalls; trainer brings curriculum and day-5 runbook mapping."
`;

export function GET() {
  return new NextResponse(TEMPLATE, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="corpgurus-requirements-template.csv"' } });
}
