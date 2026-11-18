import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailLinkVerification } from "@/components/auth/email-link-verification";
import { clerkConfigured, getViewer } from "@/lib/auth";
import { getPlayer } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Landing page for Clerk magic-link verification. */
export default async function VerifyPage() {
  if (!clerkConfigured) redirect("/");

  const viewer = await getViewer();
  if (viewer?.verified) {
    const player = await getPlayer(viewer);
    redirect(player.onboardingCompleted ? "/learn" : "/onboarding");
  }

  return (
    <AuthShell title="Confirm your email" subtitle="One secure link, then your language setup.">
      <EmailLinkVerification />
    </AuthShell>
  );
}
