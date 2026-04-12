"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import InstitutionOverview from "@/components/institution-dashboard/InstitutionOverview";
import MyStudents from "@/components/institution-dashboard/MyStudents";
import AddStudent from "@/components/institution-dashboard/AddStudent";
import SearchCompanies from "@/components/institution-dashboard/SearchCompanies";
import InstitutionAnalytics from "@/components/institution-dashboard/InstitutionAnalytics";
import InstitutionSettings from "@/components/institution-dashboard/InstitutionSettings";

const syne = "font-[family-name:var(--font-syne)]";
const tabs = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "students", label: "Students", icon: "🎓" },
  { id: "add-student", label: "Add Student", icon: "➕" },
  { id: "companies", label: "Companies", icon: "🏢" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function InstitutionDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [students, setStudents] = useState<never[]>([]);
  const [loading, setLoading] = useState(true);
  const userRole = (session?.user as { role?: string })?.role;
  const orgName = (session?.user as { name?: string })?.name || "Institution";

  const fetchStudents = useCallback(async () => {
    try { const res = await fetch("/api/institution/students"); const data = await res.json(); setStudents(data.students || []); } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && userRole !== "INSTITUTION" && userRole !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") fetchStudents();
  }, [status, userRole, router, fetchStudents]);

  if (status === "loading" || loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} /></div>;

  function renderTab() {
    switch (activeTab) {
      case "overview": return <InstitutionOverview studentCount={students.length} orgName={orgName} onNavigate={setActiveTab} />;
      case "students": return <MyStudents students={students} onRefresh={fetchStudents} onNavigate={setActiveTab} />;
      case "add-student": return <AddStudent onRefresh={fetchStudents} />;
      case "companies": return <SearchCompanies />;
      case "analytics": return <InstitutionAnalytics studentCount={students.length} />;
      case "settings": return <InstitutionSettings orgName={orgName} />;
      default: return <InstitutionOverview studentCount={students.length} orgName={orgName} onNavigate={setActiveTab} />;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-16 h-[calc(100vh-4rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3"><div className={`${syne} font-bold text-sm`} style={{ color: "var(--ink)" }}>Institution</div><div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{orgName}</div></div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors" style={{ background: activeTab === t.id ? "var(--ink)" : "transparent", color: activeTab === t.id ? "var(--accent)" : "var(--muted)", fontWeight: activeTab === t.id ? 700 : 400 }}>
              <span className="text-base">{t.icon}</span><span className={syne}>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}><div className={`${syne} font-bold text-xs truncate`}>{session?.user?.name}</div><div className="text-[0.65rem]" style={{ color: "var(--muted)" }}>Institution Admin</div></div>
      </aside>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {tabs.map((t) => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[0.6rem] ${syne}`} style={{ background: activeTab === t.id ? "var(--ink)" : "transparent", color: activeTab === t.id ? "var(--accent)" : "var(--muted)" }}><span className="text-sm">{t.icon}</span>{t.label}</button>))}
      </div>
      <div className="flex-1 px-4 md:px-8 py-8 pb-24 lg:pb-8 max-w-5xl">{renderTab()}</div>
    </div>
  );
}
