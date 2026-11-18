"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { ArrowLeft, CheckCircle2, LoaderCircle, MailCheck, ShieldAlert } from "lucide-react";
import {
  AUTH_FLOW_KEY,
  AuthProfileCompletion,
  type EmailLinkFlow,
} from "@/components/auth/passwordless-auth-form";
import { Button } from "@/components/ui/button";

type Phase = "waiting" | "verifying" | "complete-profile" | "done" | "error";

function readableError(error: unknown): string {
  const candidate = error as
    | {
        longMessage?: string;
        message?: string;
        code?: string;
        errors?: Array<{ message?: string; longMessage?: string; code?: string }>;
      }
    | null
    | undefined;

  return (
    candidate?.longMessage ||
    candidate?.errors?.[0]?.longMessage ||
    candidate?.errors?.[0]?.message ||
    candidate?.message ||
    (candidate?.code ? `Verification failed (${candidate.code}).` : undefined) ||
    "We could not complete verification. Please try the link again."
  );
}

function verificationMessage(status: string | undefined): string {
  if (status === "expired") return "That magic link expired. Request a fresh one to continue.";
  if (status === "failed") return "That link could not be verified. Request a fresh one to continue.";
  if (status === "client_mismatch") {
    return "This link must be opened in the same browser where you requested it. Start again on this device.";
  }
  return "We could not confirm that link. Request a fresh one to continue.";
}

export function EmailLinkVerification() {
  const { signIn, fetchStatus: signInFetch } = useSignIn();
  const { signUp, fetchStatus: signUpFetch } = useSignUp();

  const [phase, setPhase] = useState<Phase>("waiting");
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || signInFetch === "fetching" || signUpFetch === "fetching") return;
    started.current = true;

    const stored = sessionStorage.getItem(AUTH_FLOW_KEY) as EmailLinkFlow | null;
    const signInVerification = signIn.emailLink.verification;
    const signUpVerification = signUp.verifications.emailLinkVerification;
    const flow: EmailLinkFlow | null =
      signUpVerification?.status === "verified" || signUpVerification?.status === "client_mismatch"
        ? "signup-email"
        : signInVerification?.status === "verified" ||
            signInVerification?.status === "client_mismatch"
          ? "signin-email"
          : stored;

    if (!flow) {
      setPhase("waiting");
      setMessage(null);
      return;
    }

    setPhase("verifying");

    const navigate = () => {
      sessionStorage.removeItem(AUTH_FLOW_KEY);
      setPhase("done");
      window.location.assign("/onboarding");
    };

    void (async () => {
      try {
        if (flow === "signin-email") {
          const waited = await signIn.emailLink.waitForVerification();
          if (waited.error) {
            setMessage(readableError(waited.error));
            setPhase("error");
            return;
          }

          const verification = signIn.emailLink.verification;
          if (verification?.status !== "verified") {
            setMessage(verificationMessage(verification?.status));
            setPhase("error");
            return;
          }

          if (signIn.status !== "complete") {
            setMessage("Your sign-in needs another security step. Please start again.");
            setPhase("error");
            return;
          }

          const finalized = await signIn.finalize({
            navigate: ({ decorateUrl }) => {
              const url = decorateUrl("/onboarding");
              window.location.assign(/^https?:\/\//i.test(url) ? url : "/onboarding");
            },
          });
          if (finalized.error) {
            setMessage(readableError(finalized.error));
            setPhase("error");
            return;
          }
          navigate();
          return;
        }

        const waited = await signUp.verifications.waitForEmailLinkVerification();
        if (waited.error) {
          setMessage(readableError(waited.error));
          setPhase("error");
          return;
        }

        const verification = signUp.verifications.emailLinkVerification;
        if (verification?.status !== "verified") {
          setMessage(verificationMessage(verification?.status));
          setPhase("error");
          return;
        }

        if (signUp.status === "missing_requirements") {
          setPhase("complete-profile");
          return;
        }

        if (signUp.status !== "complete") {
          setMessage("Your account needs another detail. Please start again.");
          setPhase("error");
          return;
        }

        const finalized = await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/onboarding");
            window.location.assign(/^https?:\/\//i.test(url) ? url : "/onboarding");
          },
        });
        if (finalized.error) {
          setMessage(readableError(finalized.error));
          setPhase("error");
          return;
        }
        navigate();
      } catch (error) {
        setMessage(readableError(error));
        setPhase("error");
      }
    })();
  }, [signIn, signUp, signInFetch, signUpFetch]);

  if (phase === "complete-profile") {
    return (
      <div className="animate-slide-up">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-teal/25 bg-teal/[0.07] p-4">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-teal" />
          <p className="text-sm leading-relaxed text-slate-200">
            Your email is verified. Add the last account detail and we&apos;ll open your three-step
            setup.
          </p>
        </div>
        <AuthProfileCompletion onDone={() => window.location.assign("/onboarding")} />
      </div>
    );
  }

  if (phase === "verifying" || phase === "waiting") {
    return (
      <div className="animate-slide-up text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
          <LoaderCircle className="size-7 animate-spin" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
          {phase === "waiting" ? "Open your magic link" : "Verifying your link…"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {phase === "waiting"
            ? "The link in your email completes verification here. Keep this tab open and open the link on this same device."
            : "Once confirmed, your account and three-step language setup open automatically."}
        </p>
        <Button asChild variant="secondary" className="mt-7">
          <Link href="/sign-in">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="animate-pop text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-extrabold">You&apos;re verified</h2>
        <p className="mt-2 text-sm text-muted">Opening your language setup…</p>
      </div>
    );
  }

  return (
    <div className="animate-pop text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-coral">
        <ShieldAlert className="size-8" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
        Verification needs another try
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {message ?? "The magic link could not be completed."}
      </p>
      <Button asChild className="mt-7">
        <Link href="/sign-in">Request a new link</Link>
      </Button>
    </div>
  );
}
