import { redirect } from "next/navigation";
import { PasswordlessAuthForm } from "@/components/auth/passwordless-auth-form";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { clerkConfigured, getViewer } from "@/lib/auth";
import { getPlayer } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const viewer = await getViewer();
  if (viewer?.verified) {
    const player = await getPlayer(viewer);
    redirect(player.onboardingCompleted ? "/learn" : "/onboarding");
  }

  return (
    <AuthShell
      title="Start your streak"
      subtitle="Pick a passwordless route, then choose the languages that matter to you."
    >
      {clerkConfigured ? <PasswordlessAuthForm mode="sign-up" /> : <SetupNotice />}
    </AuthShell>
  );
}
