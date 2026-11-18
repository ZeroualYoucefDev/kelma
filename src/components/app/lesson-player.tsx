"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Heart, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { completeLesson, type LessonResult } from "@/actions/progress";
import { registerWrongAnswer } from "@/actions/hearts";
import { useHearts } from "@/components/app/app-shell";
import { playPronunciation, warmUpVoices } from "@/services/audio";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "wrong";

function newAnswerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const { hearts, isPro, setHearts } = useHearts();
  const timer = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const correctRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [shaking, setShaking] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [heartModal, setHeartModal] = useState<{ locked: boolean; saving: boolean } | null>(null);
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

  async function finish(value: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSaving(true);
    try {
      const outcome = await completeLesson({
        lessonKey: lesson.plan.id,
        correct: value,
        total,
      });
      setResult(outcome);
      setHearts(outcome.hearts);
    } catch {
      setResult({
        xp: 0,
        gems: 0,
        hearts,
        streak: 0,
        perfect: value === total,
      });
    } finally {
      setSaving(false);
    }
  }

  function advance(value: number) {
    if (index + 1 >= total) {
      void finish(value);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setStatus("idle");
  }

  function choose(optionIndex: number) {
    if (status !== "idle" || !exercise || saving || heartModal) return;

    if (!isPro && hearts <= 0) {
      setOutOfHearts(true);
      return;
    }

    const correct = optionIndex === exercise.answerIndex;
    setSelected(optionIndex);
    setStatus(correct ? "correct" : "wrong");

    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
      timer.current = window.setTimeout(() => advance(correctRef.current), 800);
      return;
    }

    setShaking(true);
    window.setTimeout(() => setShaking(false), 500);
    setHeartModal({ locked: false, saving: true });

    void (async () => {
      try {
        const state = await registerWrongAnswer({
          answerId: newAnswerId(),
          lessonKey: lesson.plan.id,
        });
        setHearts(state.hearts);
        setHeartModal({ locked: state.locked, saving: false });
        if (state.locked) setOutOfHearts(true);
      } catch {
        setHeartModal({ locked: false, saving: false });
      }
    })();
  }

  function continueAfterMistake() {
    const modal = heartModal;
    setHeartModal(null);
    if (modal?.locked || (!isPro && hearts <= 0)) {
      setOutOfHearts(true);
      return;
    }
    advance(correctRef.current);
  }

  if (!exercise && !result) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-8 text-center">
        <p className="text-muted">This lesson has no exercises available.</p>
        <Button className="mt-5" onClick={() => router.push("/learn")}>
          Back to your cards
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button
          onClick={() => router.push("/learn")}
          className="rounded-xl p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Exit lesson"
        >
          <X className="size-5" />
        </button>

        <Progress value={(index / total) * 100} className="h-3 flex-1" />

        <span
          className={cn(
            "pill border-coral/30 bg-coral/10 text-coral",
            shaking && "animate-shake",
          )}
        >
          <Heart className={cn("size-4", shaking && "fill-coral")} />
          {isPro ? "∞" : hearts}
        </span>
      </div>

      {!finished && exercise && (
        <div className="animate-slide-up rounded-[2rem] border border-line bg-surface/80 p-6 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <span className="pill border-accent/25 bg-accent/10 text-accent">
              {exercise.kind}
            </span>
            <div className="flex items-center gap-2">
              <span className="pill text-muted">
                {lesson.source.emoji} {lesson.source.name}
              </span>
              <span className="text-xs font-bold text-muted">→</span>
              <span className="pill border-violet/30 bg-violet/10 text-white">
                {lesson.target.emoji} {lesson.target.name}
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
            {exercise.question}
          </h1>

          {exercise.kind === "listen" ? (
            <button
              onClick={playAudio}
              className="mx-auto my-8 flex size-28 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 text-accent transition-transform hover:scale-105 active:scale-95"
              aria-label={`Play audio in ${lesson.target.name}`}
            >
              <Volume2 className="size-11" />
            </button>
          ) : (
            <div className="my-8 rounded-3xl border border-line bg-ink/40 p-6 text-center">
              <p className="font-display text-3xl font-extrabold leading-snug break-words sm:text-4xl">
                {exercise.prompt}
              </p>
              {exercise.speak && (
                <button
                  onClick={() =>
                    void playPronunciation(exercise.speak!.text, exercise.speak!.locale)
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-accent"
                >
                  <Volume2 className="size-3.5" /> Hear it · {exercise.speak.locale}
                </button>
              )}
            </div>
          )}

          {exercise.note && <p className="mb-4 text-center text-xs text-muted">{exercise.note}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {exercise.options.map((option, optionIndex) => {
              const isAnswer = optionIndex === exercise.answerIndex;
              const isSelected = optionIndex === selected;
              return (
                <button
                  key={`${option}-${optionIndex}`}
                  onClick={() => choose(optionIndex)}
                  disabled={status !== "idle" || Boolean(heartModal)}
                  className={cn(
                    "flex min-h-16 items-center justify-between rounded-2xl border-2 px-4 py-4 text-left text-sm font-bold transition-all",
                    status === "idle" &&
                      "border-line bg-surface-2/60 text-slate-200 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-surface-2",
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

      {heartModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="heart-alert-title"
            className="animate-pop w-full max-w-sm rounded-[2rem] border border-coral/30 bg-surface p-7 text-center shadow-2xl"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-3xl">
              {heartModal.locked ? "💔" : "❤️"}
            </div>
            <h2 id="heart-alert-title" className="mt-5 font-display text-2xl font-extrabold">
              {heartModal.locked ? "Hearts empty!" : "One heart gone"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {heartModal.locked
                ? "Refill with gems or go Pro to keep learning right now."
                : `You have ${hearts} ${hearts === 1 ? "heart" : "hearts"} left. Watch out for the next one.`}
            </p>
            <Button
              className="mt-6 w-full"
              variant={heartModal.locked ? "destructive" : "default"}
              onClick={heartModal.locked ? () => router.push("/shop") : continueAfterMistake}
              disabled={heartModal.saving}
            >
              {heartModal.saving ? "Saving…" : heartModal.locked ? "Refill hearts" : "Keep going"}
            </Button>
          </div>
        </div>
      )}

      {outOfHearts && !heartModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-md rounded-[2rem] border border-line bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-3xl">
              💔
            </div>
            <h2 className="mt-5 font-display text-2xl font-extrabold">Out of hearts</h2>
            <p className="mt-2 text-sm text-muted">
              Lessons are locked until hearts refill, you spend gems, or you switch to Pro.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              <Button asChild variant="secondary">
                <Link href="/shop">Visit shop</Link>
              </Button>
              <Button onClick={() => router.push("/learn")}>Back to cards</Button>
            </div>
          </div>
        </div>
      )}

      {result && !outOfHearts && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-md rounded-[2rem] border border-line bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/15 text-3xl">
              {result.perfect ? "🏆" : "🎉"}
            </div>
            <h2 className="mt-5 font-display text-2xl font-extrabold">
              {result.perfect ? "Perfect lesson!" : "Lesson complete!"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {correctCount} of {total} correct · {lesson.target.name} with live data
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { label: "XP", value: `+${result.xp}`, tone: "text-accent" },
                { label: "Gems", value: `+${result.gems}`, tone: "text-teal" },
                { label: "Streak", value: `${result.streak}`, tone: "text-gold" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-line bg-ink/40 p-3">
                  <p className={cn("font-display text-xl font-extrabold", item.tone)}>{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <Button className="mt-7 w-full" onClick={() => router.push("/learn")}>
              {saving ? "Saving…" : "Continue"} <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
