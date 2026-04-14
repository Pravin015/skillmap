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

const heading = "font-[family-name:var(--font-heading)]";
const tabs = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "students", label: "Students", icon: "🎓" },
  { id: "add-student", label: "Add Student", icon: "➕" },
  { id: "companies", label: "Companies", icon: "🏢" },
  { id: "courses", label: "Courses", icon: "📚" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function InstitutionCourses() {
  const [courses, setCourses] = useState<{id:string;slug:string;title:string;status:string;_count:{modules:number;enrollments:number}}[]>([]);
  const [ld, setLd] = useState(true);
  useEffect(() => { fetch("/api/courses?mine=true").then(r=>r.json()).then(d=>{setCourses(d.courses||[]);setLd(false);}).catch(()=>setLd(false)); }, []);
  if (ld) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;
  if (courses.length === 0) return <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}><div className="text-3xl mb-2">📚</div><p className="text-sm" style={{ color: "var(--muted)" }}>No courses yet. Create your first one!</p></div>;
  return <div className="space-y-2">{courses.map(c=><div key={c.id} className="rounded-xl border bg-white p-4 flex items-center gap-3" style={{borderColor:"var(--border)"}}><div className="flex-1"><div className={`${heading} text-sm font-bold`} style={{color:"var(--ink)"}}>{c.title}</div><div className="text-[10px]" style={{color:"var(--muted)"}}>{c.status} · {c._count.modules} modules · {c._count.enrollments} enrolled</div></div><a href={`/courses/${c.slug}`} target="_blank" className="text-[10px] px-2 py-1 rounded-lg border no-underline" style={{borderColor:"var(--border)",color:"var(--muted)"}}>View ↗</a></div>)}</div>;
}

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

  if (status === "loading" || loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  function renderTab() {
    switch (activeTab) {
      case "overview": return <InstitutionOverview studentCount={students.length} orgName={orgName} onNavigate={setActiveTab} />;
      case "students": return <MyStudents students={students} onRefresh={fetchStudents} onNavigate={setActiveTab} />;
      case "add-student": return <AddStudent onRefresh={fetchStudents} />;
      case "companies": return <SearchCompanies />;
      case "courses": return <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className={`${heading} font-bold text-xl`}>Your Courses</h2><p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Create and manage courses for your students</p></div><a href="/courses/create" className="btn-primary no-underline text-xs" style={{ padding: "0.5rem 1rem" }}>+ Create Course</a></div><InstitutionCourses /></div>;
      case "analytics": return <InstitutionAnalytics studentCount={students.length} />;
      case "settings": return <InstitutionSettings orgName={orgName} />;
      default: return <InstitutionOverview studentCount={students.length} orgName={orgName} onNavigate={setActiveTab} />;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r sticky top-16 h-[calc(100vh-4rem)] py-6 px-3" style={{ borderColor: "var(--border)", background: "white" }}>
        <div className="mb-6 px-3"><div className={`${heading} font-bold text-sm`} style={{ color: "var(--ink)" }}>Institution</div><div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{orgName}</div></div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors" style={{ background: activeTab === t.id ? "var(--ink)" : "transparent", color: activeTab === t.id ? "var(--primary)" : "var(--muted)", fontWeight: activeTab === t.id ? 700 : 400 }}>
              <span className="text-base">{t.icon}</span><span className={heading}>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}><div className={`${heading} font-bold text-xs truncate`}>{session?.user?.name}</div><div className="text-[0.65rem]" style={{ color: "var(--muted)" }}>Institution Admin</div></div>
      </aside>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t flex gap-0.5 px-2 py-2" style={{ background: "white", borderColor: "var(--border)" }}>
        {tabs.map((t) => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[0.6rem] ${heading}`} style={{ background: activeTab === t.id ? "var(--ink)" : "transparent", color: activeTab === t.id ? "var(--primary)" : "var(--muted)" }}><span className="text-sm">{t.icon}</span>{t.label}</button>))}
      </div>
      <div className="flex-1 px-4 md:px-8 py-8 pb-24 lg:pb-8 max-w-5xl">{renderTab()}</div>
    </div>
  );
}
