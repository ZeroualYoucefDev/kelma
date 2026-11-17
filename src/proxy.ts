import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Next.js 16 renamed Middleware to Proxy. This is the single network
 * boundary for optimistic auth checks; full verification is enforced again
 * inside the protected layout where Clerk user data is available.
 */

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isProtected = createRouteMatcher([
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

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("redirect_url", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
});

/** When no Clerk keys exist (local UI preview) requests pass through. */
export default clerkConfigured
  ? withClerk
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/((?!_next|api/webhooks|favicon.ico|.*\\..*).*)"],
};
