"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const roles = [
  { key: "STUDENT", label: "Student / Aspirant", color: "from-indigo-500 to-purple-600" },
  { key: "HR", label: "HR / Recruiter", color: "from-cyan-500 to-blue-600" },
  { key: "ORG", label: "Organisation", color: "from-emerald-500 to-teal-600" },
];

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "STUDENT";

  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: activeRole,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Use window.location for instant redirect instead of router.push
        const redirectMap: Record<string, string> = {
          ADMIN: "/admin",
          HR: "/hr-dashboard",
          ORG: "/company-dashboard",
          INSTITUTION: "/institution-dashboard",
        };
        window.location.href = redirectMap[activeRole] || "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const activeRoleData = roles.find((r) => r.key === activeRole) || roles[0];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your SkillMap account
          </p>
        </div>

        {/* Role tabs */}
        <div className="mb-6 flex rounded-xl border border-gray-200 bg-white p-1">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => {
                setActiveRole(role.key);
                setError("");
              }}
              className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                activeRole === role.key
                  ? `bg-gradient-to-r ${role.color} text-white shadow-sm`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Gradient top */}
          <div
            className={`-mx-6 -mt-6 mb-6 h-1 rounded-t-2xl bg-gradient-to-r ${activeRoleData.color}`}
          />

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-6 w-full rounded-xl bg-gradient-to-r ${activeRoleData.color} px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup?role=${activeRole}`}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
