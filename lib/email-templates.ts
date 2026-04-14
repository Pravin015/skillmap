function layout(heading: string, body: string, ctaText?: string, ctaUrl?: string): string {
  const cta = ctaText && ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;background:#0a0a0f;color:#e8ff47;font-family:'Segoe UI',sans-serif;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;margin-top:20px">${ctaText}</a>` : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Segoe UI','DM Sans',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:20px">
  <div style="background:#0a0a0f;border-radius:16px 16px 0 0;padding:20px 28px">
    <span style="font-weight:800;font-size:18px;color:#fff">Skill</span><span style="background:#e8ff47;color:#0a0a0f;padding:1px 6px;border-radius:4px;font-weight:800;font-size:18px">Map</span>
  </div>
  <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px 28px;border:1px solid rgba(10,10,15,0.08);border-top:none">
    <h1 style="font-size:20px;font-weight:800;color:#0a0a0f;margin:0 0 16px">${heading}</h1>
    <div style="font-size:14px;line-height:1.7;color:rgba(10,10,15,0.55)">${body}</div>
    ${cta}
  </div>
  <div style="text-align:center;padding:24px 0;font-size:12px;color:rgba(10,10,15,0.3)">
    <p>AstraaHire · India's job-readiness engine</p>
    <p><a href="https://ashpranix.in" style="color:rgba(10,10,15,0.3)">ashpranix.in</a> · <a href="mailto:support@ashpranix.in" style="color:rgba(10,10,15,0.3)">support@ashpranix.in</a></p>
  </div>
</div></body></html>`;
}

export type TemplateData = Record<string, string | number | undefined>;

export function getEmailTemplate(type: string, data: TemplateData): { subject: string; html: string } {
  const base = "https://ashpranix.in";
  const d = data;

  switch (type) {
    case "ACCOUNT_CREATED":
      return { subject: "Welcome to AstraaHire!", html: layout("Welcome to AstraaHire! 🎉",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your account has been created successfully. You're now part of India's first job-readiness platform.</p><p>Complete your profile to start getting matched with opportunities at your dream companies.</p>`,
        "Complete your profile", `${base}/profile/edit`) };

    case "APPLICATION_SUBMITTED":
      return { subject: `Applied: ${d.role} at ${d.company}`, html: layout("Application Submitted ✅",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your application for <strong>${d.role}</strong> at <strong>${d.company}</strong> has been submitted successfully.</p><p>Your skill match score: <strong>${d.score}%</strong></p><p>The hiring team will review your profile. We'll notify you when there's an update.</p>`,
        "View your applications", `${base}/dashboard`) };

    case "APPLICATION_VIEWED":
      return { subject: `${d.company} viewed your profile`, html: layout("Your Profile Was Viewed 👀",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Great news! An HR from <strong>${d.company}</strong> viewed your profile. This means your application is getting attention.</p><p>Make sure your profile is complete and up-to-date to make the best impression.</p>`,
        "Update your profile", `${base}/profile/edit`) };

    case "APPLICATION_STATUS_CHANGED":
      return { subject: `Update: ${d.role} at ${d.company}`, html: layout("Application Update",
        `<p>Hi <strong>${d.name}</strong>,</p><p>There's an update on your application for <strong>${d.role}</strong> at <strong>${d.company}</strong>.</p><p>New status: <strong style="color:#0a0a0f">${d.status}</strong></p>`,
        "View details", `${base}/dashboard`) };

    case "SHORTLISTED":
      return { subject: `Shortlisted for ${d.role} at ${d.company}!`, html: layout("You've Been Shortlisted! ⭐",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Congratulations! You've been <strong>shortlisted</strong> for <strong>${d.role}</strong> at <strong>${d.company}</strong>.</p><p>The next step is typically an interview. Prepare well — use our AI Advisor for a customised prep plan.</p>`,
        "Get AI prep plan", `${base}/chat`) };

    case "REJECTED":
      return { subject: `Update on your ${d.company} application`, html: layout("Application Update",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Unfortunately, your application for <strong>${d.role}</strong> at <strong>${d.company}</strong> was not selected to move forward.</p><p>Don't be discouraged — keep building your skills and applying. The right opportunity is out there.</p>`,
        "Browse more jobs", `${base}/jobs`) };

    case "INTERVIEW_SCHEDULED":
      return { subject: `Interview scheduled: ${d.company}`, html: layout("Interview Scheduled! 📅",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your interview for <strong>${d.role}</strong> at <strong>${d.company}</strong> has been scheduled.</p><p>Status: <strong>Interview</strong></p><p>Prepare with our AI advisor for company-specific interview tips.</p>`,
        "Prepare with AI", `${base}/chat`) };

    case "OFFER_RECEIVED":
      return { subject: `Offer from ${d.company}! 🎉`, html: layout("Congratulations — Offer Received! 🎉",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Amazing news! You've received an <strong>offer</strong> for <strong>${d.role}</strong> at <strong>${d.company}</strong>.</p><p>Your hard work paid off. We're incredibly happy for you!</p>`,
        "View dashboard", `${base}/dashboard`) };

    case "NEW_JOB_MATCH":
      return { subject: `New job: ${d.role} at ${d.company}`, html: layout("New Job Matching Your Profile 💼",
        `<p>Hi <strong>${d.name}</strong>,</p><p>A new job has been posted that matches your skills:</p><p><strong>${d.role}</strong> at <strong>${d.company}</strong><br>${d.location} · ${d.workMode}</p>`,
        "View & apply", `${base}/jobs/${d.jobId}`) };

    case "NEW_EVENT":
      return { subject: `New event: ${d.title}`, html: layout("New Event Alert 🎤",
        `<p>Hi <strong>${d.name}</strong>,</p><p>A new event has been posted:</p><p><strong>${d.title}</strong><br>by ${d.host} · ${d.date}</p><p>${d.pricing === "FREE" ? "This event is free!" : `Ticket: ₹${d.price}`}</p>`,
        "View event", `${base}/events/${d.eventId}`) };

    case "PROFILE_INCOMPLETE":
      return { subject: "Your profile is only " + d.score + "% complete", html: layout("Complete Your Profile 📊",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your AstraaHire profile is only <strong>${d.score}% complete</strong>. A complete profile gets <strong>3x more views</strong> from recruiters.</p><p>Here's what's missing:</p><ul>${d.missing}</ul>`,
        "Complete now", `${base}/profile/edit`) };

    case "ADD_RESUME":
      return { subject: "Add your resume to increase visibility", html: layout("Upload Your Resume 📄",
        `<p>Hi <strong>${d.name}</strong>,</p><p>You haven't uploaded your resume yet. Candidates with resumes get <strong>2x more interview calls</strong>.</p>`,
        "Upload resume", `${base}/profile/edit`) };

    case "PASSWORD_CHANGED":
      return { subject: "Your password was changed", html: layout("Password Changed 🔐",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your AstraaHire password was successfully changed. If you didn't make this change, please contact us immediately at <a href="mailto:support@ashpranix.in">support@ashpranix.in</a>.</p>`) };

    case "INVITE_RECEIVED":
      return { subject: `${d.company} invited you to apply!`, html: layout("You've Been Invited! ✉️",
        `<p>Hi <strong>${d.name}</strong>,</p><p><strong>${d.company}</strong> has invited you to apply for a position. This means they've seen your profile and are interested!</p>`,
        "View invitation", `${base}/dashboard`) };

    case "JOB_CLOSING_SOON":
      return { subject: `Last chance: ${d.role} at ${d.company}`, html: layout("Job Closing Soon ⏰",
        `<p>Hi <strong>${d.name}</strong>,</p><p>The <strong>${d.role}</strong> position at <strong>${d.company}</strong> is closing soon. Don't miss out!</p><p>Deadline: <strong>${d.deadline}</strong></p>`,
        "Apply now", `${base}/jobs/${d.jobId}`) };

    // ═══ HR TEMPLATES ═══
    case "HR_NEW_APPLICATION":
      return { subject: `New application for ${d.role}`, html: layout("New Application Received 📩",
        `<p>Hi <strong>${d.name}</strong>,</p><p><strong>${d.candidateName}</strong> has applied for <strong>${d.role}</strong>.</p><p>Skill match: <strong>${d.score}%</strong></p><p>Review their profile and take action.</p>`,
        "Review application", `${base}/hr-dashboard`) };

    case "HR_HIGH_MATCH_CANDIDATE":
      return { subject: `High match: ${d.candidateName} (${d.score}%) for ${d.role}`, html: layout("High Match Candidate Alert ⭐",
        `<p>Hi <strong>${d.name}</strong>,</p><p>A candidate with a <strong>${d.score}% skill match</strong> just applied for <strong>${d.role}</strong>.</p><p>Candidate: <strong>${d.candidateName}</strong></p><p>This is a strong match — we recommend reviewing their profile promptly.</p>`,
        "View candidate", `${base}/hr-dashboard`) };

    case "HR_JOB_EXPIRING":
      return { subject: `Your job post "${d.role}" expires soon`, html: layout("Job Post Expiring ⏰",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your job posting for <strong>${d.role}</strong> is expiring on <strong>${d.deadline}</strong>.</p><p>You've received <strong>${d.applications}</strong> applications so far. You can extend the deadline or close the position.</p>`,
        "Manage job post", `${base}/hr-dashboard`) };

    case "HR_ACCOUNT_CREATED":
      return { subject: "Your HR account has been created", html: layout("Welcome to AstraaHire! 🎉",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your HR account at <strong>${d.company}</strong> has been created by your company admin.</p><p>You can now log in, post jobs, search candidates, and manage applications.</p><p>Your temporary password has been shared with you. Please change it on first login.</p>`,
        "Login now", `${base}/auth/login?role=HR`) };

    case "HR_PASSWORD_RESET":
      return { subject: "Your password has been reset", html: layout("Password Reset 🔐",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your AstraaHire password has been reset by your company admin. You'll receive the new temporary password from them.</p><p>Please change it after logging in.</p>`,
        "Login", `${base}/auth/login?role=HR`) };

    // ═══ COMPANY TEMPLATES ═══
    case "COMPANY_HR_ADDED":
      return { subject: `New HR added: ${d.hrName}`, html: layout("HR Account Created 👥",
        `<p>Hi <strong>${d.name}</strong>,</p><p>A new HR account has been created under <strong>${d.company}</strong>:</p><p>Name: <strong>${d.hrName}</strong><br>Email: ${d.hrEmail}</p><p>They can now log in and start managing job posts.</p>`,
        "View HR team", `${base}/company-dashboard`) };

    case "COMPANY_HR_REMOVED":
      return { subject: `HR removed: ${d.hrName}`, html: layout("HR Account Removed",
        `<p>Hi <strong>${d.name}</strong>,</p><p>The HR account for <strong>${d.hrName}</strong> (${d.hrEmail}) has been removed from <strong>${d.company}</strong>.</p><p>Their job posts and data have been deleted.</p>`) };

    case "COMPANY_JOB_POSTED":
      return { subject: `New job posted: ${d.role}`, html: layout("New Job Posted by HR 💼",
        `<p>Hi <strong>${d.name}</strong>,</p><p>An HR from your team has posted a new job:</p><p><strong>${d.role}</strong><br>Location: ${d.location} · ${d.workMode}<br>Posted by: ${d.hrName}</p>`,
        "View job post", `${base}/company-dashboard`) };

    case "COMPANY_VERIFIED":
      return { subject: "Your company has been verified!", html: layout("Company Verified ✅",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Great news! <strong>${d.company}</strong> has been verified on AstraaHire.</p><p>You can now add HR accounts, post jobs, create hackathons, and access pre-assessed candidates.</p>`,
        "Go to dashboard", `${base}/company-dashboard`) };

    case "COMPANY_NEW_APPLICATION":
      return { subject: `New application at ${d.company}: ${d.role}`, html: layout("New Application 📩",
        `<p>Hi <strong>${d.name}</strong>,</p><p>A candidate has applied for <strong>${d.role}</strong> at <strong>${d.company}</strong>.</p><p>Total applications for this role: <strong>${d.totalApps}</strong></p>`,
        "View applications", `${base}/company-dashboard`) };

    // ═══ MENTOR TEMPLATES ═══
    case "MENTOR_VERIFIED":
      return { subject: "You're a verified mentor! ✅", html: layout("Mentor Verified! 🎉",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Congratulations! Your mentor profile on AstraaHire has been <strong>verified</strong>.</p><p>You can now:</p><ul><li>Create events (auto-approved)</li><li>Appear in mentor search results</li><li>Start booking mentorship sessions</li></ul><p>Your verified badge is now visible on your profile.</p>`,
        "View your profile", `${base}/mentor/${d.mentorNumber}`) };

    case "MENTOR_REJECTED":
      return { subject: "Mentor verification update", html: layout("Verification Update",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Unfortunately, your mentor profile could not be verified at this time.</p>${d.reason ? `<p>Reason: <em>${d.reason}</em></p>` : ""}<p>Please ensure your official email and experience details are accurate, then contact us to re-apply.</p>`,
        "Contact support", `${base}/forms/contact`) };

    case "MENTOR_SUSPENDED":
      return { subject: "Mentor account suspended", html: layout("Account Suspended ⚠️",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your mentor account on AstraaHire has been suspended. Your profile and events are no longer visible to students.</p><p>If you believe this is an error, please contact our support team.</p>`,
        "Contact support", `${base}/forms/contact`) };

    case "MENTOR_EVENT_APPROVED":
      return { subject: `Event approved: ${d.eventTitle}`, html: layout("Event Approved! 🎤",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your event <strong>${d.eventTitle}</strong> has been approved and is now live on AstraaHire!</p><p>Students can now register for it. Share the link to get more participants.</p>`,
        "View your event", `${base}/events/${d.eventId}`) };

    case "MENTOR_EVENT_REJECTED":
      return { subject: `Event not approved: ${d.eventTitle}`, html: layout("Event Not Approved",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your event <strong>${d.eventTitle}</strong> was not approved.</p>${d.reason ? `<p>Reason: <em>${d.reason}</em></p>` : ""}<p>You can edit and resubmit it or contact support.</p>`) };

    case "MENTOR_EVENT_REGISTRATION":
      return { subject: `New registration: ${d.eventTitle}`, html: layout("New Event Registration 🎟️",
        `<p>Hi <strong>${d.name}</strong>,</p><p><strong>${d.participantName}</strong> has registered for your event <strong>${d.eventTitle}</strong>.</p><p>Total registrations: <strong>${d.totalRegistrations}</strong> / ${d.maxParticipants}</p>`,
        "View registrations", `${base}/events/${d.eventId}`) };

    case "MENTOR_ACCOUNT_CREATED":
      return { subject: "Your mentor account is ready!", html: layout("Welcome, Mentor! 🧑‍🏫",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your mentor account on AstraaHire has been created by the admin team. You're already <strong>verified</strong>!</p><p>Log in with the temporary password shared with you and set a new one.</p>`,
        "Login now", `${base}/auth/login`) };

    default:
      return { subject: d.title as string || "Notification from AstraaHire", html: layout(d.title as string || "Notification",
        `<p>${d.message || ""}</p>`) };
  }
}
