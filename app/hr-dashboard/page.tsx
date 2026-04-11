"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HROverview from "@/components/hr-dashboard/HROverview";
import ReceivedApplications from "@/components/hr-dashboard/ReceivedApplications";
import CreateJobOpening from "@/components/hr-dashboard/CreateJobOpening";
import SearchCandidates from "@/components/hr-dashboard/SearchCandidates";
import InviteCandidates from "@/components/hr-dashboard/InviteCandidates";
import CreateHackathon from "@/components/hr-dashboard/CreateHackathon";
import Leaderboard from "@/components/hr-dashboard/Leaderboard";
import MyJobPosts from "@/components/hr-dashboard/MyJobPosts";

const syne = "font-[family-name:var(--font-syne)]";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "applications", label: "Applications", icon: "📩" },
  { id: "create-job", label: "Create Job", icon: "➕" },
  { id: "my-posts", label: "My Job Posts", icon: "📝" },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "invite", label: "Invite", icon: "✉️" },
  { id: "hackathon", label: "Hackathon", icon: "🏆" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏅" },
];

export default function HRDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const userRole = (session?.user as { role?: string })?.role;
  const companyName = (session?.user as { organisation?: string })?.organisation || session?.user?.name || "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?role=HR");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  function renderTab() {
    switch (activeTab) {
      case "overview": return <HROverview onNavigate={setActiveTab} />;
      case "applications": return <ReceivedApplications />;
      case "create-job": return <CreateJobOpening companyName={companyName} />;
      case "my-posts": return <MyJobPosts onNavigate={setActiveTab} />;
      case "search": return <SearchCandidates />;
      case "invite": return <InviteCandidates />;
      case "hackathon": return <CreateHackathon />;
      case "leaderboard": return <Leaderboard />;
      default: return <HROverview onNavigate={setActiveTab} />;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-16 h-[calc(100vh-4rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3">
          <div className={`${syne} font-bold text-sm`} style={{ color: "var(--ink)" }}>HR Dashboard</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{companyName}</div>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors"
              style={{
                background: activeTab === item.id ? "var(--ink)" : "transparent",
                color: activeTab === item.id ? "var(--accent)" : "var(--muted)",
                fontWeight: activeTab === item.id ? 700 : 400,
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span className={syne}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className={`${syne} font-bold text-xs truncate`}>{session?.user?.name}</div>
          <div className="text-[0.65rem]" style={{ color: "var(--muted)" }}>{userRole} · {companyName}</div>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[0.6rem] transition-colors ${syne}`}
            style={{
              background: activeTab === item.id ? "var(--ink)" : "transparent",
              color: activeTab === item.id ? "var(--accent)" : "var(--muted)",
            }}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 md:px-8 py-8 pb-24 lg:pb-8 max-w-5xl">
        {renderTab()}
      </div>
    </div>
  );
}
