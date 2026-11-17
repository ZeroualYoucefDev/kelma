import Link from "next/link";
import { BookOpen, Check, Lock, Star, Trophy } from "lucide-react";
import type { CurriculumPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

type NodeState = "done" | "current" | "locked";

function PathNode({
  lessonId,
  index,
  state,
  side,
  title,
}: {
  lessonId: string;
  index: number;
  state: NodeState;
  side: "left" | "right";
  title: string;
}) {
  const Icon = state === "done" ? Check : index % 4 === 3 ? Trophy : BookOpen;
  const isCurrent = state === "current";

  const node = (
    <Link
      href={state === "locked" ? "#" : `/lesson/${lessonId}`}
      aria-disabled={state === "locked"}
      className={cn(
        "group relative flex size-14 items-center justify-center rounded-2xl border-2 transition-all",
        state === "done" && "border-accent bg-accent text-ink",
        isCurrent &&
          "scale-110 border-accent bg-accent text-ink shadow-[0_0_0_8px_rgba(182,243,106,0.12)] hover:scale-115",
        state === "locked" && "cursor-not-allowed border-line bg-surface-2 text-slate-600",
      )}
    >
      {state === "locked" ? <Lock className="size-5" /> : <Icon className="size-6" strokeWidth={2.5} />}
      {isCurrent && <Star className="absolute -right-2 -top-2 size-5 fill-gold text-gold" />}
      <span className="pointer-events-none absolute -top-10 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-slate-200 opacity-0 transition-opacity group-hover:opacity-100">
        {title}
      </span>
    </Link>
  );

  return (
    <div className={cn("relative z-10 flex", side === "left" ? "justify-start pr-[54%]" : "justify-end pl-[54%]")}>
      {node}
    </div>
  );
}

export function UnitPath({
  curriculum,
  completedLessons,
}: {
  curriculum: CurriculumPlan;
  completedLessons: number;
}) {
  let globalIndex = 0;

  return (
    <div className="space-y-16">
      {curriculum.units.map((unit, unitIndex) => {
        const unitLocked = globalIndex > completedLessons;
        return (
          <section key={unit.id} className="relative">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-teal/15 font-display text-sm font-extrabold text-teal">
                    {unit.index}
                  </span>
                  <h2 className="font-display text-2xl font-extrabold">{unit.title}</h2>
                </div>
                <p className="mt-2 max-w-lg text-sm text-slate-400">{unit.description}</p>
              </div>
              <span className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-slate-400">
                {unit.lessons.length} lessons · live data
              </span>
            </div>

            <div className="relative space-y-7">
              <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l-2 border-dashed border-line" />
              {unit.lessons.map((lesson, lessonIndex) => {
                const index = globalIndex++;
                const state: NodeState =
                  index < completedLessons ? "done" : index === completedLessons ? "current" : "locked";
                void unitLocked;
                return (
                  <PathNode
                    key={lesson.id}
                    lessonId={lesson.id}
                    index={lessonIndex}
                    state={state}
                    side={lessonIndex % 2 === 0 ? "left" : "right"}
                    title={lesson.title}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
