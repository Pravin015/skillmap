// Generates AstraaHire-Project-Overview.docx from PROJECT_OVERVIEW.md content.
// Run: node scripts/build-overview-docx.js
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, WidthType, BorderStyle,
  ShadingType, PageBreak,
} = require("docx");

const NODE_MODULES_GLOBAL = process.env.npm_config_prefix || "";
void NODE_MODULES_GLOBAL;

const PRIMARY = "7C3AED";
const INK = "0F0E14";
const MUTED = "6B6776";
const BORDER = "E8E2D6";
const ACCENT_BG = "F5F3FF";

const border = { style: BorderStyle.SINGLE, size: 6, color: BORDER };
const cellBorders = { top: border, bottom: border, left: border, right: border };

// ───────── helpers ─────────
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, color: INK })],
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, color: INK })],
});
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, color: PRIMARY })],
});
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text, color: opts.muted ? MUTED : INK, italics: !!opts.italic, bold: !!opts.bold })],
});
const pInline = (runs) => new Paragraph({ spacing: { after: 120 }, children: runs });
const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { after: 60 },
  children: [new TextRun({ text, color: INK })],
});
const bulletWithBold = (boldText, rest) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 60 },
  children: [
    new TextRun({ text: boldText + " ", bold: true, color: INK }),
    new TextRun({ text: rest, color: INK }),
  ],
});
const numbered = (text) => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  spacing: { after: 80 },
  children: [new TextRun({ text, color: INK })],
});
const numberedBold = (boldText, rest) => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  spacing: { after: 80 },
  children: [
    new TextRun({ text: boldText, bold: true, color: INK }),
    new TextRun({ text: " — " + rest, color: INK }),
  ],
});
const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER, space: 1 } },
  spacing: { before: 240, after: 240 },
});

const tableCell = (content, opts = {}) => new TableCell({
  borders: cellBorders,
  width: { size: opts.width, type: WidthType.DXA },
  shading: opts.header ? { fill: ACCENT_BG, type: ShadingType.CLEAR, color: "auto" } : undefined,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: [new Paragraph({
    children: [new TextRun({
      text: content,
      bold: !!opts.header || !!opts.bold,
      color: opts.color || (opts.header ? INK : INK),
      size: 22,
    })],
  })],
});

function table(headerRow, rows, columnWidths) {
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map((text, i) => tableCell(text, { width: columnWidths[i], header: true })),
      }),
      ...rows.map((row) => new TableRow({
        children: row.map((text, i) => tableCell(text, { width: columnWidths[i] })),
      })),
    ],
  });
}

// ───────── document content ─────────
const children = [
  // Title
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "AstraaHire", bold: true, size: 56, color: PRIMARY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 480 },
    children: [new TextRun({ text: "Project Overview", size: 28, color: MUTED })],
  }),

  // TL;DR
  h1("TL;DR"),
  p("AstraaHire is India's AI-powered career intelligence platform for fresh graduates. We bridge the gap between college and first job with AI-powered roadmaps, mock interviews, mentor sessions, and offer verification — all in one platform."),
  p("We're not a job board. We're not a coaching class. We're the operating system that gets a graduate from “applying everywhere” to “choosing between offers.”"),
  divider(),

  // Problem
  h1("The Problem"),
  p("Every year, ~10 million graduates leave Indian colleges with degrees but no direction:"),
  bullet("They don't know what their dream companies actually hire for"),
  bullet("They get rejected from TCS / Infosys / Wipro and don't know why"),
  bullet("They spend ₹50,000+ on coaching that teaches generic tips"),
  bullet("They can't tell real offer letters from scams (a ₹3,400 crore problem in 2024)"),
  bullet("Tier-2 and tier-3 students get filtered before recruiters even read their profile"),
  pInline([
    new TextRun({ text: "Industry consensus: 55% of Indian graduates are considered underprepared for the workforce. ", bold: true, color: INK }),
    new TextRun({ text: "That's 5.5 million people every year wasting 1–2 years figuring out the hiring game alone — when the right product could compress that to 12 weeks.", color: INK }),
  ]),
  divider(),

  // What it does
  h1("What AstraaHire Does"),
  p("We answer four critical questions for every fresh graduate:"),
  numberedBold("What does my dream company hire for?", "We've decoded the skill requirements of 15+ top employers across India."),
  numberedBold("What's my gap?", "AI scores your profile against each company's actual hiring criteria."),
  numberedBold("How do I close it?", "Personalised week-by-week prep roadmaps, mock interviews, mentor sessions."),
  numberedBold("Did I get hired safely?", "Offer letter fraud detection — 20-parameter trust score in 30 seconds."),
  divider(),

  // Audiences
  h1("Four Audiences, One Platform"),

  h2("For Students & Fresh Graduates"),
  bulletWithBold("AI Career Advisor", "Personalised guidance powered by Anthropic's Claude AI."),
  bulletWithBold("Mock Interviews", "Practice for TCS, Infosys, Razorpay, Google, Amazon, KPMG, and 9 more companies. Real-time scoring, voice feedback, improvement plans."),
  bulletWithBold("Smart Job Matching", "See only jobs that match your skills, with explicit match scores."),
  bulletWithBold("Skill Match Score", "AI scans your profile against any job's actual hiring criteria."),
  bulletWithBold("Mentor Sessions", "1:1 with verified industry professionals from your target companies."),
  bulletWithBold("Proctored Skill Labs", "Demonstrate skills with timed MCQ assessments — fullscreen enforcement + webcam verification."),
  bulletWithBold("Offer Letter Verification", "Upload any offer letter, get a fraud trust score across 20 parameters in under 30 seconds."),
  bulletWithBold("Live Job Aggregator", "Browse jobs from Adzuna India, Arbeitnow, Internshala, Remotive, and more — all in one feed."),

  h2("For Industry Mentors"),
  bulletWithBold("Earn ₹500–₹2,000 per session", "You set your rate. You keep 85%."),
  bulletWithBold("Flexible scheduling", "Mentor on your terms. 4 hours a week or 4 a month."),
  bulletWithBold("Verified mentor badge", "Build personal brand with shareable session reviews."),
  bulletWithBold("No tire-kickers", "Every mentee is pre-vetted by the platform's AI."),
  bulletWithBold("Get paid via UPI within 48 hours", "Flat 15% platform fee. No hidden cuts."),

  h2("For Colleges & Institutions"),
  bulletWithBold("Bulk Student Onboarding", "Upload entire batch via CSV."),
  bulletWithBold("Placement Analytics", "Live placement %, top employers, average package, exportable PDFs for NAAC / NIRF audits."),
  bulletWithBold("Proctored Exams", "College-level placement screening with webcam + fullscreen integrity (NIRF audit-ready)."),
  bulletWithBold("Employer Connect", "Your students appear in employer searches filtered by your college."),
  bulletWithBold("Free to partner", "Pricing scales with batch size."),

  h2("For Companies & HR Teams"),
  bulletWithBold("AI Candidate Matching", "Skill-match scoring against your exact JD."),
  bulletWithBold("Proctored Assessments", "Free on every job post."),
  bulletWithBold("Hackathon Hiring", "Run coding contests or case challenges — hire from the leaderboard."),
  bulletWithBold("Offer Generation", "Verified e-signature offers, integrates with your HRMS."),
  bulletWithBold("Faster screening", "Goal: cut shortlist time from 8 days to 2."),
  bulletWithBold("Free to register", "Pay only for premium features when you need them."),
  divider(),

  // Why choose us
  h1("Why Choose AstraaHire?"),
  h3("vs LinkedIn / Naukri"),
  p("They show you jobs. We tell you what each company hires for, prepare you to clear it, and verify the offer is real. Different product. Different outcome."),
  h3("vs ₹50,000 coaching classes"),
  bullet("₹0 to start. ₹299/month for premium. Less than a Netflix subscription."),
  bullet("Personalised, not “200 students per batch generic content.”"),
  bullet("AI mock interviews 24/7, not “next batch starts in March.”"),
  bullet("We adapt to your target company. They teach a generic curriculum."),
  h3("vs Free YouTube tutorials"),
  bullet("YouTube doesn't tell you which 5 of 5,000 videos to watch for your target company."),
  bullet("YouTube can't grade your interview answers in real time."),
  bullet("YouTube doesn't verify your offer letter is real."),
  divider(),

  // Differentiators
  h1("Key Differentiators"),
  numberedBold("Company-specific (not generic)", "We've mapped specific hiring criteria for 15+ companies."),
  numberedBold("AI-powered (not rule-based)", "Claude grades mocks, generates roadmaps, scores skill matches."),
  numberedBold("Proctored (not honor-system)", "Skills are demonstrated under fullscreen + webcam, not claimed in resume bullets."),
  numberedBold("Verified mentors (not influencers)", "Every mentor verified through their actual employer. No life-coach hustle culture."),
  numberedBold("Free tier (forever)", "Career help shouldn't be a luxury good."),
  numberedBold("India-first", "Built for Indian graduates, Indian companies, Indian hiring patterns."),
  divider(),

  // Pricing table
  h1("Pricing"),
  table(
    ["Plan", "Price", "What you get"],
    [
      ["Explorer", "₹0 forever", "Browse jobs, basic AI advisor (10 msgs/day), 1 mock interview/month, live job aggregator"],
      ["Career-Ready", "₹299 / month", "Unlimited mock interviews, mentor session credits, verified profile badge, proctored labs, offer letter verification"],
      ["Institutional", "Custom", "Bulk plans for colleges, universities, corporate L&D — placement analytics dashboard, priority support, custom integrations"],
    ],
    [1800, 1800, 5760],
  ),
  new Paragraph({ spacing: { before: 200 }, children: [] }),
  bullet("No lock-ins. Cancel anytime from settings."),
  bullet("Refunds processed in 7 working days under our refund policy."),
  bullet("No credit card needed to start the free tier."),
  divider(),

  // Status
  h1("Current Status"),
  p("AstraaHire is currently in private beta:", { bold: true }),
  bullet("Core platform live: jobs, courses, mock interviews, AI advisor, offer verification"),
  bullet("Job scraper aggregating from 6 public sources (Adzuna, Arbeitnow, Internshala, Remotive, Indeed RSS, LinkedIn guest)"),
  bullet("Payment infrastructure (Razorpay integrated, UPI/cards/netbanking)"),
  bullet("Email + OTP delivery via Resend (verified domain)"),
  bullet("File storage on Google Cloud Storage"),
  bullet("AI features powered by Anthropic Claude"),
  bullet("Multi-role auth: Student / HR / Org / Institution / Mentor / Admin"),
  pInline([
    new TextRun({ text: "First public outcomes report scheduled for Q3 2026.", bold: true, color: INK }),
  ]),
  divider(),

  // Tech stack
  h1("Tech Stack"),
  p("For the technically curious.", { italic: true, muted: true }),
  table(
    ["Layer", "Tooling"],
    [
      ["Frontend", "Next.js 16 (App Router), React 19, Tailwind CSS v4, Poppins"],
      ["Backend", "Next.js API routes, Prisma 7 ORM, PostgreSQL"],
      ["Auth", "NextAuth, email + OTP verification"],
      ["AI", "Anthropic Claude (Claude 3.5 Sonnet)"],
      ["Payments", "Razorpay (UPI, cards, netbanking)"],
      ["Email", "Resend (verified domain, transactional)"],
      ["Storage", "Google Cloud Storage (profile photos, resume uploads)"],
      ["Hosting", "Railway (auto-deploy from master)"],
      ["Job Scraper", "Custom Node scraper, 6 source adapters, 6h cron"],
      ["Proctoring", "Fullscreen enforcement, tab-switch detection, webcam frame metadata"],
    ],
    [2400, 6960],
  ),
  divider(),

  // Get started
  h1("How to Get Started"),
  table(
    ["Audience", "Where to go"],
    [
      ["Students", "astraahire.com — Sign up free"],
      ["Mentors", "astraahire.com/for-mentors — Apply"],
      ["Companies", "astraahire.com/for-companies — Register your org"],
      ["Colleges", "astraahire.com/for-institutions — Partner with us"],
      ["Press / Sales", "support@astraahire.com"],
    ],
    [2400, 6960],
  ),
  divider(),

  // Contact
  h1("Contact & Legal"),
  bulletWithBold("Email:", "support@astraahire.com"),
  bulletWithBold("Website:", "astraahire.com"),
  bulletWithBold("Founded:", "2024"),
  bulletWithBold("Headquartered:", "India"),
  bulletWithBold("Legal:", "Privacy policy / Terms of service / Refund policy at /privacy /terms /refund-policy"),
  divider(),

  // Disclosure
  h1("Disclosure"),
  p("AstraaHire is currently in private beta. Some figures and stats shown on our marketing site (placement rates by tier, target outcomes, mentor profiles, partner colleges) are illustrative product targets that will be replaced with audited cohort data once we publish our first quarterly outcomes report (Q3 2026). Company logos shown indicate target employers our students apply to, not direct partnerships unless explicitly stated.", { italic: true, muted: true }),
];

// ───────── document ─────────
const doc = new Document({
  creator: "AstraaHire",
  title: "AstraaHire — Project Overview",
  description: "Project overview document for AstraaHire — India's career intelligence platform.",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "Calibri", color: INK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Calibri", color: PRIMARY },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Calibri", color: PRIMARY },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    },
  ],
});

const outPath = "C:\\Users\\Administrator\\Desktop\\All-App-information\\AstraaHire-Project-Overview.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("wrote", outPath, buf.length, "bytes");
});
