import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { KelmaWordmark } from "@/components/brand/kelma-mark";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 grid-glow" />
      <div className="pointer-events-none absolute inset-0 aurora opacity-80" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/10 blur-[140px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-surface/70 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-gradient-to-br from-violet/15 via-surface to-teal/10 p-10 md:flex">
          <div className="pointer-events-none absolute -right-16 top-10 size-56 rounded-full bg-accent/10 blur-3xl" />
          <Link href="/" className="relative">
            <KelmaWordmark />
          </Link>

          <div className="relative">
            <span className="pill border-accent/25 bg-accent/10 text-accent">
              <Sparkles className="size-3.5" /> Passwordless by design
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight">
              Three choices.
              <br />
              <span className="text-gradient">Your language.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Pick what you speak, what you want to learn, and the rhythm that fits your life.
              kelma takes care of the rest with live words and locale-matched audio.
            </p>

            <div className="mt-8 space-y-3">
              {["Google account", "Email magic link", "Phone OTP"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-200">
                  <span className="grid size-6 place-items-center rounded-full bg-accent/15">
                    <Check className="size-3.5 text-accent" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-muted">
            No password field. No borrowed mascot. Just words that stick.
          </p>
        </div>

        <div className="relative p-6 sm:p-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-muted transition-colors hover:text-accent md:hidden"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>

          <div className="mb-8">
            <div className="mb-4 md:hidden">
              <KelmaWordmark />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}

export function SetupNotice() {
  return (
    <div className="rounded-2xl border border-gold/25 bg-gold/[0.07] p-5 text-sm leading-relaxed text-muted">
      Authentication keys are not configured. Add Clerk credentials to enable Google SSO,
      magic links and phone OTP.
    </div>
  );
}
