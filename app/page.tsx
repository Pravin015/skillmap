"use client";

import Link from "next/link";
import { companies } from "@/lib/data";
import CompanyLogo from "@/components/CompanyLogo";
import { useEffect, useState } from "react";

const steps = [
  {
    num: "01",
    title: "Pick your dream companies",
    desc: "Choose from top Indian & global companies hiring freshers right now.",
  },
  {
    num: "02",
    title: "See your skill gap",
    desc: "We map exactly what skills each role needs vs. what you have.",
  },
  {
    num: "03",
    title: "Get your AI roadmap",
    desc: "A week-by-week personalised prep plan with free resources.",
  },
];

const stats = [
  { value: 50, suffix: "+", label: "Companies mapped" },
  { value: 200, suffix: "+", label: "Skills tracked" },
  { value: 10, suffix: "K+", label: "Students helped" },
];

const loginCards = [
  {
    role: "STUDENT",
    title: "Student / Aspirant",
    desc: "Find your path to your dream company. Get matched to live openings and build a prep plan.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    gradient: "from-indigo-500 to-purple-600",
    href: "/auth/login?role=STUDENT",
  },
  {
    role: "HR",
    title: "HR / Recruiter",
    desc: "Post openings, discover pre-assessed talent, and find candidates who are already preparing.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-600",
    href: "/auth/login?role=HR",
  },
  {
    role: "ORG",
    title: "Organisation",
    desc: "Manage your hiring pipeline, define role requirements, and connect with job-ready graduates.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    href: "/auth/login?role=ORG",
  },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero — Dark futuristic */}
      <section className="relative overflow-hidden bg-gray-950">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-600/20 blur-[100px] animate-pulse" />
          <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px] animate-pulse [animation-delay:1s]" />
          <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-600/15 blur-[100px] animate-pulse [animation-delay:2s]" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-24 sm:pt-32">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Built for Indian fresh graduates
            </div>

            {/* Problem */}
            <p className="mx-auto mb-4 max-w-xl text-lg text-gray-400">
              Thousands of graduates. No clarity on what companies actually want.
            </p>

            {/* Solution */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SkillMap
              </span>{" "}
              bridges the gap
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
              Tell us your dream companies. We show you what&apos;s open right now,
              exactly what skills you&apos;re missing, and build you a personalised
              AI-powered preparation roadmap.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup?role=STUDENT"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
              >
                Get started free
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-6 py-4 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Company logos */}
          <div className="mt-20">
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-gray-600">
              Trusted by students targeting
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2 backdrop-blur-sm"
                >
                  <CompanyLogo companyId={c.id} letter={c.logo.charAt(0)} size="sm" />
                  <span className="text-sm font-medium text-gray-400">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
              How it works
            </p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Three steps to your dream job
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < 2 && (
                  <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-indigo-200 to-transparent sm:block" />
                )}
                <div className="relative rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <span className="mb-4 inline-block text-3xl font-black text-indigo-600/20">
                    {step.num}
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-950 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold text-white sm:text-5xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Get started
            </p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose how you want to use SkillMap
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-600">
              Whether you&apos;re a student preparing for placements, an HR looking for
              talent, or an organisation managing hiring — we&apos;ve got you covered.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {loginCards.map((card) => (
              <div
                key={card.role}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-xl"
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${card.gradient}`} />

                <div className="p-6">
                  <div
                    className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${card.gradient} p-3 text-white`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    {card.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-gray-600">
                    {card.desc}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={card.href}
                      className={`flex-1 rounded-lg bg-gradient-to-r ${card.gradient} px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90`}
                    >
                      Login
                    </Link>
                    <Link
                      href={card.href.replace("login", "signup")}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                S
              </div>
              <span className="text-lg font-semibold text-white">SkillMap</span>
            </div>
            <nav className="flex gap-6 text-sm text-gray-500">
              <Link href="/companies" className="hover:text-gray-300">
                Companies
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
              <Link href="/chat" className="hover:text-gray-300">
                AI Advisor
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-600">
            &copy; 2026 SkillMap. Built for Indian graduates who refuse to settle.
          </div>
        </div>
      </footer>
    </div>
  );
}
