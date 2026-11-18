"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Lock, Sparkles } from "lucide-react";
import { useHearts } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import type { CurriculumPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

const UNIT_MOODS = ["from-accent/18 to-teal/8", "from-violet/18 to-coral/8", "from-teal/14 to-accent/8"];
const LESSON_EMOJIS = ["🌱", "🪄", "🧩", "🚀"];

type NodeState = "done" | "current" | "up-next" | "locked";

export function UnitPath({
  curriculum,
  completedLessons,
}: {
  curriculum: CurriculumPlan;
  completedLessons: string[];
}) {
  const { hearts, isPro } = useHearts();
  const completed = new Set(completedLessons);
  const allLessons = curriculum.units.flatMap((unit) => unit.lessons);
  const firstOpen = allLessons.find((lesson) => !completed.has(lesson.id))?.id;

  function stateFor(lessonId: string): NodeState {
    if (completed.has(lessonId)) return "done";
    if (lessonId === firstOpen) return "current";
    if (!isPro && hearts <= 0) return "locked";
    return "up-next";
  }

  return (
    <div className="space-y-16">
      {curriculum.units.map((unit) => (
        <section key={unit.id} className="relative">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="pill border-violet/30 bg-violet/10 text-violet">
                  Unit {String(unit.index).padStart(2, "0")}
                </span>
                <span className="h-px w-10 bg-line" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  {unit.lessons.length} mini lessons
                </span>
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {unit.title}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{unit.description}</p>
            </div>
            <Button
              asChild
              size="sm"
              variant={!isPro && hearts <= 0 ? "default" : "secondary"}
              className="shrink-0"
            >
              <Link href={`/practice/${unit.id}`}>
                <Sparkles className="size-3.5" />
                {!isPro && hearts <= 0 ? "Earn a heart" : "Practice unit"}
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {unit.lessons.map((lesson) => {
              const state = stateFor(lesson.id);
              const locked = state === "locked";
              const available = state === "current" || state === "up-next" || state === "done";
              const href = locked ? `/practice/${unit.id}` : available ? `/lesson/${lesson.id}` : "#";

              const card = (
                <div
                  className={cn(
                    "card-lift group relative overflow-hidden rounded-3xl border p-5",
                    "min-h-[178px]",
                    state === "done" && "border-accent/35 bg-accent/[0.07]",
                    state === "current" &&
                      "border-violet/50 bg-gradient-to-br from-violet/20 via-surface to-teal/10 shadow-[0_0_0_4px_rgba(139,123,255,0.08)]",
                    state === "up-next" && "border-line bg-surface/70",
                    locked && "cursor-not-allowed border-line/70 bg-surface/30 opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-gradient-to-br blur-2xl",
                      UNIT_MOODS[unit.index % UNIT_MOODS.length],
                    )}
                  />

                  <div className="relative flex items-start justify-between">
                    <span
                      className={cn(
                        "grid size-12 place-items-center rounded-2xl text-xl shadow-inner",
                        state === "done" && "bg-accent/15",
                        state === "current" && "bg-white/10",
                        state === "up-next" && "bg-white/5",
                        locked && "bg-white/5 grayscale",
                      )}
                    >
                      {state === "done" ? (
                        <Check className="size-5 text-accent" />
                      ) : locked ? (
                        <Lock className="size-4 text-muted" />
                      ) : (
                        LESSON_EMOJIS[lesson.index % LESSON_EMOJIS.length]
                      )}
                    </span>

                    <span
                      className={cn(
                        "pill px-2.5 py-1 text-[10px]",
                        state === "done" && "border-accent/30 bg-accent/10 text-accent",
                        state === "current" && "border-violet/40 bg-violet/15 text-white",
                        state === "up-next" && "text-muted",
                        locked && "border-coral/25 bg-coral/10 text-coral",
                      )}
                    >
                      {state === "done"
                        ? "Done"
                        : state === "current"
                          ? "Up now"
                          : locked
                            ? "Earn a heart"
                            : "Ready"}
                    </span>
                  </div>

                  <div className="relative mt-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted">
                      Lesson {String(lesson.index).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-extrabold text-white">
                      {lesson.title.replace(/^Lesson \d+ · /, "")}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted">
                        {lesson.words.length} live words
                      </span>
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full transition-all",
                          state === "current"
                            ? "bg-accent text-[#171438] group-hover:translate-x-1"
                            : "bg-white/5 text-slate-400 group-hover:bg-white/10",
                        )}
                      >
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );

              if (locked) {
                return (
                  <Link key={lesson.id} href={href} className="block" aria-label="Practice to earn a heart">
                    {card}
                  </Link>
                );
              }

              return (
                <Link
                  key={lesson.id}
                  href={href}
                  aria-disabled={!available}
                  tabIndex={available ? 0 : -1}
                  className="block"
                >
                  {card}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface/40 p-5 text-sm text-muted">
        <Sparkles className="size-4 shrink-0 text-accent" />
        Lesson order is yours to keep. Every card is generated from the live word pool when you open it.
      </div>
    </div>
  );
}
