// proxy.ts — Next.js 16 auth proxy (replaces deprecated middleware.ts)
// Protects /dashboard, /challenges, /leaderboard and their /api/* equivalents.
// Public routes: /, /sign-in, /sign-up, /api/webhooks/*.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/signin(.*)",
  "/signup(.*)",
  "/profile(.*)",
  "/api/webhooks/(.*)",
]);

// clerkMiddleware returns a Next.js-compatible handler; we export it as `proxy`
// to satisfy the Next.js 16 file convention (proxy.ts / export function proxy).
export const proxy = clerkMiddleware(
  async (auth, request: NextRequest) => {
    const { pathname, search } = request.nextUrl;
    const { userId } = await auth();

    // If an authenticated user hits sign-in or sign-up (including /signin), send to /dashboard
    if (
      userId &&
      (pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up") ||
        pathname.startsWith("/signin") ||
        pathname.startsWith("/signup"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Normalize /signin and /signup aliases to /sign-in and /sign-up
    if (pathname === "/signin" || pathname.startsWith("/signin/")) {
      const target = pathname.replace(/^\/signin/, "/sign-in") + search;
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname === "/signup" || pathname.startsWith("/signup/")) {
      const target = pathname.replace(/^\/signup/, "/sign-up") + search;
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
