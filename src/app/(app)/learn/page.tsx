import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Heart, Sparkles, Trophy } from "lucide-react";
import { UnitPath } from "@/components/app/unit-path";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getViewer } from "@/lib/auth";
import { completedLessonKeys, getPlayer, getProgressFor } from "@/lib/data";
import { levelFromXp, refillHearts } from "@/lib/gamification";
import { buildCurriculum } from "@/services/curriculum";
import type { CurriculumPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const [player, storedProgress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);
  const progress = {
    ...storedProgress,
    ...refillHearts(storedProgress.hearts, storedProgress.heartsUpdatedAt),
  };
  const level = levelFromXp(progress.xp);

  let curriculum: CurriculumPlan;
  let completed: string[];
  try {
    [curriculum, completed] = await Promise.all([
      buildCurriculum(player.sourceLanguage, player.targetLanguage),
      completedLessonKeys(viewer.id),
    ]);
  } catch (error) {
    return (
      <div className="rounded-3xl border border-coral/30 bg-coral/[0.07] p-6">
        <h1 className="font-display text-xl font-extrabold text-coral">Live curriculum unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">
          {error instanceof Error ? error.message : "The upstream language dataset did not respond."}
        </p>
        <p className="mt-2 text-xs text-muted">Refresh to retry — lesson content is never faked.</p>
      </div>
    );
  }

  const heartsZero = progress.hearts <= 0 && player.plan !== "pro";
  const nextLesson = curriculum.units
    .flatMap((unit) => unit.lessons)
    .find((lesson) => !completed.includes(lesson.id));

  return (
    <div className="space-y-12">
      <section className="animate-slide-up">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface/60 p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-violet/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 size-64 rounded-full bg-teal/10 blur-3xl" />

          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="pill border-accent/30 bg-accent/10 text-accent">
                  <Sparkles className="size-3.5" /> Your learning studio
                </span>
                <span className="pill text-muted">
                  {curriculum.target.emoji} Learning {curriculum.target.name}
                </span>
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Hey {player.name.split(" ")[0]} — let&apos;s make
                <span className="text-gradient"> words stick.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                {curriculum.totalWords.toLocaleString()} live words from the open dataset, arranged into
                bite-sized cards. Pick a card, hear the exact locale, and keep your streak alive.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {nextLesson && !heartsZero ? (
                  <Button asChild size="lg">
                    <Link href={`/lesson/${nextLesson.id}`}>
                      Continue learning <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" variant={heartsZero ? "destructive" : "default"}>
                    <Link href="/shop">
                      <Heart className="size-4" /> {heartsZero ? "Refill hearts" : "Browse the shop"}
                    </Link>
                  </Button>
                )}
                <Button asChild variant="secondary" size="lg">
                  <Link href="/units">Explore units</Link>
                </Button>
              </div>
            </div>

            <div className="w-full rounded-3xl border border-line bg-ink/40 p-5 sm:w-64">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-extrabold">
                  <Trophy className="size-4 text-gold" /> Level {level.level}
                </span>
                <span className="text-xs font-bold text-muted">{progress.xp} XP</span>
              </div>
              <Progress
                value={(level.intoLevel / level.needed) * 100}
                className="mt-4 h-2"
                indicatorClassName="bg-gradient-to-r from-accent to-teal"
              />
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-white/5 p-2.5">
                  <p className="font-display text-lg font-extrabold text-gold">{progress.streak}</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                    <Flame className="size-3" /> Day streak
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5">
                  <p className="font-display text-lg font-extrabold text-coral">
                    {player.plan === "pro" ? "∞" : progress.hearts}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                    <Heart className="size-3" /> Hearts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {heartsZero && (
          <div className="animate-pop mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/[0.08] p-4">
            <p className="text-sm font-semibold text-coral">
              Lessons are paused until you refill your hearts or go Pro.
            </p>
            <Button asChild size="sm" variant="destructive">
              <Link href="/shop">Refill now</Link>
            </Button>
          </div>
        )}
      </section>

      <UnitPath curriculum={curriculum} completedLessons={completed} />
    </div>
  );
}
