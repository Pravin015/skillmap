"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminOverview from "@/components/admin-dashboard/AdminOverview";
import UserManagement from "@/components/admin-dashboard/UserManagement";
import CompaniesTab from "@/components/admin-dashboard/CompaniesTab";
import MentorsTab from "@/components/admin-dashboard/MentorsTab";
import StudentsTab from "@/components/admin-dashboard/StudentsTab";
import HRsTab from "@/components/admin-dashboard/HRsTab";
import JobPostsTab from "@/components/admin-dashboard/JobPostsTab";
import FormsTab from "@/components/admin-dashboard/FormsTab";
import PlatformSettings from "@/components/admin-dashboard/PlatformSettings";
import InstitutionsTab from "@/components/admin-dashboard/InstitutionsTab";
import EventsTab from "@/components/admin-dashboard/EventsTab";

const syne = "font-[family-name:var(--font-syne)]";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "Users", icon: "👤" },
  { id: "companies", label: "Companies", icon: "🏢" },
  { id: "hrs", label: "HRs", icon: "👥" },
  { id: "mentors", label: "Mentors", icon: "🧑‍🏫" },
  { id: "students", label: "Students", icon: "🎓" },
  { id: "institutions", label: "Institutions", icon: "🏫" },
  { id: "jobs", label: "Job Posts", icon: "💼" },
  { id: "events", label: "Events", icon: "🎤" },
  { id: "forms", label: "Forms", icon: "📋" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

interface User { id: string; name: string; email: string; role: string; organisation: string | null; createdAt: string }
interface Stats { total: number; students: number; hr: number; org: number; admin: number }

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, students: 0, hr: 0, org: 0, admin: 0 });
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as { role?: string })?.role;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || { total: 0, students: 0, hr: 0, org: 0, admin: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && userRole !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") fetchUsers();
  }, [status, userRole, router, fetchUsers]);

  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;
  }

  function renderTab() {
    switch (activeTab) {
      case "overview": return <AdminOverview stats={stats} onNavigate={setActiveTab} />;
      case "users": return <UserManagement users={users} onRefresh={fetchUsers} />;
      case "companies": return <CompaniesTab />;
      case "hrs": return <HRsTab users={users} />;
      case "mentors": return <MentorsTab />;
      case "students": return <StudentsTab users={users} />;
      case "institutions": return <InstitutionsTab users={users} />;
      case "jobs": return <JobPostsTab />;
      case "events": return <EventsTab />;
      case "forms": return <FormsTab />;
      case "settings": return <PlatformSettings />;
      default: return <AdminOverview stats={stats} onNavigate={setActiveTab} />;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-16 h-[calc(100vh-4rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3">
          <div className={`${syne} font-bold text-sm`} style={{ color: "#ef4444" }}>Admin Panel</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>SkillMap Platform</div>
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
          <div className="text-[0.65rem]" style={{ color: "#ef4444" }}>Super Admin</div>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[0.55rem] transition-colors ${syne}`}
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
