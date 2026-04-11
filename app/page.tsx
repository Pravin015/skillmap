import Link from "next/link";
import { companies } from "@/lib/data";
import CompanyLogo from "@/components/CompanyLogo";

const valueProps = [
  {
    title: "Live job openings",
    description:
      "See which of your dream companies are actively hiring right now",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
  },
  {
    title: "Exact skill gap",
    description: "Know precisely what you're missing for each role",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "AI prep roadmap",
    description: "Get a week-by-week plan to become application-ready",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:pt-32">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Know exactly what it takes to{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              get hired
            </span>{" "}
            at your dream company
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Tell us where you want to work. We&apos;ll show you what&apos;s open
            right now and exactly how to get there.
          </p>
          <div className="mt-10">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200"
            >
              Find my path
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Company logos */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-gray-400">
            Companies we cover
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <CompanyLogo
                  companyId={c.id}
                  letter={c.logo.charAt(0)}
                  size="md"
                />
                <span className="text-sm font-semibold text-gray-700">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  {prop.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {prop.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Ready to map your career?
          </h2>
          <p className="mt-3 text-gray-600">
            It takes 2 minutes to set up. No sign-up required.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Get started free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
