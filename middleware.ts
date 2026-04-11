import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes — only ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // HR dashboard — only HR role (and ADMIN)
    if (pathname.startsWith("/hr-dashboard") && token?.role !== "HR" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Company dashboard — only ORG role (and ADMIN)
    if (pathname.startsWith("/company-dashboard") && token?.role !== "ORG" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/admin/:path*", "/onboarding/:path*", "/hr-dashboard/:path*", "/company-dashboard/:path*", "/profile/:path*"],
};
