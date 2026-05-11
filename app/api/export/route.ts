import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCSV } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // ═══ ADMIN EXPORTS ═══
  if (userRole === "ADMIN") {
    if (type === "users") {
      const users = await prisma.user.findMany({
        select: { name: true, email: true, role: true, organisation: true, phone: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCSV(users.map((u) => ({ Name: u.name, Email: u.email, Role: u.role, Organisation: u.organisation || "", Phone: u.phone || "", Joined: u.createdAt.toISOString().split("T")[0] })));
      return csvResponse(csv, "astraahire-users");
    }

    if (type === "jobs") {
      const jobs = await prisma.jobPosting.findMany({
        include: { postedBy: { select: { name: true } }, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCSV(jobs.map((j) => ({ Title: j.title, Company: j.company, Location: j.location, WorkMode: j.workMode, Experience: j.experienceLevel, JobType: j.jobType, Domain: j.domain || "", Status: j.status, Applications: j._count.applications, PostedBy: j.postedBy.name, Created: j.createdAt.toISOString().split("T")[0] })));
      return csvResponse(csv, "astraahire-jobs");
    }

    if (type === "applications") {
      const apps = await prisma.application.findMany({
        include: { user: { select: { name: true, email: true } }, job: { select: { title: true, company: true } } },
        orderBy: { appliedAt: "desc" },
      });
      const csv = toCSV(apps.map((a) => ({ Candidate: a.user.name, Email: a.user.email, Job: a.job.title, Company: a.job.company, Status: a.status, SkillMatch: `${a.scoreMatch}%`, Applied: a.appliedAt.toISOString().split("T")[0] })));
      return csvResponse(csv, "astraahire-applications");
    }

    if (type === "mentors") {
      const mentors = await prisma.mentorProfile.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCSV(mentors.map((m) => ({ Name: m.user.name, Email: m.user.email, Company: m.currentCompany || "", Role: m.currentRole || "", Experience: `${m.yearsOfExperience} yrs`, Status: m.status, Rating: m.rating, Sessions: m.totalSessions, Mentees: m.menteesHelped, Compensation: m.compensation, MentorID: m.mentorNumber })));
      return csvResponse(csv, "astraahire-mentors");
    }

    if (type === "events") {
      const events = await prisma.event.findMany({
        include: { createdBy: { select: { name: true } }, _count: { select: { registrations: true } } },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCSV(events.map((e) => ({ Title: e.title, Date: e.date.toISOString().split("T")[0], Type: e.eventType, Pricing: e.pricing, Price: e.price ? `₹${e.price / 100}` : "Free", Status: e.status, Registrations: e._count.registrations, MaxCapacity: e.maxParticipants, CreatedBy: e.createdBy.name })));
      return csvResponse(csv, "astraahire-events");
    }

    if (type === "forms") {
      const forms = await prisma.formSubmission.findMany({ orderBy: { createdAt: "desc" } });
      const csv = toCSV(forms.map((f) => ({ Type: f.type, Name: f.name, Email: f.email, Phone: f.phone || "", Status: f.status, Submitted: f.createdAt.toISOString().split("T")[0] })));
      return csvResponse(csv, "astraahire-form-submissions");
    }
  }

  // ═══ HR EXPORTS ═══
  if (userRole === "HR" || userRole === "ORG") {
    if (type === "my-applications") {
      const where = userRole === "HR" ? { job: { postedById: userId } } : {};
      const apps = await prisma.application.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true, profile: { select: { collegeName: true, fieldOfInterest: true, skills: true, profileScore: true } } } },
          job: { select: { title: true, company: true } },
        },
        orderBy: { appliedAt: "desc" },
      });
      const csv = toCSV(apps.map((a) => ({
        Candidate: a.user.name, Email: a.user.email, Phone: a.user.phone || "",
        Job: a.job.title, Company: a.job.company, Status: a.status,
        SkillMatch: `${a.scoreMatch}%`, ProfileScore: a.user.profile?.profileScore || 0,
        College: a.user.profile?.collegeName || "", Domain: a.user.profile?.fieldOfInterest || "",
        Skills: (a.user.profile?.skills || []).join("; "), Applied: a.appliedAt.toISOString().split("T")[0],
      })));
      return csvResponse(csv, "applications-export");
    }

    if (type === "my-jobs") {
      const where = userRole === "HR" ? { postedById: userId } : {};
      const jobs = await prisma.jobPosting.findMany({
        where,
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCSV(jobs.map((j) => ({ Title: j.title, Company: j.company, Location: j.location, WorkMode: j.workMode, Experience: j.experienceLevel, Type: j.jobType, Status: j.status, Applications: j._count.applications, Created: j.createdAt.toISOString().split("T")[0] })));
      return csvResponse(csv, "jobs-export");
    }

    if (type === "candidates") {
      const profiles = await prisma.studentProfile.findMany({
        include: { user: { select: { name: true, email: true, degree: true, gradYear: true } } },
        orderBy: { profileScore: "desc" },
        take: 200,
      });
      const csv = toCSV(profiles.map((p) => ({
        Name: p.user.name, Email: p.user.email, College: p.collegeName || "", Degree: p.user.degree || "",
        GradYear: p.user.gradYear || "", Domain: p.fieldOfInterest || "", Level: p.experienceLevel,
        Skills: p.skills.join("; "), ProfileScore: p.profileScore, Available: p.availableToJoin ? "Yes" : "No",
        ProfileID: p.profileNumber,
      })));
      return csvResponse(csv, "candidates-export");
    }
  }

  return NextResponse.json({ error: "Invalid export type or insufficient permissions" }, { status: 400 });
}

function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
