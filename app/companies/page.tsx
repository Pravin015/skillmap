"use client";

import { useState } from "react";
import { companies, COMPANY_COLORS } from "@/lib/data";
import CompanyLogo from "@/components/CompanyLogo";
import SkillTag from "@/components/SkillTag";

const domainLabels: Record<string, string> = {
  software: "Software Development",
  cybersecurity: "Cybersecurity",
  cloud: "Cloud & DevOps",
  data: "Data & Analytics",
};

export default function CompaniesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        Browse companies
      </h1>
      <p className="mb-8 text-gray-600">
        Explore domains, skills, and interview processes at top companies.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const isExpanded = expandedId === company.id;
          const color = COMPANY_COLORS[company.id];
          const domainKeys = Object.keys(company.domains);

          return (
            <div
              key={company.id}
              className={`rounded-2xl border bg-white transition-all ${
                isExpanded
                  ? "border-indigo-200 shadow-lg sm:col-span-2 lg:col-span-3"
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : company.id)
                }
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <CompanyLogo
                  companyId={company.id}
                  letter={company.logo.charAt(0)}
                  size="lg"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {company.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {domainKeys.length} domain
                    {domainKeys.length > 1 ? "s" : ""} available
                  </p>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 pb-5">
                  <div className="mt-4 space-y-6">
                    {domainKeys.map((domainKey) => {
                      const domain = company.domains[domainKey];
                      return (
                        <div key={domainKey}>
                          <div className="mb-3 flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <h3 className="font-semibold text-gray-900">
                              {domainLabels[domainKey] || domainKey}
                            </h3>
                            {domain.fresher_friendly && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                Fresher friendly
                              </span>
                            )}
                          </div>

                          <div className="ml-4 space-y-3">
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                                Roles
                              </p>
                              <p className="text-sm text-gray-700">
                                {domain.roles.join(", ")}
                              </p>
                            </div>

                            <div>
                              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                                Required skills
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {domain.skills.map((skill) => (
                                  <SkillTag key={skill} skill={skill} />
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                                Interview process
                              </p>
                              <p className="text-sm text-gray-700">
                                {domain.interview}
                              </p>
                            </div>

                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-500">
                                Avg package:{" "}
                                <span className="font-medium text-gray-700">
                                  {domain.avg_package}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
