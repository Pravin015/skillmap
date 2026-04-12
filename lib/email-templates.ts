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
    <p>SkillMap · India's job-readiness engine</p>
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
      return { subject: "Welcome to SkillMap!", html: layout("Welcome to SkillMap! 🎉",
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
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your SkillMap profile is only <strong>${d.score}% complete</strong>. A complete profile gets <strong>3x more views</strong> from recruiters.</p><p>Here's what's missing:</p><ul>${d.missing}</ul>`,
        "Complete now", `${base}/profile/edit`) };

    case "ADD_RESUME":
      return { subject: "Add your resume to increase visibility", html: layout("Upload Your Resume 📄",
        `<p>Hi <strong>${d.name}</strong>,</p><p>You haven't uploaded your resume yet. Candidates with resumes get <strong>2x more interview calls</strong>.</p>`,
        "Upload resume", `${base}/profile/edit`) };

    case "PASSWORD_CHANGED":
      return { subject: "Your password was changed", html: layout("Password Changed 🔐",
        `<p>Hi <strong>${d.name}</strong>,</p><p>Your SkillMap password was successfully changed. If you didn't make this change, please contact us immediately at <a href="mailto:support@ashpranix.in">support@ashpranix.in</a>.</p>`) };

    case "INVITE_RECEIVED":
      return { subject: `${d.company} invited you to apply!`, html: layout("You've Been Invited! ✉️",
        `<p>Hi <strong>${d.name}</strong>,</p><p><strong>${d.company}</strong> has invited you to apply for a position. This means they've seen your profile and are interested!</p>`,
        "View invitation", `${base}/dashboard`) };

    case "JOB_CLOSING_SOON":
      return { subject: `Last chance: ${d.role} at ${d.company}`, html: layout("Job Closing Soon ⏰",
        `<p>Hi <strong>${d.name}</strong>,</p><p>The <strong>${d.role}</strong> position at <strong>${d.company}</strong> is closing soon. Don't miss out!</p><p>Deadline: <strong>${d.deadline}</strong></p>`,
        "Apply now", `${base}/jobs/${d.jobId}`) };

    default:
      return { subject: d.title as string || "Notification from SkillMap", html: layout(d.title as string || "Notification",
        `<p>${d.message || ""}</p>`) };
  }
}
