"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ArrowRight, Check, LoaderCircle, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Mode = "sign-in" | "sign-up";
type Step = "identifier" | "code" | "mfa" | "complete-profile";

function safeDestination() {
  if (typeof window === "undefined") return "/learn";
  const requested = new URLSearchParams(window.location.search).get("redirect_url") || "/learn";
  return requested.startsWith("/") && !requested.startsWith("//") ? requested : "/learn";
}

function readableError(error: unknown) {
  const e = error as
    | {
        longMessage?: string;
        message?: string;
        errors?: Array<{ message?: string; longMessage?: string }>;
      }
    | null
    | undefined;
  return (
    e?.longMessage ||
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    e?.message ||
    "Something went wrong. Please try again."
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.34-.18-1.96H12v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.27Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.5l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.58A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.84a6 6 0 0 1 0-3.68V7.58H3.05a10 10 0 0 0 0 8.84l3.35-2.58Z" />
      <path fill="#EA4335" d="M12 6.04c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.58l3.35 2.58C7.2 7.8 9.4 6.04 12 6.04Z" />
    </svg>
  );
}

export function PasswordlessAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [step, setStep] = React.useState<Step>("identifier");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [code, setCode] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [legalAccepted, setLegalAccepted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const needsFirstName = signUp.missingFields.includes("first_name");
  const needsLastName = signUp.missingFields.includes("last_name");
  const needsLegal = signUp.missingFields.includes("legal_accepted");
  const needsInternalPassword = signUp.missingFields.includes("password");

  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("email");
    if (requested) setEmailAddress(requested);
  }, []);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  };

  const navigateToApp = async (kind: "sign-in" | "sign-up") => {
    const target = safeDestination();
    const navigate = ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
      const url = decorateUrl(target);
      if (url.startsWith("http")) window.location.href = url;
      else router.replace(url);
    };

    const result =
      kind === "sign-in"
        ? await signIn.finalize({ navigate })
        : await signUp.finalize({ navigate });

    if (result.error) setError(readableError(result.error));
    else router.refresh();
  };

  const handleGoogle = () =>
    run(async () => {
      const target = safeDestination();
      const redirectCallbackUrl = window.location.pathname;
      const result =
        mode === "sign-up"
          ? await signUp.sso({
              strategy: "oauth_google",
              redirectUrl: target,
              redirectCallbackUrl,
            })
          : await signIn.sso({
              strategy: "oauth_google",
              redirectUrl: target,
              redirectCallbackUrl,
            });
      if (result.error) setError(readableError(result.error));
    });

  const handleIdentifier = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const created = await signIn.create({
        identifier: emailAddress.trim(),
        signUpIfMissing: true,
      });
      if (created.error) {
        setError(readableError(created.error));
        return;
      }

      const sent = await signIn.emailCode.sendCode();
      if (sent.error) {
        setError(readableError(sent.error));
        return;
      }

      setStep("code");
      setNotice(`We sent a one-time code to ${emailAddress.trim()}.`);
    });
  };

  const handleTransfer = async () => {
    const transferred = await signUp.create({ transfer: true });
    if (transferred.error) {
      setError(readableError(transferred.error));
      return;
    }

    if (signUp.status === "complete") {
      await navigateToApp("sign-up");
    } else if (signUp.status === "missing_requirements") {
      setStep("complete-profile");
      setNotice("Your email is verified. Add a few details to finish your account.");
    } else {
      setError("We could not finish creating your account. Please start over.");
    }
  };

  const handleCode = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      if (step === "mfa") {
        const verified = await signIn.mfa.verifyEmailCode({ code: code.trim() });
        if (verified.error) {
          setError(readableError(verified.error));
          return;
        }
        if (signIn.status === "complete") await navigateToApp("sign-in");
        else setError("Additional verification is still required.");
        return;
      }

      const verified = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (verified.error) {
        if (
          isClerkAPIResponseError(verified.error) &&
          verified.error.errors[0]?.code === "sign_up_if_missing_transfer"
        ) {
          await handleTransfer();
          return;
        }
        setError(readableError(verified.error));
        return;
      }

      if (signIn.status === "complete") {
        await navigateToApp("sign-in");
      } else if (
        signIn.status === "needs_second_factor" &&
        signIn.supportedSecondFactors.some((factor) => factor.strategy === "email_code")
      ) {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) {
          setError(readableError(sent.error));
          return;
        }
        setStep("mfa");
        setNotice("One more step — we sent a security code to your email.");
      } else if (signIn.status === "needs_client_trust") {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) {
          setError(readableError(sent.error));
          return;
        }
        setStep("mfa");
        setNotice("New device detected. Confirm with the code we sent to your email.");
      } else {
        setError("We could not complete sign-in. Please start over.");
      }
    });
  };

  const handleResend = () =>
    run(async () => {
      const sent = await signIn.emailCode.sendCode();
      if (sent.error) setError(readableError(sent.error));
      else setNotice("A fresh code is on its way.");
    });

  const handleCompleteProfile = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      if (needsLegal && !legalAccepted) {
        setError("Please accept the terms to continue.");
        return;
      }

      // Some Clerk instances still mark password as a required field even when
      // the product is passwordless. Satisfy it with an unguessable, never-shown
      // value so the user's only sign-in methods remain Google and email code.
      if (needsInternalPassword) {
        const secret =
          window.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 24) ??
          `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
        const passwordResult = await signUp.password({ password: secret });
        if (passwordResult.error) {
          setError(readableError(passwordResult.error));
          return;
        }
      }

      const updated = await signUp.update({
        ...(needsFirstName && firstName.trim() ? { firstName: firstName.trim() } : {}),
        ...(needsLastName && lastName.trim() ? { lastName: lastName.trim() } : {}),
        ...(needsLegal ? { legalAccepted } : {}),
      });
      if (updated.error) {
        setError(readableError(updated.error));
        return;
      }
      if (signUp.status === "complete") await navigateToApp("sign-up");
      else setError("A few details are still missing from your account.");
    });
  };

  const handleStartOver = () =>
    run(async () => {
      await signIn.reset();
      await signUp.reset();
      setStep("identifier");
      setCode("");
      setNotice(null);
    });

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface-2 text-sm font-bold text-white transition-colors hover:border-accent/60 hover:bg-[#1b2740] disabled:opacity-50"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      {step === "identifier" && (
        <form onSubmit={handleIdentifier} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Email me a code
          </Button>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <ShieldCheck className="size-3.5 text-teal" /> No passwords. No magic links. Just a one-time code.
          </p>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCode} className="space-y-4">
          <div>
            <Label htmlFor="code">One-time code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="6-digit code"
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            Verify and continue
          </Button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={handleResend} disabled={busy} className="inline-flex items-center gap-1.5 font-semibold text-slate-400 hover:text-accent">
              <RefreshCw className="size-3.5" /> Resend code
            </button>
            <button type="button" onClick={handleStartOver} disabled={busy} className="font-semibold text-slate-400 hover:text-accent">
              Use another email
            </button>
          </div>
        </form>
      )}

      {step === "mfa" && (
        <form onSubmit={handleCode} className="space-y-4">
          <div>
            <Label htmlFor="mfa-code">Security code</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="6-digit code"
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Confirm and continue
          </Button>
        </form>
      )}

      {step === "complete-profile" && (
        <form onSubmit={handleCompleteProfile} className="space-y-4">
          {needsFirstName && (
            <div>
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>
          )}
          {needsLastName && (
            <div>
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" required value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
          )}
          {needsLegal && (
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3 text-xs text-slate-300">
              <input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} className="mt-0.5 size-4 accent-[#f2a65a]" />
              I agree to the terms of service and privacy policy.
            </label>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Create my account
          </Button>
        </form>
      )}

      {notice && <p className="rounded-xl border border-teal/25 bg-teal/8 p-3 text-xs text-teal">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral">{error}</p>}

      <div id="clerk-captcha" />

      <p className="text-center text-xs text-slate-500">
        {mode === "sign-in" ? "New to Kelma?" : "Already learning with Kelma?"}{" "}
        <Link href={mode === "sign-in" ? "/sign-up" : "/sign-in"} className="font-bold text-accent hover:underline">
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
