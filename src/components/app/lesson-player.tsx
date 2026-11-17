"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Heart, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { completeLesson, type LessonResult } from "@/actions/progress";
import { playPronunciation, warmUpVoices } from "@/services/audio";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "wrong";

export function LessonPlayer({
  lesson,
  hearts,
  isPro,
}: {
  lesson: Lesson;
  hearts: number;
  isPro: boolean;
}) {
  const router = useRouter();
  const timer = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [remainingHearts, setRemainingHearts] = useState(hearts);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [saving, setSaving] = useState(false);

  const exercise = lesson.exercises[index];
  const total = lesson.exercises.length;
  const finished = index >= total;

  useEffect(() => {
    warmUpVoices();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const playAudio = useCallback(() => {
    if (!exercise?.speak) return;
    void playPronunciation(exercise.speak.text, exercise.speak.locale);
  }, [exercise]);

  useEffect(() => {
    if (exercise?.speak) {
      const id = window.setTimeout(playAudio, 350);
      return () => window.clearTimeout(id);
    }
  }, [exercise, playAudio]);

  async function finish(correct: number) {
    setSaving(true);
    try {
      const outcome = await completeLesson({
        lessonKey: lesson.plan.id,
        correct,
        total,
      });
      setResult(outcome);
    } catch {
      // The learner still sees their result; progress is retried on next visit.
      setResult({ xp: 0, gems: 0, hearts: remainingHearts, streak: 0, perfect: correct === total });
    } finally {
      setSaving(false);
    }
  }

  function choose(optionIndex: number) {
    if (status !== "idle" || !exercise || saving) return;

    const correct = optionIndex === exercise.answerIndex;
    setSelected(optionIndex);
    setStatus(correct ? "correct" : "wrong");

    if (correct) {
      setCorrectCount((value) => value + 1);
    } else if (!isPro) {
      setRemainingHearts((value) => {
        const next = Math.max(0, value - 1);
        if (next === 0) setOutOfHearts(true);
        return next;
      });
    }

    timer.current = window.setTimeout(() => {
      const nextCorrect = correctCount + (correct ? 1 : 0);
      if (index + 1 >= total) {
        void finish(nextCorrect);
      } else {
        setIndex((value) => value + 1);
        setSelected(null);
        setStatus("idle");
      }
    }, correct ? 750 : 1200);
  }

  if (!exercise && !result) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-slate-400">This lesson has no exercises available.</p>
        <Button className="mt-5" onClick={() => router.push("/learn")}>
          Back to path
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/learn")}
          className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
          aria-label="Exit lesson"
        >
          <X className="size-5" />
        </button>
        <Progress value={(index / total) * 100} className="h-3" />
        <span className="flex items-center gap-1.5 text-sm font-extrabold text-coral">
          <Heart className="size-4 fill-coral" />
          {isPro ? "∞" : remainingHearts}
        </span>
      </div>

      {!finished && exercise && (
        <div className="animate-pop rounded-3xl border border-line bg-surface/80 p-6 shadow-2xl sm:p-9">
          <div className="mb-7 flex items-center justify-between">
            <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent">
              {exercise.kind}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {index + 1} / {total}
            </span>
          </div>

          <h1 className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
            {exercise.question}
          </h1>

          {exercise.kind === "listen" ? (
            <button
              onClick={playAudio}
              className="mx-auto my-8 flex size-28 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 text-accent transition-transform hover:scale-105 active:scale-95"
              aria-label="Play audio"
            >
              <Volume2 className="size-11" />
            </button>
          ) : (
            <div className="my-8 rounded-2xl border border-line bg-ink/50 p-6 text-center">
              <p className="font-display text-3xl font-extrabold leading-snug break-words sm:text-4xl">
                {exercise.prompt}
              </p>
              {(exercise.kind === "translate" || exercise.kind === "reverse") && (
                <button
                  onClick={() =>
                    void playPronunciation(
                      exercise.prompt,
                      exercise.kind === "translate" ? "en-US" : lesson.target.locale,
                    )
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-accent"
                >
                  <Volume2 className="size-3.5" /> Hear it
                </button>
              )}
            </div>
          )}

          {exercise.note && <p className="mb-4 text-center text-xs text-slate-500">{exercise.note}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {exercise.options.map((option, optionIndex) => {
              const isAnswer = optionIndex === exercise.answerIndex;
              const isSelected = optionIndex === selected;
              return (
                <button
                  key={`${option}-${optionIndex}`}
                  onClick={() => choose(optionIndex)}
                  disabled={status !== "idle"}
                  className={cn(
                    "flex items-center justify-between rounded-xl border-2 px-4 py-4 text-left text-sm font-bold transition-all",
                    status === "idle" &&
                      "border-line bg-surface-2/70 text-slate-200 hover:border-accent/60 hover:bg-surface-2",
                    status !== "idle" && isAnswer && "border-accent bg-accent/15 text-accent",
                    status === "wrong" && isSelected && !isAnswer && "border-coral bg-coral/15 text-coral",
                    status !== "idle" && !isAnswer && !isSelected && "opacity-40",
                  )}
                >
                  <span>{option}</span>
                  {status !== "idle" && isAnswer && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex min-h-7 items-center justify-center text-sm font-bold">
            {status === "correct" && <span className="animate-pop text-accent">Nice! Keep going.</span>}
            {status === "wrong" && (
              <span className="animate-pop text-coral">
                Not quite — the answer was “{exercise.options[exercise.answerIndex]}”.
              </span>
            )}
          </div>
        </div>
      )}

      {(result || outOfHearts) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-2xl">
            {outOfHearts ? (
              <>
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-3xl">💔</div>
                <h2 className="mt-5 font-display text-2xl font-extrabold">Out of hearts</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Refill in the shop, upgrade to Pro for unlimited hearts, or come back in ten minutes.
                </p>
                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="secondary">
                    <Link href="/shop">Visit shop</Link>
                  </Button>
                  <Button onClick={() => router.push("/learn")}>Back to path</Button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/15 text-3xl">
                  {result?.perfect ? "🏆" : "🎉"}
                </div>
                <h2 className="mt-5 font-display text-2xl font-extrabold">
                  {result?.perfect ? "Perfect lesson!" : "Lesson complete!"}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {correctCount} of {total} correct · {lesson.target.name} with live data
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[
                    { label: "XP", value: `+${result?.xp ?? 0}`, tone: "text-accent" },
                    { label: "Gems", value: `+${result?.gems ?? 0}`, tone: "text-teal" },
                    { label: "Streak", value: `${result?.streak ?? 0}`, tone: "text-gold" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-line bg-ink/50 p-3">
                      <p className={cn("font-display text-xl font-extrabold", item.tone)}>{item.value}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="mt-7 w-full" onClick={() => router.push("/learn")}>
                  {saving ? "Saving…" : "Continue"} <ChevronRight className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
