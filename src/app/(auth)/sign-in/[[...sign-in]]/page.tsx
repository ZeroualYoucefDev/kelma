import { SignIn } from "@clerk/nextjs";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { clerkConfigured } from "@/lib/auth";

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Continue your streak with a passwordless sign-in.">
      {clerkConfigured ? (
        <SignIn forceRedirectUrl="/learn" signUpUrl="/sign-up" />
      ) : (
        <SetupNotice />
      )}
    </AuthShell>
  );
}
