"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getMatchingJobs, getSimilarJobs } from "@/lib/data";
import { UserProfile, Job } from "@/lib/types";
import AIMentorCard from "@/components/dashboard/AIMentorCard";
import RealMentorCard from "@/components/dashboard/RealMentorCard";
import OpeningsSection from "@/components/dashboard/OpeningsSection";
import ApplicationsCard from "@/components/dashboard/ApplicationsCard";
import HRInterestCard from "@/components/dashboard/HRInterestCard";
import ResumeCard from "@/components/dashboard/ResumeCard";
import ProfileScoreCard from "@/components/dashboard/ProfileScoreCard";
import CoursesCard from "@/components/dashboard/CoursesCard";
import LabsPrepCard from "@/components/dashboard/LabsPrepCard";
import MyMentorshipCard from "@/components/dashboard/MyMentorshipCard";
import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

const sidebarItems = [
  { id: "mentor", label: "AI Mentor", icon: "✦" },
  { id: "openings", label: "Openings", icon: "💼" },
  { id: "applied", label: "Applied", icon: "📋" },
  { id: "hr", label: "HR Interest", icon: "👥" },
  { id: "resume", label: "Resume", icon: "📄" },
  { id: "score", label: "Score", icon: "📊" },
  { id: "mentorship", label: "Mentorship", icon: "🧑‍🏫" },
  { id: "events", label: "Events", icon: "🎤" },
  { id: "courses", label: "Courses", icon: "📚" },
  { id: "labs", label: "Labs", icon: "🧪" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeSection, setActiveSection] = useState("mentor");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Load profile from localStorage or create from session
    const stored = localStorage.getItem("astraahire_profile");
    if (stored) {
      const p: UserProfile = JSON.parse(stored);
      setProfile(p);
      const matched = getMatchingJobs(p.companies, p.domainKey);
      setJobs(matched.length > 0 ? matched : getSimilarJobs(p.companies, p.domainKey));
    } else if (session?.user) {
      // Create a basic profile from session data
      const p: UserProfile = {
        name: session.user.name || "Student",
        degree: "",
        graduationYear: "",
        domain: "Cybersecurity",
        domainKey: "cybersecurity",
        companies: ["tcs", "kpmg", "deloitte"],
      };
      setProfile(p);
      const matched = getMatchingJobs(p.companies, p.domainKey);
      setJobs(matched.length > 0 ? matched : getSimilarJobs(p.companies, p.domainKey));
    }
  }, [status, session, router]);

  function scrollToSection(id: string) {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (status === "loading" || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-16 h-[calc(100vh-4rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3">
          <div className={`${heading} font-bold text-sm`} style={{ color: "var(--muted)" }}>Dashboard</div>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                activeSection === item.id ? "font-bold" : ""
              }`}
              style={{
                background: activeSection === item.id ? "var(--ink)" : "transparent",
                color: activeSection === item.id ? "var(--primary)" : "var(--muted)",
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span className={heading}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className={`${heading} font-bold text-xs truncate`}>{profile.name}</div>
          <div className="text-[0.65rem]" style={{ color: "var(--muted)" }}>{profile.domain}</div>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[0.6rem] transition-colors ${heading}`}
            style={{
              background: activeSection === item.id ? "var(--ink)" : "transparent",
              color: activeSection === item.id ? "var(--primary)" : "var(--muted)",
            }}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 md:px-8 py-8 pb-24 lg:pb-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${heading} font-bold text-2xl md:text-3xl`}>
            {greeting()}, <span style={{ color: "var(--primary)", background: "var(--ink)", padding: "0 6px", borderRadius: "6px" }}>{profile.name.split(" ")[0]}</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
            Here&apos;s your career progress · {profile.domain} · {profile.companies.length} dream companies
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Row 1: AI Mentor + Profile Score */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="section-mentor">
              <AIMentorCard />
            </div>
            <div id="section-score">
              <ProfileScoreCard />
            </div>
          </div>

          {/* Real Mentors */}
          <div id="section-real-mentor">
            <RealMentorCard />
          </div>

          {/* Current Openings */}
          <div id="section-openings">
            <OpeningsSection jobs={jobs} />
          </div>

          {/* Row: Applications + HR Interest */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="section-applied">
              <ApplicationsCard />
            </div>
            <div id="section-hr">
              <HRInterestCard />
            </div>
          </div>

          {/* Resume */}
          <div id="section-resume">
            <ResumeCard />
          </div>

          {/* Events */}
          {/* Mentorship */}
          <div id="section-mentorship">
            <MyMentorshipCard />
          </div>

          <div id="section-events">
            <EventsWidget />
          </div>

          {/* Courses */}
          <div id="section-courses">
            <CoursesCard domainKey={profile.domainKey} />
          </div>

          {/* Labs */}
          <div id="section-labs">
            <LabsPrepCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsWidget() {
  const s = "font-[family-name:var(--font-heading)]";
  const [events, setEvents] = useState<{ id: string; title: string; date: string; pricing: string; price: number | null; createdBy: { name: string }; _count: { registrations: number } }[]>([]);
  useEffect(() => { fetch("/api/events").then((r) => r.json()).then((d) => setEvents((d.events || []).filter((e: { date: string }) => new Date(e.date) >= new Date()).slice(0, 3))).catch(() => {}); }, []);

  return (
    <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${s} font-bold text-base`}>Upcoming Events</h3>
        <Link href="/events" className={`text-xs ${s} font-bold no-underline px-2.5 py-1 rounded-lg`} style={{ background: "var(--primary)", color: "white" }}>Browse all</Link>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Career guidance sessions by mentors</p>
      {events.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-3xl mb-3">🎤</div>
          <p className={`${s} font-bold text-sm mb-1`}>No upcoming events</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Events will appear here when mentors schedule them</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 p-3 rounded-xl border no-underline transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
              <div className="flex-1 min-w-0">
                <div className={`${s} font-bold text-sm`}>{e.title}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>by {e.createdBy.name} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {e._count.registrations} joined</div>
              </div>
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${e.pricing === "FREE" ? "bg-green-100 text-green-700" : "bg-[#E0F7F7] text-[#0ABFBC]"}`}>{e.pricing === "FREE" ? "Free" : `₹${(e.price || 0) / 100}`}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
