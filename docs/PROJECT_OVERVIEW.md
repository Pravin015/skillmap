# AstraaHire — Project Overview

## TL;DR

AstraaHire is India's AI-powered career intelligence platform for fresh graduates.
We bridge the gap between college and first job with AI-powered roadmaps, mock
interviews, mentor sessions, and offer verification — all in one platform.

We're not a job board. We're not a coaching class. We're the operating system
that gets a graduate from "applying everywhere" to "choosing between offers."

---

## The Problem

Every year, ~10 million graduates leave Indian colleges with degrees but no direction:

- They don't know what their dream companies actually hire for
- They get rejected from TCS / Infosys / Wipro and don't know why
- They spend ₹50,000+ on coaching that teaches generic tips
- They can't tell real offer letters from scams (a ₹3,400 crore problem in 2024)
- Tier-2 and tier-3 students get filtered before recruiters even read their profile

**Industry consensus: 55% of Indian graduates are considered underprepared for the
workforce.** That's 5.5 million people every year wasting 1–2 years figuring out
the hiring game alone — when the right product could compress that to 12 weeks.

---

## What AstraaHire Does

We answer four critical questions for every fresh graduate:

1. **What does my dream company hire for?**
   We've decoded the skill requirements of 15+ top employers across India.

2. **What's my gap?**
   AI scores your profile against each company's actual hiring criteria.

3. **How do I close it?**
   Personalised week-by-week prep roadmaps, mock interviews, mentor sessions.

4. **Did I get hired safely?**
   Offer letter fraud detection — 20-parameter trust score in 30 seconds.

---

## Four Audiences, One Platform

### For Students & Fresh Graduates

- **AI Career Advisor** — Personalised guidance powered by Anthropic's Claude AI
- **Mock Interviews** — Practice for TCS, Infosys, Razorpay, Google, Amazon,
  KPMG, and 9 more companies. Real-time scoring, voice feedback, improvement plans
- **Smart Job Matching** — See only jobs that match your skills, with match scores
- **Skill Match Score** — AI scans your profile against any job's actual criteria
- **Mentor Sessions** — 1:1 with verified industry professionals from target companies
- **Proctored Skill Labs** — Demonstrate skills with timed MCQ assessments
  (fullscreen enforcement + webcam verification)
- **Offer Letter Verification** — Upload any offer letter, get a fraud trust
  score across 20 parameters in under 30 seconds
- **Live Job Aggregator** — Browse jobs from Adzuna India, Arbeitnow,
  Internshala, Remotive, and more — all in one feed

### For Industry Mentors

- **Earn ₹500–₹2,000 per session** — You set your rate, you keep 85%
- **Flexible scheduling** — Mentor on your terms, 4 hours a week or 4 a month
- **Verified mentor badge** — Build personal brand with shareable session reviews
- **No tire-kickers** — Every mentee is pre-vetted by the platform's AI
- **Get paid via UPI within 48 hours** — Flat 15% platform fee, no hidden cuts

### For Colleges & Institutions

- **Bulk Student Onboarding** — Upload entire batch via CSV
- **Placement Analytics** — Live placement %, top employers, average package,
  exportable PDFs for NAAC / NIRF audits
- **Proctored Exams** — College-level placement screening with webcam +
  fullscreen integrity (NIRF audit-ready)
- **Employer Connect** — Your students appear in employer searches filtered by
  your college
- **Free to partner** — Pricing scales with batch size

### For Companies & HR Teams

- **AI Candidate Matching** — Skill-match scoring against your exact JD
- **Proctored Assessments** — Free on every job post
- **Hackathon Hiring** — Run coding contests or case challenges, hire from
  the leaderboard
- **Offer Generation** — Verified e-signature offers, integrates with your HRMS
- **Faster screening** — Goal: cut shortlist time from 8 days to 2
- **Free to register** — Pay only for premium features when you need them

---

## Why Choose AstraaHire?

### vs LinkedIn / Naukri
They show you jobs. We tell you what each company hires for, prepare you to clear
it, and verify the offer is real. Different product. Different outcome.

### vs ₹50,000 coaching classes
- We're **₹0 to start**, **₹299/month** for premium. Less than a Netflix subscription.
- Personalised, not "200 students per batch generic content"
- AI mock interviews 24/7, not "next batch starts in March"
- We adapt to YOUR target company. They teach a generic curriculum.

### vs Free YouTube tutorials
- YouTube doesn't tell you which 5 of 5,000 videos to watch for YOUR target company
- YouTube can't grade your interview answers in real time
- YouTube doesn't verify your offer letter is real

---

## Key Differentiators

1. **Company-specific (not generic)** — We've mapped specific hiring criteria for
   15+ companies, not generic "interview tips."
2. **AI-powered (not rule-based)** — Claude grades mocks, generates roadmaps,
   scores skill matches.
3. **Proctored (not honor-system)** — Skills are demonstrated under fullscreen
   + webcam, not claimed in resume bullets.
4. **Verified mentors (not influencers)** — Every mentor verified through their
   actual employer. No life-coach hustle culture.
5. **Free tier (forever)** — Career help shouldn't be a luxury good.
6. **India-first** — Built for Indian graduates, Indian companies, Indian
   hiring patterns. Salaries in INR. Companies that actually hire freshers here.

---

## Pricing

| Plan              | Price             | What you get                                                                                                                          |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Explorer**      | ₹0 forever        | Browse jobs, basic AI advisor (10 msgs/day), 1 mock interview/month, live job aggregator                                              |
| **Career-Ready**  | ₹299 / month      | Unlimited mock interviews, mentor session credits, verified profile badge, proctored labs, offer letter verification                  |
| **Institutional** | Custom            | Bulk plans for colleges, universities, corporate L&D — placement analytics dashboard, priority support, custom integrations           |

- **No lock-ins.** Cancel anytime from settings.
- **Refunds processed in 7 working days** under our refund policy.
- **No credit card needed** to start the free tier.

---

## Current Status

AstraaHire is currently in **private beta**:

- ✅ Core platform live: jobs, courses, mock interviews, AI advisor, offer verification
- ✅ Job scraper aggregating from 6 public sources
  (Adzuna, Arbeitnow, Internshala, Remotive, Indeed RSS, LinkedIn guest)
- ✅ Payment infrastructure (Razorpay integrated, UPI/cards/netbanking)
- ✅ Email + OTP delivery via Resend (verified domain)
- ✅ File storage on Google Cloud Storage
- ✅ AI features powered by Anthropic Claude
- ✅ Multi-role auth: Student / HR / Org / Institution / Mentor / Admin

**First public outcomes report scheduled for Q3 2026.**

---

## Tech Stack (for the technically curious)

| Layer        | Tooling                                                  |
| ------------ | -------------------------------------------------------- |
| Frontend     | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Poppins |
| Backend      | Next.js API routes · Prisma 7 ORM · PostgreSQL           |
| Auth         | NextAuth · email + OTP verification                      |
| AI           | Anthropic Claude (Claude 3.5 Sonnet)                     |
| Payments     | Razorpay (UPI, cards, netbanking)                        |
| Email        | Resend (verified domain, transactional)                  |
| Storage      | Google Cloud Storage (profile photos, resume uploads)    |
| Hosting      | Railway (auto-deploy from `master`)                      |
| Job Scraper  | Custom Node scraper · 6 source adapters · 6h cron        |
| Proctoring   | Custom: fullscreen enforcement, tab-switch detection, webcam frame metadata |

---

## How to Get Started

| Audience       | Where to go                                                  |
| -------------- | ------------------------------------------------------------ |
| Students       | astraahire.com → Sign up free                                |
| Mentors        | astraahire.com/for-mentors → Apply                           |
| Companies      | astraahire.com/for-companies → Register your org             |
| Colleges       | astraahire.com/for-institutions → Partner with us            |
| Press / Sales  | support@astraahire.com                                       |

---

## Contact & Legal

- **Email:** support@astraahire.com
- **Website:** astraahire.com (currently ashpranix.in during beta)
- **Founded:** 2024
- **Headquartered:** India
- **Legal:** Privacy policy · Terms of service · Refund policy at /privacy /terms /refund-policy

---

## Disclosure

AstraaHire is currently in private beta. Some figures and stats shown on our
marketing site (placement rates by tier, target outcomes, mentor profiles,
partner colleges) are illustrative product targets that will be replaced with
audited cohort data once we publish our first quarterly outcomes report (Q3 2026).
Company logos shown indicate target employers our students apply to, not direct
partnerships unless explicitly stated.
