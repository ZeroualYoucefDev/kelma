import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  Crown,
  Flame,
  Globe2,
  HeartPulse,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { HeroDemo, type HeroPair } from "@/components/marketing/hero-demo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getViewer } from "@/lib/auth";
import { appConfig } from "@/lib/config";
import { getLanguages } from "@/services/languages";
import { translateBatch } from "@/services/translation";
import { getWordPoolSize, getWordsForLesson } from "@/services/words";

export const dynamic = "force-dynamic";

async function loadHero() {
  try {
    const words = await getWordsForLesson("landing-hero", 6);
    const translated = await translateBatch(words, "en", "es");
    return translated
      .filter((item): item is HeroPair => Boolean(item.translated))
      .map((item) => ({ source: item.source, translated: item.translated }));
  } catch {
    return [] as HeroPair[];
  }
}

export default async function LandingPage() {
  const viewer = await getViewer();
  if (viewer && !viewer.isPreview && viewer.verified) redirect("/learn");

  const [pairs, languages, poolSize] = await Promise.all([
    loadHero(),
    getLanguages().catch(() => []),
    getWordPoolSize().catch(() => 0),
  ]);

  const features = [
    {
      icon: Radio,
      title: "Really live content",
      body: "Every word, translation and pronunciation is pulled from public language APIs at runtime. No stale, bundled word lists.",
      tone: "text-lime",
    },
    {
      icon: BookOpenText,
      title: "Winding skill paths",
      body: "Sequential units unfold into bite-sized lessons that adapt as you grow, with listening, reverse and meaning drills.",
      tone: "text-violet",
    },
    {
      icon: HeartPulse,
      title: "Hearts that matter",
      body: "Mistakes cost a heart, patience refills them, and Pro learners never run dry. Every choice has a consequence.",
      tone: "text-rose",
    },
    {
      icon: Flame,
      title: "Streaks worth keeping",
      body: "Daily XP, streak freezes and quests turn a five-minute habit into a language you actually keep.",
      tone: "text-gold",
    },
    {
      icon: Crown,
      title: "Pro without friction",
      body: "Unlock unlimited hearts and 1.5× XP with Chargily Pay — CIB and Edahabia cards, paid in DZD.",
      tone: "text-gold",
    },
    {
      icon: Zap,
      title: "Native-sounding audio",
      body: "Listening prompts are spoken by your device's own voices in the target language, instantly and offline-friendly.",
      tone: "text-lime",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] grid-glow" />
      <div className="pointer-events-none absolute -left-40 top-20 size-[420px] rounded-full bg-lime/8 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-72 size-[460px] rounded-full bg-violet/10 blur-[130px]" />

      <Navbar />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-36 lg:grid-cols-2 lg:gap-10 lg:pt-44">
          <div>
            <Badge variant="lime" className="mb-6">
              <Sparkles className="size-3" /> Powered by live language data
            </Badge>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Learn a language.
              <br />
              <span className="text-gradient">One tiny victory</span>
              <br />
              at a time.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-400">
              {appConfig.name} builds a personal, gamified curriculum from real translation and
              dictionary services — so every lesson is fresh, meaningful and impossible to memorise by rote.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start learning free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/sign-in">I already have an account</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
              <span>✓ No passwords</span>
              <span>✓ Google, email or phone</span>
              <span>{poolSize > 0 ? `✓ ${poolSize.toLocaleString()} live words` : "✓ Live vocabulary"}</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroDemo pairs={pairs} language="Spanish" locale="es-ES" />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime">Why Lumio</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Built for momentum, not memorisation.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-line bg-surface/60 p-6 transition-all hover:-translate-y-1 hover:border-lime/40 hover:bg-surface"
              >
                <feature.icon className={`size-7 ${feature.tone}`} />
                <h3 className="mt-5 font-display text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-line/70 bg-surface/40 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-4xl font-extrabold">Three steps to your first conversation.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { n: "01", title: "Pick your language", body: "Choose a target from the live catalogue. Names come from an ISO dataset, not a hardcoded list." },
                { n: "02", title: "Follow the path", body: "Work through winding units built from the open vocabulary dataset, one tiny lesson at a time." },
                { n: "03", title: "Protect your streak", body: "Earn XP and gems, refill hearts, and stay consistent with freezes and daily quests." },
              ].map((step) => (
                <div key={step.n} className="rounded-2xl border border-line bg-ink/60 p-7">
                  <span className="font-display text-5xl font-extrabold text-lime/25">{step.n}</span>
                  <h3 className="mt-3 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="languages" className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-violet">
                <Globe2 className="size-4" /> Languages
              </p>
              <h2 className="mt-3 font-display text-4xl font-extrabold">Go where curiosity takes you.</h2>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              Language names are resolved at runtime from a public ISO-639 dataset.
            </p>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            {languages.map((language) => (
              <div
                key={language.code}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-4 py-3 text-sm font-semibold text-slate-200"
              >
                <span className="text-xl">{language.emoji}</span>
                {language.name}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-lime/25 bg-gradient-to-br from-lime/15 via-surface to-violet/15 p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 grid-glow opacity-60" />
            <div className="relative">
              <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Your streak starts today.</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                No passwords, no credit card, no bundled placeholders — just a real lesson built from live data.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/sign-up">
                  Create your account <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-slate-500">
          <span className="font-display font-bold text-slate-300">{appConfig.name}.</span>
          <span>{appConfig.tagline}</span>
          <span>© {new Date().getFullYear()} {appConfig.name}</span>
        </div>
      </footer>
    </div>
  );
}
