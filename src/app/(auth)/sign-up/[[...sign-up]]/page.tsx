import { SignUp } from "@clerk/nextjs";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { clerkConfigured } from "@/lib/auth";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Start your streak"
      subtitle="Google, an email magic link, or a phone code. No passwords, ever."
    >
      {clerkConfigured ? (
        <SignUp forceRedirectUrl="/learn" signInUrl="/sign-in" />
      ) : (
        <SetupNotice />
      )}
    </AuthShell>
  );
}
