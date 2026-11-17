import Link from "next/link";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { UnitPath } from "@/components/app/unit-path";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor } from "@/lib/data";
import { levelFromXp } from "@/lib/gamification";
import { buildCurriculum } from "@/services/curriculum";
import type { CurriculumPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);
  const level = levelFromXp(progress.xp);

  let curriculum: CurriculumPlan;
  try {
    curriculum = await buildCurriculum(player.sourceLanguage, player.targetLanguage);
  } catch (error) {
    return (
      <div className="rounded-2xl border border-rose/30 bg-rose/8 p-6">
        <h1 className="font-display text-xl font-bold text-rose">Live curriculum unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">
          {error instanceof Error ? error.message : "The upstream language dataset did not respond."}
        </p>
        <p className="mt-2 text-xs text-slate-500">Refresh to retry — nothing is cached locally.</p>
      </div>
    );
  }

  return (
    <div>
      <section className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-lime">
            <Sparkles className="size-3.5" /> Your path
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Hey {player.name.split(" ")[0]} — ready to grow?
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            {curriculum.totalWords.toLocaleString()} live words from the open dataset, arranged into{" "}
            {curriculum.units.length} sequential units. Follow the nodes from left to right.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-line bg-surface/60 p-5 sm:w-64">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Trophy className="size-4 text-gold" /> Level {level.level}
            </span>
            <span className="text-xs font-semibold text-slate-500">{progress.xp} XP</span>
          </div>
          <Progress
            value={(level.intoLevel / level.needed) * 100}
            className="mt-3 h-2"
            indicatorClassName="bg-gradient-to-r from-lime to-violet"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            {level.needed - level.intoLevel} XP until level {level.level + 1}
          </p>
        </div>
      </section>

      <UnitPath curriculum={curriculum} completedLessons={progress.lessonsCompleted} />

      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/50 p-6">
        <div>
          <h3 className="font-display text-lg font-bold">Earn gems faster</h3>
          <p className="mt-1 text-sm text-slate-400">Complete lessons to unlock streak freezes and heart refills.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/shop">
            Visit the shop <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
