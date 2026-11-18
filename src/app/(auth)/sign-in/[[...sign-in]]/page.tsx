import { redirect } from "next/navigation";
import { PasswordlessAuthForm } from "@/components/auth/passwordless-auth-form";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { clerkConfigured, getViewer } from "@/lib/auth";
import { getPlayer } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const viewer = await getViewer();
  if (viewer?.verified) {
    const player = await getPlayer(viewer);
    redirect(player.onboardingCompleted ? "/learn" : "/onboarding");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Continue with Google, an email magic link, or a phone code. No passwords."
    >
      {clerkConfigured ? <PasswordlessAuthForm mode="sign-in" /> : <SetupNotice />}
    </AuthShell>
  );
}
