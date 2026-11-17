import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor } from "@/lib/data";
import { buildCurriculum } from "@/services/curriculum";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);
  const curriculum = await buildCurriculum(player.sourceLanguage, player.targetLanguage).catch(() => null);

  if (!curriculum) {
    return <p className="text-sm text-coral">The live curriculum is temporarily unavailable.</p>;
  }

  let completed = 0;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal">Curriculum</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">All units</h1>
      <p className="mt-3 text-sm text-slate-400">
        {curriculum.units.length} sequential units · {curriculum.totalWords.toLocaleString()} live vocabulary items.
      </p>

      <div className="mt-9 grid gap-4 sm:grid-cols-2">
        {curriculum.units.map((unit) => {
          const done = Math.max(0, Math.min(unit.lessons.length, progress.lessonsCompleted - completed));
          completed += unit.lessons.length;
          const percent = (done / unit.lessons.length) * 100;
          return (
            <Link
              key={unit.id}
              href={`/units/${unit.id}`}
              className="group rounded-2xl border border-line bg-surface/60 p-6 transition-all hover:-translate-y-1 hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-teal/15 font-display font-extrabold text-teal">
                  {unit.index}
                </span>
                {percent === 100 ? (
                  <CheckCircle2 className="size-5 text-accent" />
                ) : (
                  <ArrowRight className="size-5 text-slate-600 transition-colors group-hover:text-accent" />
                )}
              </div>
              <h2 className="mt-5 font-display text-lg font-extrabold">{unit.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{unit.description}</p>
              <div className="mt-5">
                <Progress value={percent} className="h-2" />
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3" /> {unit.lessons.length} lessons
                  </span>
                  <span>{Math.round(percent)}% complete</span>
                </div>
              </div>
              <Badge variant="outline" className="mt-4">Live dataset</Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
