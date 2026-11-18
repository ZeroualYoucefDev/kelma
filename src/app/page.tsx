import Link from "next/link";
import { redirect } from "next/navigation";
import { Glyph, type GlyphName } from "@/components/brand/glyphs";
import { Navbar } from "@/components/marketing/navbar";
import { HeroDemo, type HeroPair } from "@/components/marketing/hero-demo";
import { KelmaWordmark } from "@/components/brand/kelma-mark";
import { LanguageSigil } from "@/components/brand/language-sigil";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getLanguages } from "@/services/languages";
import { translateBatch } from "@/services/translation";
import { getWordPoolSize, getWordsForLesson } from "@/services/words";

export const dynamic = "force-dynamic";

async function loadHero(): Promise<HeroPair[]> {
  try {
    const words = await getWordsForLesson("landing-hero", 6);
    const translated = await translateBatch(words, "en", "es");
    return translated.flatMap((item) =>
      item.translated ? [{ source: item.source, translated: item.translated }] : [],
    );
  } catch {
    return [];
  }
}

const features: Array<{ glyph: GlyphName; title: string; body: string; tone: string }> = [
  {
    glyph: "map",
    title: "Choose freely",
    body: "Native language, target language, daily rhythm — you pick all three. No defaults making decisions for you.",
    tone: "text-violet",
  },
  {
    glyph: "sound",
    title: "Audio that matches",
    body: "Listening prompts use the exact locale of the language you are learning: es-ES, fr-FR, tr-TR and beyond.",
    tone: "text-teal",
  },
  {
    glyph: "heart",
    title: "Hearts with weight",
    body: "A wrong answer costs one heart instantly, with a honest nudge and a database-synced lockout at zero.",
    tone: "text-coral",
  },
  {
    glyph: "spark",
    title: "Content that is alive",
    body: "Words, translations and definitions come from open APIs at runtime, so every session is genuinely fresh.",
    tone: "text-accent",
  },
  {
    glyph: "flame",
    title: "Momentum, not marathons",
    body: "Tiny cards, quick wins, gems, streaks and freezes make a five-minute habit feel like a game.",
    tone: "text-gold",
  },
  {
    glyph: "shield",
    title: "No passwords, ever",
    body: "Google, a magic link in your inbox, or a one-time code on your phone. That is the whole door.",
    tone: "text-white",
  },
];

const steps = [
  {
    n: "01",
    title: "Say who you are",
    body: "Choose the language you already speak. Every target stays unlocked.",
  },
  {
    n: "02",
    title: "Pick a new world",
    body: "Choose what you want to learn next. The audio locale follows your choice instantly.",
  },
  {
    n: "03",
    title: "Set your rhythm",
    body: "Pick a daily goal you can actually keep. Then your first cards appear.",
  },
];

export default async function LandingPage() {
  const viewer = await getViewer();
  if (viewer && !viewer.isPreview && viewer.verified) redirect("/learn");

  const [pairs, languages, poolSize] = await Promise.all([
    loadHero(),
    getLanguages().catch(() => []),
    getWordPoolSize().catch(() => 0),
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] grid-glow" />
      <div className="pointer-events-none absolute inset-0 aurora opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-44 size-[420px] rounded-full bg-violet/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 top-96 size-[460px] rounded-full bg-teal/10 blur-[140px]" />

      <Navbar />

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-16 px-5 pb-28 pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:pt-44">
          <div className="animate-slide-up">
            <div className="mb-7 flex flex-wrap items-center gap-2">
              <span className="pill border-accent/30 bg-accent/10 text-accent">
                <Glyph name="spark" className="size-3.5" /> A language studio, not a drill factory
              </span>
              <span className="pill text-muted">
                <Glyph name="bolt" className="size-3.5 text-gold" /> {poolSize > 0 ? `${poolSize.toLocaleString()} live words` : "Live vocabulary"}
              </span>
            </div>

            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Words that stick.
              <br />
              <span className="text-gradient">Any language</span>
              <br />
              you choose.
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              kelma turns live translation, dictionary and voice data into tiny, playful lessons —
              built around the languages you pick, never a preset path.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start learning free <Glyph name="arrow" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/sign-in">I already have an account</Link>
              </Button>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-bold text-muted">
              {["Google SSO", "Email magic link", "Phone OTP", "3-step setup"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Glyph name="check" className="size-3.5 text-accent" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute -left-8 top-10 hidden animate-float-slow rounded-2xl border border-violet/30 bg-surface/80 px-4 py-2.5 text-xs font-extrabold text-violet backdrop-blur-xl sm:block">
              locale: es-ES
            </div>
            <div className="absolute -right-4 bottom-12 hidden animate-float rounded-2xl border border-coral/30 bg-surface/80 px-4 py-2.5 text-xs font-extrabold text-coral backdrop-blur-xl sm:block">
              <span className="flex items-center gap-2">
                hearts: 5 <Glyph name="heart" className="size-4 text-coral" />
              </span>
            </div>
            <HeroDemo
              pairs={pairs}
              language="Spanish"
              sourceLocale="en-US"
              targetLocale="es-ES"
            />
          </div>
        </section>

        <section id="why-kelma" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-accent">
                Why kelma feels different
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Playful on the surface. Serious underneath.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Every interaction is designed to feel light — while the state machine, locale matching
              and payment flow stay uncompromisingly real.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-lift group rounded-3xl border border-line bg-surface/60 p-6"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-white/5">
                  <Glyph name={feature.glyph} className={`size-5 ${feature.tone}`} />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-line/60 bg-surface/30 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Your first lesson is three choices away.
              </h2>
              <span className="pill border-accent/25 bg-accent/10 text-accent">
                No defaults. No skipping.
              </span>
            </div>

            <div className="mt-11 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.n}
                  className="relative overflow-hidden rounded-3xl border border-line bg-ink/50 p-7"
                >
                  <div className="absolute -right-8 -top-8 size-28 rounded-full bg-violet/10 blur-2xl" />
                  <span className="font-display text-5xl font-extrabold text-white/10">{step.n}</span>
                  <h3 className="mt-2 font-display text-xl font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                  {index < steps.length - 1 && (
                    <Glyph name="arrow" className="absolute -right-4 top-1/2 hidden size-5 text-muted md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="languages" className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.22em] text-teal">
                <Glyph name="map" className="size-4" /> Language catalogue
              </p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Go where curiosity takes you.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Names resolve at runtime from a public ISO-639 dataset. Every option is yours to choose —
              as a native language or a target.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {languages.map((language) => (
              <div
                key={language.code}
                className="pill gap-2 px-4 py-3 text-sm text-slate-200 transition-transform hover:-translate-y-1"
              >
                <LanguageSigil code={language.code} className="size-7" />
                {language.name}
                <span className="text-[10px] text-muted">{language.locale}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-accent/25 bg-gradient-to-br from-accent/15 via-surface to-violet/15 p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 grid-glow opacity-70" />
            <div className="relative">
              <div className="mx-auto mb-6 w-fit">
                <KelmaWordmark />
              </div>
              <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                Your streak starts today.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
                No passwords, no bundled word lists, no borrowed mascot. Just a real lesson built
                around the languages you actually want.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/sign-up">
                  Create your account <Glyph name="arrow" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-xs font-semibold text-muted">
          <span className="font-display text-sm font-extrabold text-white">kelma.</span>
          <span>Words that stick. Any language you choose.</span>
          <span>© {new Date().getFullYear()} kelma</span>
        </div>
      </footer>
    </div>
  );
}
