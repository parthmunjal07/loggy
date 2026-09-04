// proxy.ts — Next.js 16 auth proxy (replaces deprecated middleware.ts)
// Protects /dashboard, /challenges, /leaderboard and their /api/* equivalents.
// Public routes: /, /sign-in, /sign-up, /api/webhooks/*.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/profile(.*)",
  "/api/webhooks/(.*)",
]);

// clerkMiddleware returns a Next.js-compatible handler; we export it as `proxy`
// to satisfy the Next.js 16 file convention (proxy.ts / export function proxy).
export const proxy = clerkMiddleware(
  async (auth, request: NextRequest) => {
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
