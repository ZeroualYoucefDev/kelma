import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Next.js 16 renamed Middleware to Proxy. This is the optimistic network
 * boundary; every protected page and Server Action still verifies the session
 * and onboarding state on the server.
 */

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isProtected = createRouteMatcher([
  "/onboarding(.*)",
  "/learn(.*)",
  "/units(.*)",
  "/lesson(.*)",
  "/quests(.*)",
  "/leaderboard(.*)",
  "/shop(.*)",
  "/profile(.*)",
  "/settings(.*)",
]);

const withClerk = clerkMiddleware(async (auth, request) => {
  if (!isProtected(request)) return;

  const { userId } = await auth();
  if (userId) return;

  // Unauthenticated visitors only ever land on the public marketing page.
  return NextResponse.redirect(new URL("/", request.url));
});

const proxy = clerkConfigured
  ? withClerk
  : function proxy() {
      return NextResponse.next();
    };

export default proxy;
export { proxy };

export const config = {
  matcher: ["/((?!_next|api/webhooks|favicon.ico|.*\\..*).*)"],
};
