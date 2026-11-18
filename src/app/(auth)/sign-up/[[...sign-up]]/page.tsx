import { PasswordlessAuthForm } from "@/components/auth/passwordless-auth-form";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { clerkConfigured } from "@/lib/auth";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Start your streak"
      subtitle="Google or a one-time email code. No passwords, ever."
    >
      {clerkConfigured ? <PasswordlessAuthForm mode="sign-up" /> : <SetupNotice />}
    </AuthShell>
  );
}
