"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  companies,
  getMatchingJobs,
  getSimilarJobs,
  COMPANY_COLORS,
  DOMAIN_MAP,
} from "@/lib/data";
import { UserProfile, Job } from "@/lib/types";
import JobCard from "@/components/JobCard";
import CompanyLogo from "@/components/CompanyLogo";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkedSkills, setCheckedSkills] = useState<Record<string, boolean>>(
    {}
  );
  const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("skillmap_profile");
    if (!stored) {
      router.push("/onboarding");
      return;
    }
    const p: UserProfile = JSON.parse(stored);
    setProfile(p);

    const matched = getMatchingJobs(p.companies, p.domainKey);
    setMatchedJobs(matched);

    if (matched.length === 0) {
      const similar = getSimilarJobs(p.companies, p.domainKey);
      setSimilarJobs(similar);
    }

    const savedSkills = localStorage.getItem("skillmap_checked");
    if (savedSkills) {
      setCheckedSkills(JSON.parse(savedSkills));
    }
  }, [router]);

  function toggleSkill(key: string) {
    setCheckedSkills((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("skillmap_checked", JSON.stringify(updated));
      return updated;
    });
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const selectedCompanyData = companies.filter((c) =>
    profile.companies.includes(c.id)
  );

  const skillSections = selectedCompanyData
    .map((c) => {
      const domainInfo = c.domains[profile.domainKey];
      if (!domainInfo) return null;
      return {
        companyId: c.id,
        companyName: c.name,
        logo: c.logo,
        roles: domainInfo.roles,
        skills: domainInfo.skills,
        interview: domainInfo.interview,
        avgPackage: domainInfo.avg_package,
      };
    })
    .filter(Boolean);

  const jobsToShow = matchedJobs.length > 0 ? matchedJobs : similarJobs;
  const isExactMatch = matchedJobs.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Hi {profile.name}, here&apos;s your job map
        </h1>
        <p className="mt-2 text-gray-600">
          {profile.domain} roles at your dream companies
        </p>
      </div>

      {/* Section 1: Job Openings */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          {isExactMatch
            ? "Openings at your dream companies right now"
            : "No exact matches — here are similar roles"}
        </h2>
        {!isExactMatch && (
          <p className="mb-4 text-sm text-gray-500">
            No current openings match your exact profile, but these roles are
            close.
          </p>
        )}

        {jobsToShow.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {jobsToShow.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-500">
              No openings found right now. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Section 2: Skill checklists */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          What you need to learn
        </h2>

        {skillSections.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {skillSections.map((section) => {
              if (!section) return null;
              const color = COMPANY_COLORS[section.companyId];
              const totalSkills = section.skills.length;
              const checkedCount = section.skills.filter(
                (s) => checkedSkills[`${section.companyId}-${s}`]
              ).length;

              return (
                <div
                  key={section.companyId}
                  className="rounded-xl border border-gray-200 bg-white"
                  style={{ borderTopWidth: "3px", borderTopColor: color }}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        companyId={section.companyId}
                        letter={section.logo.charAt(0)}
                        size="sm"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {section.companyName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {section.roles.join(", ")}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {checkedCount}/{totalSkills} skills covered
                        </span>
                        <span>
                          {Math.round((checkedCount / totalSkills) * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(checkedCount / totalSkills) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      {section.skills.map((skill) => {
                        const key = `${section.companyId}-${skill}`;
                        return (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedSkills[key]}
                              onChange={() => toggleSkill(key)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span
                              className={`text-sm ${
                                checkedSkills[key]
                                  ? "text-gray-400 line-through"
                                  : "text-gray-700"
                              }`}
                            >
                              {skill}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Meta */}
                    <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <p>
                        <span className="font-medium text-gray-600">
                          Interview:
                        </span>{" "}
                        {section.interview}
                      </p>
                      <p>
                        <span className="font-medium text-gray-600">
                          Avg package:
                        </span>{" "}
                        {section.avgPackage}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-5 py-3">
                    <Link
                      href={`/chat?company=${section.companyId}`}
                      className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                      Get AI prep plan →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-500">
              Your selected companies don&apos;t have {profile.domain} roles
              listed yet.
            </p>
            <Link
              href="/companies"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Browse all companies →
            </Link>
          </div>
        )}
      </section>

      {/* Section 3: AI Advisor CTA */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
        <h2 className="text-xl font-bold">Ask the AI advisor</h2>
        <p className="mt-2 text-indigo-100">
          Get a personalised week-by-week preparation plan based on your profile
          and the jobs available right now.
        </p>
        <Link
          href="/chat"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
        >
          Plan my preparation
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </section>
    </div>
  );
}
