import { auth, currentUser } from "@clerk/nextjs/server";
import type { Viewer } from "./types";

export const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

/**
 * Resolve the current viewer.
 *
 * - Production: a real Clerk session that has verified an email address or
 *   phone number. Unverified sessions are reported so layouts can gate them.
 * - Local preview (no Clerk keys): an explicitly labelled preview viewer so
 *   the UI and the live curriculum can be inspected without credentials.
 */
export async function getViewer(): Promise<Viewer | null> {
  if (!clerkConfigured) {
    return {
      id: "preview-learner",
      name: "Preview Learner",
      email: "preview@lumio.local",
      imageUrl: null,
      verified: true,
      isPreview: true,
    };
  }

  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const verified =
    user.emailAddresses.some((item) => item.verification?.status === "verified") ||
    user.phoneNumbers.some((item) => item.verification?.status === "verified");

  const primary =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0];

  return {
    id: userId,
    name: user.fullName ?? primary?.emailAddress?.split("@")[0] ?? "Learner",
    email: primary?.emailAddress ?? "",
    imageUrl: user.imageUrl ?? null,
    verified,
    isPreview: false,
  };
}

/** Server actions use this to reject anonymous requests in production. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("You must be signed in to continue.");
  if (!viewer.verified) throw new Error("Verify your email or phone number first.");
  return viewer;
}
