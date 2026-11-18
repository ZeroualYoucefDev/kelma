import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthShell, SetupNotice } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { clerkConfigured, getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Confirmation handler. A verified session never sees the landing page —
 * it is sent straight into the dashboard. In local preview there is nothing
 * to verify, so we continue into the app too.
 */
export default async function VerifyPage() {
  const viewer = await getViewer();
  if (!viewer || viewer.verified) redirect("/learn");

  return (
    <AuthShell title="One last step" subtitle="Confirm your email to unlock your dashboard.">
      {clerkConfigured ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/8 p-4">
            <MailCheck className="mt-0.5 size-5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed text-slate-200">
              Open the confirmation link we sent you. Once verified you will land directly on{" "}
              <strong className="text-accent">/learn</strong> — no detour through the homepage.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <SetupNotice />
      )}
    </AuthShell>
  );
}
