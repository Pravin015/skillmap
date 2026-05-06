// AstraaHire QA checklist — source of truth for /testing-platform.
//
// Every feature has a category here. Each item has a stable `id`
// (NEVER reuse one even if you rename a test — server status is keyed
// on it). Adding a new item means: pick a unique kebab-case id, write
// numbered repro steps a developer can follow, mark severity.
//
// Severity guide:
//   critical → blocks signup / payment / data integrity. Ship-blocker.
//   high     → core feature broken but workaround exists.
//   medium   → cosmetic or rarely-hit edge cases.
//   low      → nice-to-haves.

export type ChecklistStatus = "done" | "pending" | "not_tested";

export interface ChecklistItem {
  id: string;
  title: string;
  steps: string[];
  severity?: "critical" | "high" | "medium" | "low";
}

export interface ChecklistCategory {
  key: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
}

export const CHECKLIST: ChecklistCategory[] = [
  // ─────────────────────────── AUTH ───────────────────────────
  {
    key: "auth",
    title: "Authentication & signup",
    description: "Email + OTP signup, login, password reset, role-aware redirects.",
    items: [
      {
        id: "auth-signup-student-happy",
        title: "Student signup happy path",
        severity: "critical",
        steps: [
          "Open /auth/signup in incognito.",
          "Pick role STUDENT, fill name/email/phone/password, submit.",
          "Check email for OTP — should arrive within ~30 seconds via Resend.",
          "Enter OTP — should redirect to /onboarding or /dashboard depending on profile state.",
          "Verify the User row exists in DB with role=STUDENT and emailVerified set.",
        ],
      },
      {
        id: "auth-signup-otp-resend",
        title: "OTP resend works after cooldown",
        severity: "high",
        steps: [
          "On the OTP screen, click Resend immediately. Should be rate-limited (button disabled or 429).",
          "Wait 60s, click Resend again. New OTP should arrive.",
          "Old OTP should NOT work after a new one is issued.",
        ],
      },
      {
        id: "auth-signup-otp-wrong",
        title: "Wrong OTP shows error and counts down attempts",
        severity: "high",
        steps: [
          "Reach OTP screen. Enter 5 wrong codes one by one.",
          "Each error should show 'attempts remaining' or similar.",
          "After 5 fails the form should lock and require a new OTP.",
        ],
      },
      {
        id: "auth-signup-duplicate-email",
        title: "Duplicate email blocks signup",
        severity: "critical",
        steps: [
          "Try signing up with an email already in the DB.",
          "Should show 'Email already registered' on form submit (not after OTP).",
        ],
      },
      {
        id: "auth-login-happy",
        title: "Login redirects to correct dashboard per role",
        severity: "critical",
        steps: [
          "Log in as STUDENT → should land on /dashboard.",
          "Log in as ADMIN → should land on /admin.",
          "Log in as HR → /hr-dashboard.",
          "Log in as ORG → /company-dashboard.",
          "Log in as INSTITUTION → /institution-dashboard.",
          "Log in as MENTOR → /mentor-dashboard.",
        ],
      },
      {
        id: "auth-login-wrong-password",
        title: "Wrong password shows clear error",
        severity: "high",
        steps: [
          "Use a real email with the wrong password.",
          "Form should show 'Invalid credentials' — NOT 'email not found' (info leak).",
        ],
      },
      {
        id: "auth-forgot-password",
        title: "Password reset flow works end-to-end",
        severity: "critical",
        steps: [
          "Click 'Forgot password' on /auth/login.",
          "Enter your email, receive OTP via Resend.",
          "Enter OTP + new password.",
          "Try logging in with the OLD password — should fail.",
          "Try logging in with the NEW password — should succeed.",
        ],
      },
      {
        id: "auth-must-change-password",
        title: "Admin-created users forced to change password on first login",
        severity: "high",
        steps: [
          "Admin creates a HR user via /admin → Add User.",
          "Log in as that user — should be redirected to /auth/change-password.",
          "After changing, dashboard becomes accessible.",
        ],
      },
      {
        id: "auth-signout",
        title: "Sign out clears session",
        severity: "medium",
        steps: [
          "Log in. Click avatar menu → Sign out.",
          "Should redirect to /. Visiting /dashboard should redirect to login.",
        ],
      },
    ],
  },

  // ─────────────────────────── STUDENT FLOW ───────────────────────────
  {
    key: "student",
    title: "Student dashboard & profile",
    description: "Onboarding, dashboard, profile editing, role-specific features.",
    items: [
      {
        id: "student-onboarding",
        title: "First-time student onboarding flow",
        severity: "critical",
        steps: [
          "Sign up as STUDENT → land on /onboarding.",
          "Pick a domain (e.g. Cybersecurity), pick 3 dream companies.",
          "Complete the steps — should redirect to /dashboard.",
          "Profile fields should be saved in StudentProfile DB row.",
        ],
      },
      {
        id: "student-dashboard-load",
        title: "Dashboard loads with all sections visible",
        severity: "critical",
        steps: [
          "Open /dashboard as a student.",
          "Sidebar visible on lg+, bottom-tab strip on mobile.",
          "Sections present: AI Mentor, Openings, Applications, HR Interest, Resume, Profile Score, Mentorship, Events, Courses, Labs.",
          "Greeting shows first name in violet pill.",
        ],
      },
      {
        id: "student-profile-edit",
        title: "Profile editor saves changes",
        severity: "high",
        steps: [
          "Open /profile/edit.",
          "Update name, phone, skills, education, experience.",
          "Save — page should show success toast, refresh and persist.",
        ],
      },
      {
        id: "student-profile-photo",
        title: "Profile photo upload works (GCS)",
        severity: "high",
        steps: [
          "Profile editor → upload a JPG photo.",
          "Photo should appear in header avatar within 5 seconds.",
          "DB User row should have profileImage URL pointing to GCS bucket.",
          "Photo should also display on /profile/[profileNumber] public view.",
        ],
      },
      {
        id: "student-resume-upload",
        title: "Resume upload + parsing",
        severity: "high",
        steps: [
          "Dashboard → Resume card → Upload PDF.",
          "Should upload to GCS and show filename + size.",
          "Resume URL should appear in StudentProfile.resumeUrl.",
        ],
      },
    ],
  },

  // ─────────────────────────── JOBS ───────────────────────────
  {
    key: "jobs",
    title: "Jobs (internal + scraped)",
    description: "Browsing, filtering, applying, external redirects.",
    items: [
      {
        id: "jobs-listing-grid",
        title: "Jobs listing renders as grid (1/2/3/4 cols responsive)",
        severity: "high",
        steps: [
          "Open /jobs in desktop, tablet, and mobile widths.",
          "Cards should be: 4-col on xl, 3-col on lg, 2-col on sm, 1-col on mobile.",
          "Job titles should NOT render as 2.5rem — should be small (text-sm).",
        ],
      },
      {
        id: "jobs-filters",
        title: "Filters correctly narrow results",
        severity: "high",
        steps: [
          "Open /jobs.",
          "Pick a domain (e.g. Cybersecurity) — only matching jobs show.",
          "Pick a work mode (Remote) — combines with domain filter.",
          "Pick salary range — combines.",
          "Type in search box — filters live by title/company/skill.",
          "Click 'Clear all' — all jobs reappear.",
        ],
      },
      {
        id: "jobs-detail-page",
        title: "Job detail page loads",
        severity: "critical",
        steps: [
          "Click any job card.",
          "Should land on /jobs/[id] with description, skills, perks.",
          "Sidebar should show Apply button + Connect Mentor section.",
        ],
      },
      {
        id: "jobs-apply",
        title: "Application submission saves to DB",
        severity: "critical",
        steps: [
          "Open a job detail page as a student.",
          "Click Apply Now — fill cover letter, submit.",
          "Should show success toast.",
          "Application row should appear in /dashboard → Applied tab.",
          "DB Application row should exist with status=APPLIED.",
        ],
      },
      {
        id: "jobs-external-listing",
        title: "/jobs/external shows aggregated jobs",
        severity: "high",
        steps: [
          "After running the scraper at least once, open /jobs/external.",
          "Cards show 'via Adzuna India' or 'via Arbeitnow' badges.",
          "Filters work: domain, work mode, vertical (Internship vs Full-time).",
        ],
      },
      {
        id: "jobs-external-apply-redirect",
        title: "External Apply button redirects to source URL",
        severity: "critical",
        steps: [
          "Open any /jobs/external card.",
          "Click 'Apply on [Source]'.",
          "Browser should open the source's apply URL in a new tab.",
          "Click count for that ExternalJob should increment in DB.",
        ],
      },
    ],
  },

  // ─────────────────────────── COURSES ───────────────────────────
  {
    key: "courses",
    title: "Courses",
    description: "Browse, enroll, modules, quizzes, sequential unlock, certificates.",
    items: [
      {
        id: "courses-listing",
        title: "/courses page lists published courses",
        severity: "high",
        steps: [
          "Open /courses in incognito.",
          "Should show all PUBLISHED courses as cards.",
          "Search box filters by title/skill/category.",
          "Difficulty + pricing filters work.",
        ],
      },
      {
        id: "courses-enroll",
        title: "Student can enroll in a free course",
        severity: "critical",
        steps: [
          "Log in as student → /courses → click any free course.",
          "Click 'Enroll — Free'.",
          "Progress bar should appear at 0%.",
          "CourseEnrollment row should exist in DB.",
        ],
      },
      {
        id: "courses-module-complete",
        title: "Mark module complete updates progress",
        severity: "high",
        steps: [
          "After enrolling, open a module without quiz.",
          "Click 'Mark as Complete'.",
          "Progress should increment proportionally.",
          "completedModules array in DB should include the module ID.",
        ],
      },
      {
        id: "courses-quiz",
        title: "Module quiz submits and grades correctly",
        severity: "high",
        steps: [
          "Open a course where at least one module has hasQuiz=true.",
          "Answer the quiz, click Submit.",
          "If score >= 70%, module auto-marks complete.",
          "If score < 70%, show 'Not passed' with correct answers.",
        ],
      },
      {
        id: "courses-sequential-unlock",
        title: "Sequential unlock blocks future modules until current is done",
        severity: "high",
        steps: [
          "Open a course with sequentialUnlock=true.",
          "Module 2/3/4 should show lock icon and not be clickable until prev complete.",
          "Complete module 1 → module 2 unlocks.",
        ],
      },
      {
        id: "courses-certificate",
        title: "Completing course generates a certificate",
        severity: "critical",
        steps: [
          "Complete all modules in a course.",
          "Progress should hit 100%.",
          "Certificate generation button should appear.",
          "Click it → /verify/[certId] should render the certificate.",
          "Open the verify URL in incognito — should show name, course, date, ID.",
        ],
      },
      {
        id: "courses-create",
        title: "Admin/Institution can create a course",
        severity: "high",
        steps: [
          "Log in as ADMIN or INSTITUTION → /courses/create.",
          "Fill all fields including 2+ modules.",
          "Submit. ADMIN courses publish immediately. INSTITUTION goes to PENDING_REVIEW.",
        ],
      },
    ],
  },

  // ─────────────────────────── AI / MOCK INTERVIEW ───────────────────────────
  {
    key: "ai",
    title: "AI Advisor & Mock Interview",
    description: "Anthropic Claude integration. Requires ANTHROPIC_API_KEY env var.",
    items: [
      {
        id: "ai-chat-basic",
        title: "AI Advisor chat returns a response",
        severity: "critical",
        steps: [
          "Open /chat as a logged-in student.",
          "Type any career question.",
          "Should stream a response within 5 seconds (Claude streaming).",
          "If you see 'Sorry, couldn\\'t connect to the AI service' — ANTHROPIC_API_KEY is missing.",
        ],
      },
      {
        id: "ai-chat-rate-limit",
        title: "Free tier rate limits at 10 messages/day",
        severity: "medium",
        steps: [
          "As a free-tier student, send 10 messages.",
          "11th message should show upgrade prompt.",
          "Premium subscribers should not be limited.",
        ],
      },
      {
        id: "mock-interview-list",
        title: "/mock-interview shows 15+ company tracks",
        severity: "high",
        steps: [
          "Open /mock-interview.",
          "Should list TCS, Infosys, Razorpay, Google, Amazon, etc. as practice tracks.",
        ],
      },
      {
        id: "mock-interview-self",
        title: "Self-paced mock interview runs end-to-end",
        severity: "critical",
        steps: [
          "Pick any company → Self-paced.",
          "Answer 3-5 questions in text.",
          "Submit — should call Claude to grade each answer.",
          "Show overall score + per-question feedback.",
          "MockInterview row in DB with status COMPLETED.",
        ],
      },
      {
        id: "mock-interview-history",
        title: "Mock interview history page lists past attempts",
        severity: "medium",
        steps: [
          "After completing 1+ mock, open /mock-interview/history.",
          "Should list all past attempts with score + date.",
        ],
      },
    ],
  },

  // ─────────────────────────── OFFER VERIFICATION ───────────────────────────
  {
    key: "offer-verify",
    title: "Offer letter verification",
    description: "20-parameter fraud scan. Uses Claude for analysis.",
    items: [
      {
        id: "offer-verify-upload",
        title: "Upload + scan returns trust score",
        severity: "critical",
        steps: [
          "Log in → /offer-verify.",
          "Upload a sample PDF offer letter.",
          "Wait 10-30s for Claude to analyse.",
          "Trust score should display (0-100) with breakdown of flags.",
          "OfferVerification row in DB with the result.",
        ],
      },
      {
        id: "offer-verify-fake-detection",
        title: "Obvious fake should score < 40",
        severity: "high",
        steps: [
          "Upload an obviously suspicious offer (free email domain, pay-to-join, etc.)",
          "Trust score should be low (red zone) with specific flags listed.",
        ],
      },
    ],
  },

  // ─────────────────────────── HR / RECRUITER ───────────────────────────
  {
    key: "hr",
    title: "HR / Recruiter dashboard",
    description: "Job posting, applicants, candidate search.",
    items: [
      {
        id: "hr-create-job",
        title: "HR creates a new job opening",
        severity: "critical",
        steps: [
          "Log in as HR → /hr-dashboard → Create Job.",
          "Fill all fields. Submit.",
          "Job should appear in 'My Posts' tab AND on public /jobs page.",
        ],
      },
      {
        id: "hr-applications-tab",
        title: "Received applications visible to job poster",
        severity: "high",
        steps: [
          "After someone applies to your job, open Applications tab.",
          "Application should appear with applicant info + cover letter.",
        ],
      },
      {
        id: "hr-update-application-status",
        title: "Move applicant through stages",
        severity: "high",
        steps: [
          "Open an application.",
          "Change stage: APPLIED → SCREENED → INTERVIEW → OFFER.",
          "Stage transitions should save to DB and notify the applicant.",
        ],
      },
      {
        id: "hr-jd-matcher",
        title: "JD Matcher returns top candidates",
        severity: "medium",
        steps: [
          "/hr-dashboard → JD Matcher.",
          "Paste a JD, click Match.",
          "Top candidates should appear with skill-match scores.",
        ],
      },
    ],
  },

  // ─────────────────────────── INSTITUTION ───────────────────────────
  {
    key: "institution",
    title: "Institution dashboard",
    description: "Bulk student onboarding, placement analytics.",
    items: [
      {
        id: "institution-bulk-add",
        title: "CSV bulk student upload",
        severity: "high",
        steps: [
          "Log in as INSTITUTION → /institution-dashboard → Add Student.",
          "Upload a CSV with name/email columns for 5+ students.",
          "All rows should be created as STUDENT users tagged to this institution.",
        ],
      },
      {
        id: "institution-analytics",
        title: "Placement analytics dashboard renders",
        severity: "medium",
        steps: [
          "Open /institution-dashboard → Analytics tab.",
          "Should show placement %, top employers, avg package.",
        ],
      },
    ],
  },

  // ─────────────────────────── ADMIN ───────────────────────────
  {
    key: "admin",
    title: "Admin panel",
    description: "User management, content moderation, scraper, payments overview.",
    items: [
      {
        id: "admin-overview-loads",
        title: "Admin overview shows real stats",
        severity: "critical",
        steps: [
          "Log in as ADMIN → /admin.",
          "Sidebar visible with all categories (Users, Content, Analytics, etc.).",
          "Overview cards show real counts (users, jobs, events, blog posts).",
          "Sidebar category labels (USER MANAGEMENT, CONTENT, etc.) should be visible (not invisible cream-on-white).",
        ],
      },
      {
        id: "admin-add-user",
        title: "Admin creates a new user with any role",
        severity: "high",
        steps: [
          "Admin → Add User → pick role (HR/MENTOR/etc.).",
          "Fill name, email, organisation. Submit.",
          "User receives a welcome email with temp password.",
          "User must change password on first login.",
        ],
      },
      {
        id: "admin-mentor-approval",
        title: "Approve/reject mentor applications",
        severity: "high",
        steps: [
          "Admin → Mentors tab → see pending applications.",
          "Approve one → that user gains MENTOR role + appears on public /mentors.",
        ],
      },
      {
        id: "admin-forms-review",
        title: "Form submissions land in admin Forms tab",
        severity: "high",
        steps: [
          "Submit any /forms/* page (e.g. /forms/contact).",
          "Admin → Forms tab → submission should appear with all fields.",
        ],
      },
      {
        id: "admin-scrape-runs",
        title: "Manual scraper trigger works",
        severity: "high",
        steps: [
          "Admin → External Jobs (Scraped) → opens /admin/scrape-runs.",
          "Pick a source (e.g. arbeitnow), click Trigger Run.",
          "Run should complete within 60s with itemsFound/Inserted/Updated counts.",
          "Jobs should appear on /jobs/external.",
        ],
      },
    ],
  },

  // ─────────────────────────── PAYMENTS ───────────────────────────
  {
    key: "payments",
    title: "Razorpay payments",
    description: "Premium subscription. Requires test or live Razorpay keys.",
    items: [
      {
        id: "payments-checkout-opens",
        title: "Checkout modal opens with correct amount",
        severity: "critical",
        steps: [
          "Log in as student → /pricing → click 'Go premium' on Career-Ready.",
          "Razorpay modal should open showing ₹299.",
          "If 'Failed to create payment order' appears — RAZORPAY_KEY_ID/SECRET missing.",
        ],
      },
      {
        id: "payments-test-card",
        title: "Test mode card payment succeeds",
        severity: "critical",
        steps: [
          "Use Razorpay test card 4111 1111 1111 1111, any future date, CVV 123.",
          "Should succeed and redirect to /pricing with success message.",
          "Subscription row in DB with status ACTIVE.",
          "User should now see premium badge on profile.",
        ],
      },
      {
        id: "payments-webhook",
        title: "Razorpay webhook captures async payments",
        severity: "critical",
        steps: [
          "Initiate payment, close browser BEFORE redirect completes.",
          "After 1-2 minutes, check DB Payment row — should still be marked CAPTURED.",
          "This requires the webhook URL configured in Razorpay dashboard pointing to /api/payments/webhook.",
        ],
      },
      {
        id: "payments-failure-handler",
        title: "Failed payment shows correct error",
        severity: "high",
        steps: [
          "Use test card 4000 0000 0000 0002 (always-fail).",
          "Should show payment-failed message, not silent.",
        ],
      },
    ],
  },

  // ─────────────────────────── EMAIL ───────────────────────────
  {
    key: "email",
    title: "Email delivery (Resend)",
    description: "OTP, password reset, transactional. Requires verified Resend domain.",
    items: [
      {
        id: "email-otp-delivery",
        title: "OTP email arrives within 30 seconds",
        severity: "critical",
        steps: [
          "Trigger any OTP flow (signup, login, password reset).",
          "Email should arrive within 30s.",
          "From address should be on a verified Resend domain.",
          "If using a free Gmail in RESEND_FROM_EMAIL, it'll silently fail.",
        ],
      },
      {
        id: "email-password-reset",
        title: "Password reset email contains valid link",
        severity: "high",
        steps: [
          "Trigger password reset.",
          "Click the link in the email — should open the reset page with token pre-filled.",
        ],
      },
      {
        id: "email-application-notify",
        title: "Application notifications sent to HR",
        severity: "medium",
        steps: [
          "Apply to a job as a student.",
          "HR who posted the job should receive an email about the new application.",
        ],
      },
    ],
  },

  // ─────────────────────────── FORMS ───────────────────────────
  {
    key: "forms",
    title: "Public forms",
    description: "Contact, partner, mentor application, hire-from-us, job-posting, onboarding.",
    items: [
      {
        id: "forms-contact",
        title: "/contact form submits successfully",
        severity: "high",
        steps: [
          "Open /contact in incognito.",
          "Fill name, email, message.",
          "Submit — should show success state.",
          "Admin → Forms tab should show the submission within 30s.",
        ],
      },
      {
        id: "forms-mentor-onboarding",
        title: "Mentor application submits",
        severity: "high",
        steps: [
          "Open /forms/mentor-onboarding.",
          "Fill all required fields.",
          "Submit — admin should be notified.",
        ],
      },
      {
        id: "forms-institution-onboarding",
        title: "Institution onboarding submits",
        severity: "medium",
        steps: ["Open /forms/institution-onboarding.", "Submit and verify it lands in admin Forms tab."],
      },
    ],
  },

  // ─────────────────────────── UI / RESPONSIVE ───────────────────────────
  {
    key: "ui",
    title: "UI / responsive",
    description: "Cosmetic but visible to every user. Test on real phone, not just devtools.",
    items: [
      {
        id: "ui-mobile-header",
        title: "Mobile header pill — only logo + burger visible",
        severity: "high",
        steps: [
          "Open / on a real phone (or 360px devtools).",
          "Header pill should show: A logo + burger icon. NO 'Sign in' / 'Get started' text.",
          "Tapping burger opens the mobile drawer.",
        ],
      },
      {
        id: "ui-mobile-no-horizontal-scroll",
        title: "No horizontal scroll on any public page",
        severity: "high",
        steps: [
          "On phone, scroll through /, /jobs, /courses, /pricing, /about, /contact.",
          "There should be NO horizontal scroll bar at any point.",
        ],
      },
      {
        id: "ui-mega-menu",
        title: "Mega menu opens within viewport",
        severity: "medium",
        steps: [
          "On desktop, hover Company / Platform / Resources / Plans & Support.",
          "Each should open a 3-column mega menu within the viewport.",
          "Click outside should close it.",
        ],
      },
      {
        id: "ui-comparison-table-mobile",
        title: "Homepage comparison table responsive",
        severity: "low",
        steps: [
          "On phone, scroll to 'The honest comparison'.",
          "Should show only Feature / AstraaHire / Coaching columns (Naukri + LinkedIn hidden).",
          "Footnote 'Naukri & LinkedIn columns visible on desktop' shows.",
        ],
      },
      {
        id: "ui-hero-blobs",
        title: "Hero gradient blobs visible (not plain)",
        severity: "low",
        steps: [
          "Open / — soft peach + green blobs should be visible behind the hero.",
          "On scroll, additional violet/pink blobs appear mid-page.",
        ],
      },
    ],
  },

  // ─────────────────────────── INFRA ───────────────────────────
  {
    key: "infra",
    title: "Infrastructure & ops",
    description: "Cron jobs, DB migrations, env vars, deploys.",
    items: [
      {
        id: "infra-cron-scrape",
        title: "Cron POST to /api/cron/scrape-jobs returns 200",
        severity: "critical",
        steps: [
          "From a terminal: curl -X POST https://astraahire.com/api/cron/scrape-jobs -H 'x-cron-secret: $CRON_SECRET'.",
          "Should return { ok: true, results: [...] }.",
          "Returns 401 if CRON_SECRET wrong/missing.",
          "Returns 500 if env not set at all.",
        ],
      },
      {
        id: "infra-db-migrations",
        title: "Latest schema deployed to prod DB",
        severity: "critical",
        steps: [
          "After every schema change, run: npx prisma db push (or migrate deploy).",
          "Run a query that uses the new model — should not error.",
        ],
      },
      {
        id: "infra-gcs-upload",
        title: "GCS uploads work in prod",
        severity: "critical",
        steps: [
          "Upload a profile photo from prod.",
          "DB should have a URL pointing to the GCS bucket.",
          "Open the URL in a fresh tab — should display the image.",
        ],
      },
    ],
  },
];
