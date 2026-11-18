import { PasswordlessAuthForm } from "@/components/auth/passwordless-auth-form";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { clerkConfigured } from "@/lib/auth";

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Continue your streak with a passwordless sign-in.">
      {clerkConfigured ? <PasswordlessAuthForm mode="sign-in" /> : <SetupNotice />}
    </AuthShell>
  );
}
