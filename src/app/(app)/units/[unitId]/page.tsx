import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor } from "@/lib/data";
import { buildCurriculum } from "@/services/curriculum";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const viewer = await getViewer();
  if (!viewer) return null;

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);
  const curriculum = await buildCurriculum(player.sourceLanguage, player.targetLanguage).catch(() => null);
  const unitIndex = curriculum?.units.findIndex((item) => item.id === unitId) ?? -1;
  if (!curriculum || unitIndex < 0) notFound();

  const unit = curriculum.units[unitIndex];
  const completedBefore = curriculum.units
    .slice(0, unitIndex)
    .reduce((sum, item) => sum + item.lessons.length, 0);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-6">
        <Link href="/units">
          <ArrowLeft className="size-4" /> All units
        </Link>
      </Button>

      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet">Unit {unit.index}</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">{unit.title}</h1>
      <p className="mt-3 max-w-xl text-sm text-slate-400">{unit.description}</p>

      <div className="mt-9 space-y-3">
        {unit.lessons.map((lesson, index) => {
          const globalIndex = completedBefore + index;
          const done = globalIndex < progress.lessonsCompleted;
          const unlocked = globalIndex <= progress.lessonsCompleted;
          const words = lesson.words.join(" · ");

          return (
            <div
              key={lesson.id}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-2xl border p-5",
                unlocked ? "border-line bg-surface/60" : "border-line/50 bg-surface/25 opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-xl font-display font-extrabold",
                  done ? "bg-lime text-ink" : "bg-violet/15 text-violet",
                )}
              >
                {done ? <Check className="size-5" /> : unlocked ? index + 1 : <Lock className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold">{lesson.title}</h2>
                <p className="mt-1 truncate text-xs text-slate-500">Live words: {words}</p>
              </div>
              {unlocked && (
                <Button asChild size="sm">
                  <Link href={`/lesson/${lesson.id}`}>
                    <Play className="size-3.5" /> {done ? "Practice" : "Start"}
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
