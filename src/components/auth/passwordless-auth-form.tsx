"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Mode = "sign-in" | "sign-up";
type Method = "email" | "phone";
type Step = "entry" | "code" | "mfa" | "email-sent" | "complete-profile";

export const AUTH_FLOW_KEY = "kelma:auth-flow";
export type EmailLinkFlow = "signin-email" | "signup-email";

const DEFAULT_DESTINATION = "/onboarding";

function safeDestination() {
  if (typeof window === "undefined") return DEFAULT_DESTINATION;
  const requested = new URLSearchParams(window.location.search).get("redirect_url");
  return requested && requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : DEFAULT_DESTINATION;
}

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
    (candidate?.code ? `Authentication failed (${candidate.code}).` : undefined) ||
    "Something went wrong. Please try again."
  );
}

function generateHiddenSecret() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
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

export function AuthProfileCompletion({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const { signUp } = useSignUp();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [legalAccepted, setLegalAccepted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const needsFirstName = signUp.missingFields.includes("first_name");
  const needsLastName = signUp.missingFields.includes("last_name");
  const needsLegal = signUp.missingFields.includes("legal_accepted");
  const needsInternalPassword = signUp.missingFields.includes("password");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (needsLegal && !legalAccepted) {
        setError("Please accept the terms to continue.");
        return;
      }

      // Some Clerk instances still require a password field. The user never
      // sees it; an unguessable value keeps this a passwordless product.
      if (needsInternalPassword) {
        const result = await signUp.password({ password: generateHiddenSecret() });
        if (result.error) {
          setError(readableError(result.error));
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

      if (signUp.status !== "complete") {
        setError("A few details are still missing. Please check the form and try again.");
        return;
      }

      const finalized = await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl(DEFAULT_DESTINATION);
          if (/^https?:\/\//i.test(url)) window.location.assign(url);
          else router.replace(url);
        },
      });
      if (finalized.error) setError(readableError(finalized.error));
      else onDone?.();
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {needsFirstName && (
        <div>
          <Label htmlFor="completion-first-name">First name</Label>
          <Input
            id="completion-first-name"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
      )}
      {needsLastName && (
        <div>
          <Label htmlFor="completion-last-name">Last name</Label>
          <Input
            id="completion-last-name"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      )}
      {needsLegal && (
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-3 text-xs leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(event) => setLegalAccepted(event.target.checked)}
            className="mt-0.5 size-4 accent-[#c7ff5c]"
          />
          I agree to the terms of service and privacy policy.
        </label>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Finish account
      </Button>
    </form>
  );
}

export function PasswordlessAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [method, setMethod] = React.useState<Method>("email");
  const [step, setStep] = React.useState<Step>("entry");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [code, setCode] = React.useState("");
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

  const finalize = async (resource: "signIn" | "signUp") => {
    const result = await (resource === "signIn" ? signIn : signUp).finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl(safeDestination());
        if (/^https?:\/\//i.test(url)) window.location.assign(url);
        else router.replace(url);
      },
    });
    if (result.error) setError(readableError(result.error));
    else router.refresh();
  };

  const handleGoogle = () =>
    run(async () => {
      const result = await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: safeDestination(),
        redirectCallbackUrl: "/sso-callback",
      });
      if (result.error) setError(readableError(result.error));
    });

  const handleEmail = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const email = emailAddress.trim();
      const verificationUrl = `${window.location.origin}/verify`;

      if (mode === "sign-in") {
        const created = await signIn.create({ identifier: email });
        if (created.error) {
          setError(readableError(created.error));
          return;
        }
        const sent = await signIn.emailLink.sendLink({ emailAddress: email, verificationUrl });
        if (sent.error) {
          setError(readableError(sent.error));
          return;
        }
        sessionStorage.setItem(AUTH_FLOW_KEY, "signin-email" satisfies EmailLinkFlow);
      } else {
        const created = await signUp.create({
          emailAddress: email,
          ...(needsLegal ? { legalAccepted } : {}),
        });
        if (created.error) {
          setError(readableError(created.error));
          return;
        }
        const sent = await signUp.verifications.sendEmailLink({ verificationUrl });
        if (sent.error) {
          setError(readableError(sent.error));
          return;
        }
        sessionStorage.setItem(AUTH_FLOW_KEY, "signup-email" satisfies EmailLinkFlow);
      }

      setStep("email-sent");
      setNotice(`We sent a secure sign-in link to ${email}. Open it on this device.`);
    });
  };

  const handlePhone = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const phone = phoneNumber.trim().startsWith("+") ? phoneNumber.trim() : `+${phoneNumber.trim()}`;

      if (mode === "sign-in") {
        const created = await signIn.create({ identifier: phone });
        if (created.error) {
          setError(readableError(created.error));
          return;
        }
        const sent = await signIn.phoneCode.sendCode({ phoneNumber: phone, channel: "sms" });
        if (sent.error) {
          setError(readableError(sent.error));
          return;
        }
      } else {
        const created = await signUp.create({
          phoneNumber: phone,
          ...(needsLegal ? { legalAccepted } : {}),
        });
        if (created.error) {
          setError(readableError(created.error));
          return;
        }
        const sent = await signUp.verifications.sendPhoneCode({ channel: "sms" });
        if (sent.error) {
          setError(readableError(sent.error));
          return;
        }
      }

      setStep("code");
      setNotice(`A one-time code is on its way to ${phone}.`);
    });
  };

  const handleCode = (event: React.FormEvent) => {
    event.preventDefault();
    return run(async () => {
      const value = code.trim();

      if (step === "mfa") {
        const verified = await signIn.mfa.verifyEmailCode({ code: value });
        if (verified.error) {
          setError(readableError(verified.error));
          return;
        }
        if (signIn.status === "complete") await finalize("signIn");
        else setError("Additional verification is still required.");
        return;
      }

      if (mode === "sign-in") {
        const verified = await signIn.phoneCode.verifyCode({ code: value });
        if (verified.error) {
          setError(readableError(verified.error));
          return;
        }

        if (signIn.status === "complete") {
          await finalize("signIn");
        } else if (
          signIn.status === "needs_second_factor" ||
          signIn.status === "needs_client_trust"
        ) {
          const sent = await signIn.mfa.sendEmailCode();
          if (sent.error) {
            setError(readableError(sent.error));
            return;
          }
          setStep("mfa");
          setNotice("One more step — we sent a security code to your email.");
        } else {
          setError("We could not complete sign-in. Please start over.");
        }
        return;
      }

      const verified = await signUp.verifications.verifyPhoneCode({ code: value });
      if (verified.error) {
        setError(readableError(verified.error));
        return;
      }
      if (signUp.status === "complete") await finalize("signUp");
      else if (signUp.status === "missing_requirements") setStep("complete-profile");
      else setError("We could not finish creating your account. Please start over.");
    });
  };

  const handleCompleteProfile = async () => {
    if (needsLegal && !legalAccepted) {
      setError("Please accept the terms to continue.");
      return;
    }

    if (needsInternalPassword) {
      const result = await signUp.password({ password: generateHiddenSecret() });
      if (result.error) {
        setError(readableError(result.error));
        return;
      }
    }

    const updated = await signUp.update({
      ...(needsFirstName && emailAddress.trim()
        ? { firstName: emailAddress.split("@")[0] }
        : {}),
      ...(needsLegal ? { legalAccepted } : {}),
    });
    if (updated.error) {
      setError(readableError(updated.error));
      return;
    }
    if (signUp.status === "complete") await finalize("signUp");
    else setError("A few details are still missing from your account.");
  };

  const handleStartOver = () =>
    run(async () => {
      await signIn.reset();
      await signUp.reset();
      setStep("entry");
      setCode("");
      setNotice(null);
    });

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface-2/70 px-5 py-3.5 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:border-violet/60 hover:bg-surface-2 disabled:opacity-50"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-line" /> or choose a passwordless route <span className="h-px flex-1 bg-line" />
      </div>

      {(step === "entry" || step === "email-sent") && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-ink/40 p-1.5">
          {(["email", "phone"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMethod(item);
                setStep("entry");
                setError(null);
                setNotice(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-colors ${
                method === item && step === "entry"
                  ? "bg-accent text-[#171438]"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {item === "email" ? <Mail className="size-3.5" /> : <Phone className="size-3.5" />}
              {item === "email" ? "Magic link" : "Phone OTP"}
            </button>
          ))}
        </div>
      )}

      {step === "entry" && method === "email" && (
        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <Label htmlFor="auth-email">Email address</Label>
            <Input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
            />
          </div>
          {mode === "sign-up" && (
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-3 text-xs leading-relaxed text-muted">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
                className="mt-0.5 size-4 accent-[#c7ff5c]"
              />
              I agree to the terms of service and privacy policy.
            </label>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Email me a magic link
          </Button>
        </form>
      )}

      {step === "entry" && method === "phone" && (
        <form onSubmit={handlePhone} className="space-y-4">
          <div>
            <Label htmlFor="auth-phone">Phone number</Label>
            <Input
              id="auth-phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+1 555 000 1234"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </div>
          {mode === "sign-up" && (
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-3 text-xs leading-relaxed text-muted">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
                className="mt-0.5 size-4 accent-[#c7ff5c]"
              />
              I agree to the terms of service and privacy policy.
            </label>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Phone className="size-4" />}
            Text me a one-time code
          </Button>
        </form>
      )}

      {step === "email-sent" && (
        <div className="animate-pop rounded-2xl border border-teal/25 bg-teal/[0.07] p-5 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal/15 text-teal">
            <Mail className="size-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-extrabold">Check your inbox</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Open the link on this device. We&apos;ll take you straight to the three-step setup.
          </p>
          <button
            type="button"
            onClick={handleStartOver}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-accent"
          >
            <RefreshCw className="size-3.5" /> Use another email
          </button>
        </div>
      )}

      {(step === "code" || step === "mfa") && (
        <form onSubmit={handleCode} className="space-y-4">
          <div>
            <Label htmlFor="auth-code">{step === "mfa" ? "Security code" : "One-time code"}</Label>
            <Input
              id="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={8}
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            Verify and continue
          </Button>
          <button
            type="button"
            onClick={handleStartOver}
            className="w-full text-center text-xs font-bold text-muted transition-colors hover:text-accent"
          >
            Start over
          </button>
        </form>
      )}

      {step === "complete-profile" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">A couple of final details before your first lesson.</p>
          <Button onClick={() => void run(handleCompleteProfile)} size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Create my account
          </Button>
        </div>
      )}

      {notice && (
        <p className="rounded-xl border border-teal/25 bg-teal/[0.07] p-3 text-xs leading-relaxed text-teal">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs leading-relaxed text-coral">
          {error}
        </p>
      )}

      <div id="clerk-captcha" />

      <p className="text-center text-xs text-muted">
        {mode === "sign-in" ? "New to kelma?" : "Already learning with kelma?"}{" "}
        <Link
          href={mode === "sign-in" ? "/sign-up" : "/sign-in"}
          className="font-extrabold text-accent hover:underline"
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </Link>
      </p>
      <p className="flex items-center justify-center gap-2 text-center text-[11px] text-muted">
        <ShieldCheck className="size-3.5 text-teal" /> No passwords. Google, magic link or phone code only.
      </p>
    </div>
  );
}
