"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";

const syne = "font-[family-name:var(--font-syne)]";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Blog" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/chat", label: "AI Advisor" },
  { href: "/mock-interview", label: "Mock Interview" },
];

const roleBadgeColors: Record<string, string> = {
  STUDENT: "bg-indigo-100 text-indigo-700",
  MENTOR: "bg-amber-100 text-amber-700",
  HR: "bg-cyan-100 text-cyan-700",
  ORG: "bg-emerald-100 text-emerald-700",
  INSTITUTION: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile/image").then((r) => r.json()).then((d) => { if (d.image) setProfileImg(d.image); }).catch(() => {});
    }
  }, [session]);

  const userRole = (session?.user as { role?: string })?.role;

  const roleLinks = [
    ...(userRole === "MENTOR" || userRole === "ADMIN" ? [{ href: "/mentor-dashboard", label: "Mentor Panel" }] : []),
    ...(userRole === "INSTITUTION" || userRole === "ADMIN" ? [{ href: "/institution-dashboard", label: "Institution" }] : []),
    ...(userRole === "ORG" || userRole === "ADMIN" ? [{ href: "/company-dashboard", label: "Company" }] : []),
    ...(userRole === "HR" || userRole === "ADMIN" ? [{ href: "/hr-dashboard", label: "HR Panel" }] : []),
    ...(userRole === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const allNavLinks = [...navItems, ...roleLinks];

  return (
    <header className="sticky top-0 z-50 border-b" style={{ borderColor: "var(--border)", background: "rgba(244,243,239,0.85)", backdropFilter: "blur(20px)" }}>
      <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className={`flex items-center gap-2 no-underline ${syne}`}>
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg text-xs md:text-sm font-bold text-white" style={{ background: "var(--ink)" }}>
            <span style={{ color: "var(--accent)" }}>S</span>
          </div>
          <span className="text-base md:text-lg font-extrabold" style={{ color: "var(--ink)" }}>Skill<span style={{ color: "var(--accent)", background: "var(--ink)", padding: "0 4px", borderRadius: "4px" }}>Map</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {allNavLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors no-underline ${syne} ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? ""
                  : ""
              }`}
              style={{
                background: pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "var(--ink)" : "transparent",
                color: pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "var(--accent)" : "var(--muted)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session?.user && <NotificationBell />}
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[rgba(10,10,15,0.04)]"
              >
                {profileImg ? (
                  <img src={profileImg} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${syne}`} style={{ background: "var(--ink)" }}>
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className={`text-sm font-bold ${syne}`} style={{ color: "var(--ink)" }}>{session.user.name}</p>
                  <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeColors[userRole || ""]}`}>{userRole}</span>
                </div>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border bg-white py-1 shadow-lg" style={{ borderColor: "var(--border)" }}>
                    <div className="border-b px-4 py-2 sm:hidden" style={{ borderColor: "var(--border)" }}>
                      <p className={`text-sm font-bold ${syne}`}>{session.user.name}</p>
                      <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeColors[userRole || ""]}`}>{userRole}</span>
                    </div>
                    <Link href="/profile/edit" className={`block px-4 py-2 text-sm no-underline transition-colors hover:bg-gray-50`} style={{ color: "var(--ink)" }} onClick={() => setShowMenu(false)}>My Profile</Link>
                    <Link href="/settings" className={`block px-4 py-2 text-sm no-underline transition-colors hover:bg-gray-50`} style={{ color: "var(--ink)" }} onClick={() => setShowMenu(false)}>Account Settings</Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm no-underline transition-colors hover:bg-gray-50" style={{ color: "var(--ink)" }} onClick={() => setShowMenu(false)}>
                      Upload Photo
                    </Link>
                    {roleLinks.map((l) => (
                      <Link key={l.href} href={l.href} className="block px-4 py-2 text-sm no-underline sm:hidden transition-colors hover:bg-gray-50" style={{ color: "var(--ink)" }} onClick={() => setShowMenu(false)}>{l.label}</Link>
                    ))}
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Sign out</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className={`rounded-lg px-4 py-2 text-sm font-bold no-underline ${syne}`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Login</Link>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-[rgba(10,10,15,0.04)]" onClick={() => setMobileNav(!mobileNav)}>
            <span className={`block w-5 h-0.5 transition-all ${mobileNav ? "rotate-45 translate-y-1.5" : ""}`} style={{ background: "var(--ink)" }} />
            <span className={`block w-5 h-0.5 transition-all ${mobileNav ? "opacity-0" : ""}`} style={{ background: "var(--ink)" }} />
            <span className={`block w-5 h-0.5 transition-all ${mobileNav ? "-rotate-45 -translate-y-1.5" : ""}`} style={{ background: "var(--ink)" }} />
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNav && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMobileNav(false)} />
          <div className="md:hidden absolute top-full left-0 right-0 z-50 border-t shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <nav className="flex flex-col py-2 px-4">
              {allNavLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNav(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold no-underline ${syne}`}
                  style={{
                    background: pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "var(--ink)" : "transparent",
                    color: pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "var(--accent)" : "var(--ink)",
                  }}
                >
                  {item.label}
                </Link>
              ))}
              {!session && (
                <Link href="/auth/login" onClick={() => setMobileNav(false)} className={`rounded-xl px-4 py-3 text-sm font-bold no-underline mt-2 text-center ${syne}`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Login</Link>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
