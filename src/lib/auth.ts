import { auth, currentUser } from "@clerk/nextjs/server";
import { getPlayer } from "./data";
import type { Viewer } from "./types";
import { displayName } from "./utils";

export const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

/** Resolve the current verified Clerk viewer. No implicit preview sessions. */
export async function getViewer(): Promise<Viewer | null> {
  if (!clerkConfigured) return null;

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
  const primaryPhone = user.phoneNumbers[0];

  return {
    id: userId,
    name: displayName(
      user.fullName ?? primary?.emailAddress?.split("@")[0] ?? "Learner",
      primary?.emailAddress ?? primaryPhone?.phoneNumber ?? "Learner",
    ),
    email: primary?.emailAddress ?? primaryPhone?.phoneNumber ?? "",
    imageUrl: user.imageUrl ?? null,
    verified,
    isPreview: false,
  };
}

/** Server Actions use this to reject anonymous or unverified requests. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("You must be signed in to continue.");
  if (!viewer.verified) throw new Error("Verify your email or phone number first.");
  return viewer;
}

/** For app-only mutations: onboarding must already be complete. */
export async function requireOnboardedViewer(): Promise<Viewer> {
  const viewer = await requireViewer();
  const player = await getPlayer(viewer);
  if (!player.onboardingCompleted) {
    throw new Error("Finish onboarding before continuing.");
  }
  return viewer;
}
