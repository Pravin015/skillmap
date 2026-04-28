"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CompanyOverview from "@/components/company-dashboard/CompanyOverview";
import ManageHR from "@/components/company-dashboard/ManageHR";
import HRTracker from "@/components/company-dashboard/HRTracker";
import HiringAnalytics from "@/components/company-dashboard/HiringAnalytics";
import CompanySettings from "@/components/company-dashboard/CompanySettings";
import CompanyProfileEditor from "@/components/company-dashboard/CompanyProfileEditor";

const heading = "font-[family-name:var(--font-heading)]";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "manage-hr", label: "Manage HR", icon: "👥" },
  { id: "hr-tracker", label: "HR Tracker", icon: "📈" },
  { id: "profile", label: "Company Profile", icon: "🏢" },
  { id: "analytics", label: "Analytics", icon: "📉" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

interface HR {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export default function CompanyDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [hrs, setHrs] = useState<HR[]>([]);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as { role?: string })?.role;

  const fetchHrs = useCallback(async () => {
    try {
      const res = await fetch("/api/company/hr");
      const data = await res.json();
      if (res.ok) {
        setHrs(data.hrs);
        setOrgName(data.organisation);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login?role=ORG"); return; }
    if (status === "authenticated" && userRole !== "ORG" && userRole !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") fetchHrs();
  }, [status, userRole, router, fetchHrs]);

  if (status === "loading" || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  }

  function renderTab() {
    switch (activeTab) {
      case "overview": return <CompanyOverview orgName={orgName} hrCount={hrs.length} onNavigate={setActiveTab} />;
      case "manage-hr": return <ManageHR hrs={hrs} onRefresh={fetchHrs} />;
      case "hr-tracker": return <HRTracker hrs={hrs} />;
      case "profile": return <CompanyProfileEditor />;
      case "analytics": return <HiringAnalytics hrCount={hrs.length} />;
      case "settings": return <CompanySettings orgName={orgName} />;
      default: return <CompanyOverview orgName={orgName} hrCount={hrs.length} onNavigate={setActiveTab} />;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-24 h-[calc(100vh-6rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3">
          <div className={`${heading} font-bold text-sm`} style={{ color: "var(--ink)" }}>Company Dashboard</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{orgName}</div>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors"
              style={{
                background: activeTab === item.id ? "var(--primary-light)" : "transparent",
                color: activeTab === item.id ? "var(--primary)" : "var(--muted)",
                fontWeight: activeTab === item.id ? 700 : 400,
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span className={heading}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className={`${heading} font-bold text-xs truncate`}>{session?.user?.name}</div>
          <div className="text-[0.65rem]" style={{ color: "var(--muted)" }}>Organisation Admin</div>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[0.6rem] transition-colors ${heading}`}
            style={{
              background: activeTab === item.id ? "var(--primary-light)" : "transparent",
              color: activeTab === item.id ? "var(--primary)" : "var(--muted)",
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
