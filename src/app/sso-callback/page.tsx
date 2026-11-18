"use client";

import { HandleSSOCallback } from "@clerk/nextjs";
import { KelmaMark } from "@/components/brand/kelma-mark";

/**
 * Google SSO lands here. Clerk's handler owns finalization and transfer
 * logic; sending everyone to /onboarding keeps the strict three-step setup
 * in front of every new account. Completed learners are redirected onward by
 * the onboarding page itself.
 */
export default function SSOCallbackPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-5">
      <div className="pointer-events-none absolute inset-0 grid-glow" />
      <div className="pointer-events-none absolute inset-0 aurora opacity-80" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-line bg-surface/80 p-9 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto w-fit animate-float">
          <KelmaMark className="size-14" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
          Signing you in…
        </h1>
        <p className="mt-2 text-sm text-muted">
          Finishing your Google handshake, then we&apos;ll set up your languages.
        </p>
        <div id="clerk-captcha" />
      </div>

      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => {
          const destination = decorateUrl("/onboarding");
          window.location.assign(/^https?:\/\//i.test(destination) ? destination : "/onboarding");
        }}
        navigateToSignIn={() => window.location.assign("/sign-in")}
        navigateToSignUp={() => window.location.assign("/sign-up")}
      />
    </main>
  );
}
