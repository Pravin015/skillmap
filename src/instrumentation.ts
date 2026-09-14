import type { Instrumentation } from "next";

/** Server-side error reporting hook (Next.js instrumentation). Sends to Sentry when SENTRY_DSN is set; otherwise logs. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError, sentryConfigured } = await import("@/lib/analytics");
  if (!sentryConfigured()) return;
  await reportError(err, { path: request.path, method: request.method, routerKind: context.routerKind, routePath: context.routePath, routeType: context.routeType });
};

export async function register() {
  // Nothing to initialise: reporting is HTTP-based and lazy.
}
