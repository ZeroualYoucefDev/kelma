import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { appConfig } from "@/lib/config";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0 grid-glow" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[140px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-surface/70 shadow-2xl backdrop-blur-xl md:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-line bg-gradient-to-br from-accent/12 via-surface to-teal/12 p-10 md:flex">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
            <span className="grid size-8 place-items-center rounded-xl bg-accent text-ink">
              <Sparkles className="size-4" />
            </span>
            {appConfig.name}
          </Link>
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              Your next language is one small lesson away.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Passwordless by design. Google or a one-time email code — then straight into your dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <ShieldCheck className="size-4" /> Verified accounts only
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-accent"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <h1 className="font-display text-2xl font-extrabold">{title}</h1>
          <p className="mb-7 mt-2 text-sm text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/8 p-5 text-sm leading-relaxed text-gold">
      <strong className="block font-display text-base">Clerk keys are not configured.</strong>
      Add <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
      <code className="rounded bg-black/30 px-1">CLERK_SECRET_KEY</code> to <code>.env.local</code> to enable
      Google SSO and one-time email codes. Enable those providers in the Clerk dashboard.
    </div>
  );
}
