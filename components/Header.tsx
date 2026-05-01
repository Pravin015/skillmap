"use client";
// Prakae-style header: pill nav, mega menu, light theme, Poppins.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "./NotificationBell";

interface MegaItem {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface MegaSection {
  heading: string;
  items: MegaItem[];
}

interface MegaGroup {
  label: string;
  sections: MegaSection[];
  feature: {
    title: string;
    body: string;
    href: string;
    cta: string;
    badge?: string;
  };
}

// Tiny inline SVG icons — keeps bundle clean, matches Prakae's flat-icon look.
const Icon = {
  star: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>),
  globe: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>),
  card: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>),
  bag: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>),
  shield: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  book: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>),
  users: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>),
  spark: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2" /></svg>),
  chart: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>),
  chat: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>),
  pen: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>),
  trophy: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></svg>),
};

const navGroups: MegaGroup[] = [
  {
    label: "Company",
    sections: [
      {
        heading: "ABOUT",
        items: [
          { href: "/about", label: "About us", desc: "Our story, mission and team.", icon: Icon.star },
          { href: "/forms?type=careers", label: "Careers", desc: "Join us — we're hiring across India.", icon: Icon.globe },
          { href: "/blog", label: "Press", desc: "See what others are saying about us.", icon: Icon.card },
          { href: "/companies", label: "Customers", desc: "Case studies & success stories.", icon: Icon.check },
        ],
      },
      {
        heading: "REACH US",
        items: [
          { href: "/contact", label: "Contact sales", desc: "Talk to a hiring engineer.", icon: Icon.bag },
          { href: "/about#trust", label: "Trust center", desc: "Security & compliance posture.", icon: Icon.shield },
        ],
      },
    ],
    feature: {
      title: "Company",
      body: "Explore everything AstraaHire has to offer.",
      href: "/about",
      cta: "Read company brief",
      badge: "Featured",
    },
  },
  {
    label: "Platform",
    sections: [
      {
        heading: "FOR JOB SEEKERS",
        items: [
          { href: "/jobs", label: "Jobs", desc: "Browse curated openings.", icon: Icon.bag },
          { href: "/jobs/external", label: "Live Openings", desc: "Aggregated listings across the web.", icon: Icon.globe },
          { href: "/courses", label: "Courses", desc: "Learn skills that get you hired.", icon: Icon.book },
          { href: "/mentors", label: "Mentors", desc: "1:1 guidance from industry experts.", icon: Icon.users },
        ],
      },
      {
        heading: "PREPARE",
        items: [
          { href: "/chat", label: "AI Advisor", desc: "AI-powered career guidance.", icon: Icon.spark },
          { href: "/mock-interview", label: "Mock Interview", desc: "Practice for 15+ companies.", icon: Icon.chart },
          { href: "/offer-verify", label: "Verify Offer", desc: "Detect fake offer letters.", icon: Icon.shield },
        ],
      },
    ],
    feature: {
      title: "Platform",
      body: "AI-powered career intelligence for India's freshers.",
      href: "/dashboard",
      cta: "Open dashboard",
    },
  },
  {
    label: "Resources",
    sections: [
      {
        heading: "LEARN",
        items: [
          { href: "/blog", label: "Blog", desc: "Career tips & guides.", icon: Icon.pen },
          { href: "/events", label: "Events", desc: "Workshops & webinars.", icon: Icon.chat },
          { href: "/competitions", label: "Competitions", desc: "Win prizes & recognition.", icon: Icon.trophy },
          { href: "/labs", label: "Labs", desc: "Build hands-on projects.", icon: Icon.spark },
        ],
      },
      {
        heading: "BUILD",
        items: [
          { href: "/courses", label: "Courses", desc: "Self-paced learning paths.", icon: Icon.book },
          { href: "/companies", label: "Companies", desc: "Explore employers.", icon: Icon.bag },
        ],
      },
    ],
    feature: {
      title: "Resources",
      body: "Everything you need to ace your next interview.",
      href: "/blog",
      cta: "Browse all resources",
    },
  },
  {
    label: "Plans & Support",
    sections: [
      {
        heading: "FOR YOU",
        items: [
          { href: "/pricing", label: "Pricing", desc: "Plans for students & graduates.", icon: Icon.card },
          { href: "/forms?type=hire", label: "For Companies", desc: "Hire from our talent pool.", icon: Icon.bag },
          { href: "/for-institutions", label: "For Institutions", desc: "College partnership program.", icon: Icon.book },
          { href: "/for-mentors", label: "Become a Mentor", desc: "Earn while you guide.", icon: Icon.users },
        ],
      },
      {
        heading: "SUPPORT",
        items: [
          { href: "/contact", label: "Contact us", desc: "We're here to help.", icon: Icon.chat },
          { href: "/guide", label: "Help guide", desc: "Step-by-step product walkthrough.", icon: Icon.book },
        ],
      },
    ],
    feature: {
      title: "Plans & Support",
      body: "Find the right plan and get hands-on help when you need it.",
      href: "/pricing",
      cta: "See pricing",
    },
  },
];

const roleBadgeColors: Record<string, string> = {
  STUDENT: "bg-violet-100 text-violet-700",
  MENTOR: "bg-amber-100 text-amber-700",
  HR: "bg-cyan-100 text-cyan-700",
  ORG: "bg-emerald-100 text-emerald-700",
  INSTITUTION: "bg-violet-100 text-violet-700",
  ADMIN: "bg-rose-100 text-rose-700",
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile/image")
        .then((r) => r.json())
        .then((d) => { if (d.image) setProfileImg(d.image); })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenMega(null);
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close menus on route change
  useEffect(() => { setOpenMega(null); setMobileNav(false); }, [pathname]);

  const userRole = (session?.user as { role?: string })?.role;
  const userName = (session?.user as { name?: string })?.name;
  const userEmail = (session?.user as { email?: string })?.email;
  const dashboardHref =
    userRole === "ADMIN" ? "/admin"
    : userRole === "HR" ? "/hr-dashboard"
    : userRole === "ORG" ? "/company-dashboard"
    : userRole === "INSTITUTION" ? "/institution-dashboard"
    : userRole === "MENTOR" ? "/mentor-dashboard"
    : "/dashboard";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div ref={wrapperRef} className="relative max-w-6xl mx-auto">
        <div className="nav-pill flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 pl-2 pr-3 shrink-0">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm" style={{ background: "var(--primary)" }}>
              A
            </span>
            <span className="font-semibold text-[15px] hidden sm:inline" style={{ color: "var(--ink)" }}>AstraaHire</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navGroups.map((g) => (
              <button
                key={g.label}
                onMouseEnter={() => setOpenMega(g.label)}
                onClick={() => setOpenMega(openMega === g.label ? null : g.label)}
                className={`nav-link ${openMega === g.label ? "active" : ""}`}
              >
                {g.label}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openMega === g.label ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            ))}
            <Link href="/pricing" className={`nav-link ${pathname === "/pricing" ? "active" : ""}`}>Pricing</Link>
          </nav>

          {/* Right: auth */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <div className="hidden md:block"><NotificationBell /></div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all"
                  style={{ background: showUserMenu ? "var(--surface-alt)" : "transparent" }}
                >
                  {profileImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImg} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: "var(--primary)" }}>
                      {(userName || "U")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="hidden md:inline text-xs font-medium" style={{ color: "var(--ink)" }}>{userName?.split(" ")[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white border rounded-2xl shadow-xl p-2 animate-slide-down" style={{ borderColor: "var(--border)" }}>
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{userName}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{userEmail}</p>
                      {userRole && <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadgeColors[userRole] || "bg-gray-100 text-gray-700"}`}>{userRole}</span>}
                    </div>
                    <Link href={dashboardHref} className="block px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-alt)]" style={{ color: "var(--ink-soft)" }}>Dashboard</Link>
                    <Link href="/profile" className="block px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-alt)]" style={{ color: "var(--ink-soft)" }}>Profile</Link>
                    <Link href="/settings" className="block px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface-alt)]" style={{ color: "var(--ink-soft)" }}>Settings</Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-rose-50"
                      style={{ color: "#dc2626" }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden lg:inline-flex nav-link">Sign in</Link>
                <Link href="/auth/signup" className="btn-dark hidden lg:inline-flex" style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}>
                  Get started
                </Link>
              </>
            )}

            {/* Mobile burger */}
            <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden p-2 rounded-lg" style={{ color: "var(--ink)" }} aria-label="Toggle nav">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileNav ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mega menu */}
        {openMega && (
          <div onMouseLeave={() => setOpenMega(null)}>
            {navGroups.filter((g) => g.label === openMega).map((g) => (
              <div key={g.label} className="mega-menu">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {g.sections.map((sec) => (
                      <div key={sec.heading}>
                        <p className="text-[10px] font-semibold tracking-[0.18em] mb-2 px-3" style={{ color: "var(--muted-2)" }}>{sec.heading}</p>
                        {sec.items.map((it) => (
                          <Link key={it.href} href={it.href} className="mega-menu-item">
                            <span className="mega-menu-icon">{it.icon}</span>
                            <span className="flex-1 min-w-0">
                              <span className="mega-menu-label">{it.label}</span>
                              <span className="block mega-menu-desc">{it.desc}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Featured card */}
                  <div className="col-span-12 lg:col-span-4">
                    <Link href={g.feature.href} className="block">
                      <div className="mega-feature-card">
                        {g.feature.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white" style={{ color: "var(--ink)" }}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: "var(--success)" }} />
                            {g.feature.badge}
                          </span>
                        )}
                        <div />
                        <div>
                          <h4 className="text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>{g.feature.title}</h4>
                          <p className="text-xs leading-snug mb-3" style={{ color: "var(--ink-soft)" }}>{g.feature.body}</p>
                          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--ink)" }}>
                            {g.feature.cta}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile drawer */}
        {mobileNav && (
          <div className="lg:hidden mt-3 bg-white rounded-2xl border p-4 animate-slide-down" style={{ borderColor: "var(--border)" }}>
            {navGroups.map((g) => (
              <div key={g.label} className="mb-4">
                <p className="text-[10px] font-semibold tracking-[0.18em] mb-2 px-2" style={{ color: "var(--muted-2)" }}>{g.label.toUpperCase()}</p>
                {g.sections.flatMap((s) => s.items).map((it) => (
                  <Link key={it.href} href={it.href} className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ color: "var(--ink-soft)" }}>
                    <span className="mega-menu-icon" style={{ width: 30, height: 30 }}>{it.icon}</span>
                    <span className="text-sm font-medium">{it.label}</span>
                  </Link>
                ))}
              </div>
            ))}
            <Link href="/pricing" className="block px-2 py-2 text-sm font-medium" style={{ color: "var(--ink)" }}>Pricing</Link>
            {!session?.user && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link href="/auth/login" className="btn-outline justify-center">Sign in</Link>
                <Link href="/auth/signup" className="btn-dark justify-center">Get started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
