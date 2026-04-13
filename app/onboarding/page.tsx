"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { companies, COMPANY_COLORS, DOMAIN_MAP } from "@/lib/data";
import { UserProfile } from "@/lib/types";

const degrees = [
  "B.Tech/BE",
  "BCA",
  "B.Sc",
  "BBA",
  "B.Com",
  "BA",
  "MBA",
  "MCA",
  "Other",
];

const gradYears = ["2024", "2025", "2026"];

const domains = [
  {
    key: "Software Development",
    label: "Software Development",
    desc: "Build products, write code, solve DSA",
    icon: "{ }",
  },
  {
    key: "Cybersecurity",
    label: "Cybersecurity",
    desc: "Protect systems, ethical hacking, SOC",
    icon: "🛡",
  },
  {
    key: "Cloud & DevOps",
    label: "Cloud & DevOps",
    desc: "AWS, Azure, infrastructure, CI/CD",
    icon: "☁",
  },
  {
    key: "Data & Analytics",
    label: "Data & Analytics",
    desc: "SQL, Python, dashboards, ML basics",
    icon: "📊",
  },
  {
    key: "Consulting & Finance",
    label: "Consulting & Finance",
    desc: "Business strategy, GRC, advisory",
    icon: "💼",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");

  const [selectedDomain, setSelectedDomain] = useState("");

  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  function toggleCompany(id: string) {
    setSelectedCompanies((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    );
  }

  function canProceed() {
    if (step === 1) return name.trim() && degree && gradYear;
    if (step === 2) return selectedDomain;
    if (step === 3) return selectedCompanies.length > 0;
    return false;
  }

  function handleNext() {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      degree,
      graduationYear: gradYear,
      domain: selectedDomain,
      domainKey: DOMAIN_MAP[selectedDomain] || "software",
      companies: selectedCompanies,
    };

    localStorage.setItem("skillmap_profile", JSON.stringify(profile));
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-12">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <span>Step {step} of 3</span>
          <span>{Math.round((step / 3) * 100)}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#0ABFBC] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Background */}
      {step === 1 && (
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            What&apos;s your background?
          </h2>
          <p className="mt-2 text-gray-600">
            Help us tailor recommendations to your profile.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#0ABFBC] focus:ring-2 focus:ring-[#E0F7F7]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Degree completed
              </label>
              <select
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#0ABFBC] focus:ring-2 focus:ring-[#E0F7F7]"
              >
                <option value="">Select degree</option>
                {degrees.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Graduation year
              </label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[#0ABFBC] focus:ring-2 focus:ring-[#E0F7F7]"
              >
                <option value="">Select year</option>
                {gradYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Domain */}
      {step === 2 && (
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            What domain interests you most?
          </h2>
          <p className="mt-2 text-gray-600">
            Pick one area — you can always change this later.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {domains.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDomain(d.key)}
                className={`rounded-xl border-2 p-5 text-left transition-all ${
                  selectedDomain === d.key
                    ? "border-[#0ABFBC] bg-[#E0F7F7] ring-2 ring-[#E0F7F7]"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="mb-2 text-2xl">{d.icon}</div>
                <div className="font-semibold text-gray-900">{d.label}</div>
                <div className="mt-1 text-sm text-gray-500">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Companies */}
      {step === 3 && (
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Pick your dream companies
          </h2>
          <p className="mt-2 text-gray-600">
            Select up to 5 companies you&apos;d love to work at.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {companies.map((c) => {
              const selected = selectedCompanies.includes(c.id);
              const color = COMPANY_COLORS[c.id];
              const hasDomain =
                DOMAIN_MAP[selectedDomain] in c.domains;
              const isFresherFriendly = hasDomain
                ? c.domains[DOMAIN_MAP[selectedDomain]]?.fresher_friendly
                : Object.values(c.domains).some((d) => d.fresher_friendly);

              return (
                <button
                  key={c.id}
                  onClick={() => toggleCompany(c.id)}
                  className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                    selected
                      ? "border-[#0ABFBC] bg-[#E0F7F7] ring-2 ring-[#E0F7F7]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {c.logo.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {c.name}
                      </div>
                      {isFresherFriendly && (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Fresher friendly
                        </span>
                      )}
                    </div>
                  </div>
                  {selected && (
                    <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#0ABFBC] text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm text-gray-400">
            {selectedCompanies.length}/5 selected
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="rounded-xl bg-[#0ABFBC] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#089A97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === 3 ? "See my dashboard" : "Continue"}
        </button>
      </div>
    </div>
  );
}
