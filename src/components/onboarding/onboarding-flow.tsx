"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Globe2,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { completeOnboarding } from "@/actions/onboarding";
import { KelmaMark } from "@/components/brand/kelma-mark";
import { Button } from "@/components/ui/button";
import { DAILY_GOALS } from "@/lib/onboarding";
import type { Language } from "@/services/languages";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "native", label: "Native", title: "What language feels like home?", kicker: "Step one · your starting point" },
  { key: "target", label: "Target", title: "What do you want to learn?", kicker: "Step two · your new world" },
  { key: "goal", label: "Rhythm", title: "How much time fits your day?", kicker: "Step three · your pace" },
] as const;

type StepIndex = 0 | 1 | 2;

function LanguageCard({
  language,
  active,
  badge,
  onSelect,
}: {
  language: Language;
  active: boolean;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "card-lift group relative flex min-h-[86px] items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left",
        active
          ? "border-accent bg-accent/[0.09] shadow-[0_0_0_2px_rgba(199,255,92,0.12)]"
          : "border-line bg-surface/60 hover:border-violet/50 hover:bg-surface-2/70",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl text-2xl transition-transform group-hover:scale-110",
          active ? "bg-accent/15" : "bg-white/5",
        )}
      >
        {language.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-white">{language.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          {language.code} · {language.locale}
        </span>
        {badge && <span className="mt-1 block text-[10px] font-bold text-gold">{badge}</span>}
      </span>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-all",
          active ? "border-accent bg-accent text-[#171438]" : "border-line text-transparent",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}

export function OnboardingFlow({
  languages,
  name,
}: {
  languages: Language[];
  name: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);
  const [query, setQuery] = useState("");
  const [native, setNative] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery("");
    setError(null);
  }, [step]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return languages.filter((language) =>
      `${language.name} ${language.code} ${language.locale}`.toLowerCase().includes(needle),
    );
  }, [languages, query]);

  const nativeLanguage = languages.find((language) => language.code === native);
  const targetLanguage = languages.find((language) => language.code === target);
  const sameLanguage = Boolean(native && target && native === target);

  const canContinue =
    step === 0
      ? Boolean(native)
      : step === 1
        ? Boolean(target) && !sameLanguage
        : goal !== null;

  function goTo(next: StepIndex) {
    setError(null);
    setStep(next);
  }

  async function finish() {
    if (!native || !target || goal === null || sameLanguage) return;
    setBusy(true);
    setError(null);
    try {
      const result = await completeOnboarding({
        nativeLanguage: native,
        targetLanguage: target,
        dailyGoalMinutes: goal,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.replace("/learn");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your choices.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 grid-glow" />
      <div className="pointer-events-none absolute inset-0 aurora opacity-80" />
      <div className="pointer-events-none absolute -left-36 top-1/4 size-[420px] rounded-full bg-violet/10 blur-[130px]" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-6 sm:px-8 sm:py-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <KelmaWordmark />

          <div className="flex items-center gap-3">
            <span className="pill border-accent/25 bg-accent/10 text-accent">
              <Sparkles className="size-3.5" /> Three quick choices
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">
              {step + 1} / {STEPS.length}
            </span>
          </div>
        </header>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent via-teal to-violet transition-[width] duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {STEPS.map((item, index) => (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-extrabold",
                  index === step && "border-accent bg-accent text-[#171438]",
                  index < step && "border-teal bg-teal/15 text-teal",
                  index > step && "border-line text-muted",
                )}
              >
                {index < step ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-[10px] font-extrabold uppercase tracking-wider",
                  index === step ? "text-accent" : index < step ? "text-teal" : "text-muted",
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <main key={step} className="animate-slide-up mt-10 flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-accent">
                {STEPS[step].kicker}
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {STEPS[step].title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                {step === 0 &&
                  `Hey ${name.split(" ")[0] || "learner"} — start with the language you already think in.`}
                {step === 1 &&
                  "Every language is available. Pick the one you want your first cards to speak."}
                {step === 2 && "Small and steady beats rare and intense. You can change this later."}
              </p>
            </div>

            {nativeLanguage && step > 0 && (
              <span className="pill border-violet/30 bg-violet/10 text-white">
                {nativeLanguage.emoji} {nativeLanguage.name}
              </span>
            )}
          </div>

          {step !== 2 && (
            <div className="relative mb-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={step === 0 ? "Find your native language" : "Find a language to learn"}
                aria-label="Search languages"
                className="h-12 w-full rounded-2xl border border-line bg-surface/70 pl-11 pr-4 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
          )}

          {(step === 0 || step === 1) && (
            <>
              <div className="grid max-h-[46vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((language) => {
                  const active = (step === 0 ? native : target) === language.code;
                  const badge = step === 1 && language.code === native ? "Your native language" : undefined;
                  return (
                    <LanguageCard
                      key={language.code}
                      language={language}
                      active={active}
                      badge={badge}
                      onSelect={() => {
                        setError(null);
                        if (step === 0) setNative(language.code);
                        else setTarget(language.code);
                      }}
                    />
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-line bg-surface/60 p-8 text-center">
                  <Globe2 className="mx-auto size-6 text-muted" />
                  <p className="mt-3 text-sm text-muted">No language matches “{query}”.</p>
                </div>
              )}

              {sameLanguage && (
                <p className="animate-pop mt-4 rounded-xl border border-gold/30 bg-gold/[0.07] p-3 text-sm font-semibold text-gold">
                  That&apos;s already your native language. Choose a different target to continue.
                </p>
              )}
            </>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {DAILY_GOALS.map((item, index) => {
                const active = goal === item.minutes;
                return (
                  <button
                    key={item.minutes}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setError(null);
                      setGoal(item.minutes);
                    }}
                    className={cn(
                      "card-lift group flex min-h-[128px] items-start gap-4 rounded-3xl border p-6 text-left",
                      active
                        ? "border-accent bg-accent/[0.09] shadow-[0_0_0_2px_rgba(199,255,92,0.12)]"
                        : "border-line bg-surface/60 hover:border-teal/50 hover:bg-surface-2/70",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-12 shrink-0 place-items-center rounded-2xl text-xl transition-transform group-hover:scale-110",
                        active ? "bg-accent text-[#171438]" : "bg-white/5 text-teal",
                      )}
                    >
                      {["🌱", "⚡", "🔥", "🚀"][index]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
                        {item.minutes} min <span className="text-sm font-bold text-muted">/ day</span>
                      </span>
                      <span className="mt-1 block text-sm font-extrabold text-accent">{item.label}</span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                        {item.description}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border",
                        active ? "border-accent bg-accent text-[#171438]" : "border-line text-transparent",
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && nativeLanguage && targetLanguage && goal !== null && (
            <div className="animate-pop mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/50 p-5">
              <span className="pill border-teal/30 bg-teal/10 text-teal">Your path</span>
              <span className="text-sm font-extrabold text-white">
                {nativeLanguage.emoji} {nativeLanguage.name}
              </span>
              <ArrowRight className="size-4 text-muted" />
              <span className="text-sm font-extrabold text-white">
                {targetLanguage.emoji} {targetLanguage.name}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-muted">
                <Clock3 className="size-3.5 text-gold" /> {goal} min a day
              </span>
            </div>
          )}
        </main>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => goTo((step - 1) as StepIndex)}
            disabled={step === 0 || busy}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-4">
            {error && (
              <p role="alert" className="max-w-[280px] text-xs font-semibold text-coral">
                {error}
              </p>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => goTo((step + 1) as StepIndex)} disabled={!canContinue}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={finish} disabled={!canContinue || busy}>
                {busy && <LoaderCircle className="size-4 animate-spin" />}
                Open my studio <Sparkles className="size-4" />
              </Button>
            )}
          </div>
        </footer>

        <p className="mt-4 text-center text-[11px] text-muted">
          Your avatar stays yours — pick it any time in Profile or Settings.
        </p>
      </div>
    </div>
  );
}

function KelmaWordmark() {
  return (
    <div className="flex items-center gap-2">
      <KelmaMark className="size-9 drop-shadow-[0_6px_14px_rgba(139,123,255,0.35)]" />
      <span className="font-display text-xl font-extrabold tracking-tight text-white">
        kelma<span className="text-accent">.</span>
      </span>
    </div>
  );
}
