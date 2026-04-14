"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "./NotificationBell";

const heading = "font-[family-name:var(--font-heading)]";

interface DropdownItem {
  href: string;
  label: string;
  desc?: string;
}

interface NavGroup {
  label: string;
  items: DropdownItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { href: "/jobs", label: "Jobs", desc: "Browse open positions" },
      { href: "/events", label: "Events", desc: "Workshops & webinars" },
      { href: "/blog", label: "Blog", desc: "Career tips & guides" },
      { href: "/companies", label: "Companies", desc: "Explore employers" },
    ],
  },
  {
    label: "Prepare",
    items: [
      { href: "/chat", label: "AI Advisor", desc: "AI-powered career guidance" },
      { href: "/mock-interview", label: "Mock Interview", desc: "Practice for 15+ companies" },
      { href: "/offer-verify", label: "Verify Offer", desc: "Detect fake offer letters" },
    ],
  },
];

const directLinks = [
  { href: "/competitions", label: "Competitions" },
  { href: "/pricing", label: "Pricing" },
];

const roleBadgeColors: Record<string, string> = {
  STUDENT: "bg-[#E0F7F7] text-[#0ABFBC]",
  MENTOR: "bg-amber-100 text-amber-700",
  HR: "bg-cyan-100 text-cyan-700",
  ORG: "bg-emerald-100 text-emerald-700",
  INSTITUTION: "bg-[#E0F7F7] text-[#0ABFBC]",
  ADMIN: "bg-red-100 text-red-700",
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile/image").then((r) => r.json()).then((d) => { if (d.image) setProfileImg(d.image); }).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 50); }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userRole = (session?.user as { role?: string })?.role;

  const roleLinks = [
    ...(userRole === "STUDENT" || !userRole ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(userRole === "MENTOR" || userRole === "ADMIN" ? [{ href: "/mentor-dashboard", label: "Mentor Panel" }] : []),
    ...(userRole === "INSTITUTION" || userRole === "ADMIN" ? [{ href: "/institution-dashboard", label: "Institution" }] : []),
    ...(userRole === "ORG" || userRole === "ADMIN" ? [{ href: "/company-dashboard", label: "Company" }] : []),
    ...(userRole === "HR" || userRole === "ADMIN" ? [{ href: "/hr-dashboard", label: "HR Panel" }] : []),
    ...(userRole === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  // All links for mobile
  const allMobileLinks = [
    { href: "/", label: "Home" },
    ...navGroups.flatMap((g) => g.items),
    ...directLinks,
    ...(session ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(session ? roleLinks.filter((l) => l.href !== "/dashboard") : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: scrolled ? "rgba(12,26,26,0.95)" : "rgba(12,26,26,0.8)", backdropFilter: "blur(12px)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" ref={dropdownRef}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0" onClick={() => setMobileNav(false)}>
          <svg width="28" height="28" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0ABFBC" fillRule="evenodd" d="M300 100 L495 490 L560 505 L420 530 L300 470 L180 530 L40 505 L105 490 Z M300 220 L205 430 L245 430 L300 335 L355 430 L395 430 Z"/>
          </svg>
          <span className={`${heading} text-lg font-bold text-white`}>
            Astr<span style={{ color: "#0ABFBC" }}>aa</span>Hire
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Dropdown groups */}
          {navGroups.map((group) => (
            <div key={group.label} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === group.label ? null : group.label)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: openDropdown === group.label ? "#0ABFBC" : "rgba(255,255,255,0.85)",
                  background: openDropdown === group.label ? "rgba(10,191,188,0.1)" : "transparent",
                }}
              >
                {group.label}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform 0.2s", transform: openDropdown === group.label ? "rotate(180deg)" : "" }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {openDropdown === group.label && (
                <div className="nav-dropdown" style={{ background: "#0D2020", border: "1px solid rgba(10,191,188,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setOpenDropdown(null)}>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: pathname.startsWith(item.href) ? "#0ABFBC" : "#fff" }}>{item.label}</div>
                        {item.desc && <div className="text-[11px] mt-0.5" style={{ color: "#6B8F8F" }}>{item.desc}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Direct links */}
          {directLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors no-underline"
              style={{
                color: pathname.startsWith(link.href) ? "#0ABFBC" : "rgba(255,255,255,0.85)",
                background: pathname.startsWith(link.href) ? "rgba(10,191,188,0.1)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => { setShowUserMenu(!showUserMenu); setOpenDropdown(null); }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                >
                  {profileImg ? (
                    <img src={profileImg} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {session.user.name?.split(" ")[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="nav-dropdown" style={{ right: 0, left: "auto", minWidth: 220 }}>
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                      <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>{session.user.name}</div>
                      <div className="text-[11px]" style={{ color: "var(--muted)" }}>{session.user.email}</div>
                      {userRole && <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeColors[userRole] || ""}`}>{userRole}</span>}
                    </div>
                    {roleLinks.map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => setShowUserMenu(false)}>
                        {l.label}
                      </Link>
                    ))}
                    <Link href="/profile/edit" onClick={() => setShowUserMenu(false)}>Edit Profile</Link>
                    <Link href="/settings" onClick={() => setShowUserMenu(false)}>Settings</Link>
                    <div className="border-t mt-1 pt-1" style={{ borderColor: "var(--border)" }}>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors hover:bg-red-50"
                        style={{ color: "var(--danger)" }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/login" className="rounded-lg px-4 py-2 text-[13px] font-medium no-underline transition-colors" style={{ color: "rgba(255,255,255,0.7)" }}>
                Log in
              </Link>
              <Link href="/auth/signup" className="btn-primary no-underline" style={{ padding: "8px 20px", fontSize: "13px" }}>
                Sign Up Free
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => { setMobileNav(!mobileNav); setOpenDropdown(null); setShowUserMenu(false); }}
            className="lg:hidden flex flex-col gap-1.5 p-2"
          >
            <span className="block w-5 h-0.5 rounded-full transition-all" style={{ background: "rgba(255,255,255,0.7)", transform: mobileNav ? "rotate(45deg) translateY(4px)" : "" }} />
            <span className="block w-5 h-0.5 rounded-full transition-all" style={{ background: "rgba(255,255,255,0.7)", opacity: mobileNav ? 0 : 1 }} />
            <span className="block w-5 h-0.5 rounded-full transition-all" style={{ background: "rgba(255,255,255,0.7)", transform: mobileNav ? "rotate(-45deg) translateY(-4px)" : "" }} />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileNav && (
        <div className="lg:hidden border-t animate-slide-down" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(12,26,26,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {allMobileLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMobileNav(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors"
                style={{ color: pathname === link.href ? "var(--primary)" : "rgba(255,255,255,0.6)" }}
              >
                {link.label}
              </Link>
            ))}
            {!session && (
              <div className="pt-2 border-t mt-2 flex gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <Link href="/auth/login" className="flex-1 text-center rounded-lg py-2.5 text-sm font-medium no-underline border" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>Log in</Link>
                <Link href="/auth/signup" className="flex-1 text-center btn-primary no-underline" style={{ padding: "10px 0" }}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
