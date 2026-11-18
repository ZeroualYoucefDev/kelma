"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Glyph } from "@/components/brand/glyphs";
import { LanguageSigil } from "@/components/brand/language-sigil";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { completeLesson, type LessonResult } from "@/actions/progress";
import { completePractice, registerWrongAnswer, type PracticeResult } from "@/actions/hearts";
import { useHearts } from "@/components/app/app-shell";
import { playPronunciation, warmUpVoices } from "@/services/audio";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "correct" | "wrong";

function newAnswerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function LessonPlayer({
  lesson,
  practice,
}: {
  lesson: Lesson;
  practice?: { unitId: string };
}) {
  const router = useRouter();
  const { hearts, isPro, setHearts } = useHearts();
  const timer = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const correctRef = useRef(0);
  const practiceIdRef = useRef<string | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [shaking, setShaking] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [heartModal, setHeartModal] = useState<{ locked: boolean; saving: boolean } | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [saving, setSaving] = useState(false);

  const exercise = lesson.exercises[index];
  const total = lesson.exercises.length;
  const finished = index >= total;
  const nativeAudio = exercise?.nativeSpeak;
  const showNativeAudio = Boolean(
    nativeAudio &&
      (nativeAudio.text !== exercise?.speak?.text || nativeAudio.locale !== exercise?.speak?.locale),
  );

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

  const playNativeAudio = useCallback(() => {
    if (!nativeAudio) return;
    void playPronunciation(nativeAudio.text, nativeAudio.locale);
  }, [nativeAudio]);

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
      if (practice) {
        if (!practiceIdRef.current) practiceIdRef.current = newAnswerId();
        const outcome = await completePractice({
          sessionId: practiceIdRef.current,
          unitId: practice.unitId,
          correct: value,
          total,
        });
        setPracticeResult(outcome);
        setHearts(outcome.hearts);
      } else {
        const outcome = await completeLesson({
          lessonKey: lesson.plan.id,
          correct: value,
          total,
        });
        setResult(outcome);
        setHearts(outcome.hearts);
      }
    } catch {
      if (practice) {
        setPracticeResult({
          hearts: isPro ? 5 : Math.min(hearts + 1, 5),
          max: 5,
          heartEarned: !isPro && hearts < 5,
          isPro,
        });
      } else {
        setResult({
          xp: 0,
          gems: 0,
          hearts,
          streak: 0,
          perfect: value === total,
        });
      }
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

    if (!practice && !isPro && hearts <= 0) {
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

    // Practice is a safe space: mistakes teach, they never cost a heart.
    if (practice) {
      timer.current = window.setTimeout(() => advance(correctRef.current), 1100);
      return;
    }

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
    if (!practice && (modal?.locked || (!isPro && hearts <= 0))) {
      setOutOfHearts(true);
      return;
    }
    advance(correctRef.current);
  }

  if (!exercise && !result && !practiceResult) {
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
          <Glyph name="close" className="size-5" />
        </button>

        <Progress value={(index / total) * 100} className="h-3 flex-1" />

        {practice && (
          <span className="pill border-teal/30 bg-teal/10 text-teal">Practice · +1 heart</span>
        )}

        <span
          className={cn(
            "pill border-coral/30 bg-coral/10 text-coral",
            shaking && "animate-shake",
          )}
        >
          <Glyph
            name="heart"
            className={cn("size-4", shaking && "text-coral")}
            fill={shaking ? "currentColor" : "none"}
          />
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
                <LanguageSigil code={lesson.source.code} className="size-4" />
                {lesson.source.name}
              </span>
              <Glyph name="arrow" className="size-4 text-muted" />
              <span className="pill border-violet/30 bg-violet/10 text-white">
                <LanguageSigil code={lesson.target.code} className="size-4" />
                {lesson.target.name}
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
            {exercise.question}
          </h1>

          {exercise.kind === "listen" ? (
            <div className="my-8 text-center">
              <button
                onClick={playAudio}
                className="mx-auto flex size-28 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 text-accent transition-transform hover:scale-105 active:scale-95"
                aria-label={`Play audio in ${lesson.target.name}`}
              >
                <Glyph name="sound" className="size-11" />
              </button>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                Spoken in {lesson.target.name}
              </p>
              {showNativeAudio && nativeAudio && (
                <button
                  onClick={playNativeAudio}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal transition-colors hover:bg-teal/20"
                >
                  <Glyph name="sound" className="size-3.5" /> Hear meaning in {lesson.source.name} ·{" "}
                  {nativeAudio.locale}
                </button>
              )}
            </div>
          ) : (
            <div className="my-8 rounded-3xl border border-line bg-ink/40 p-6 text-center">
              <p className="font-display text-3xl font-extrabold leading-snug break-words sm:text-4xl">
                {exercise.prompt}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {exercise.speak && (
                  <button
                    onClick={playAudio}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-accent"
                  >
                    <Glyph name="sound" className="size-3.5" /> Hear it · {exercise.speak.locale}
                  </button>
                )}
                {showNativeAudio && nativeAudio && (
                  <button
                    onClick={playNativeAudio}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal transition-colors hover:text-accent"
                  >
                    <Glyph name="sound" className="size-3.5" /> Hear in {lesson.source.name} ·{" "}
                    {nativeAudio.locale}
                  </button>
                )}
              </div>
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
                  {status !== "idle" && isAnswer && <Glyph name="check" className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex min-h-7 items-center justify-center text-sm font-bold">
            {status === "correct" && <span className="animate-pop text-accent">Nice! Keep going.</span>}
            {status === "wrong" && (
              <span className="animate-pop text-coral">
                Not quite — the answer was “{exercise.options[exercise.answerIndex]}”.
                {practice && " Practice is free — no hearts lost."}
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
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-coral">
              <Glyph name={heartModal.locked ? "heart-break" : "heart"} className="size-8" />
            </div>
            <h2 id="heart-alert-title" className="mt-5 font-display text-2xl font-extrabold">
              {heartModal.locked ? "Hearts empty!" : "One heart gone"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {heartModal.locked
                ? "Practice a unit to earn a heart, spend gems, or go Pro to keep learning right now."
                : `You have ${hearts} ${hearts === 1 ? "heart" : "hearts"} left. Watch out for the next one.`}
            </p>
            {heartModal.locked ? (
              <div className="mt-6 grid gap-2">
                <Button
                  variant="destructive"
                  onClick={() => router.push(`/practice/${lesson.unit.id}`)}
                  disabled={heartModal.saving}
                >
                  Practice for a heart
                </Button>
                <Button asChild variant="secondary" disabled={heartModal.saving}>
                  <Link href="/shop">Use gems or go Pro</Link>
                </Button>
              </div>
            ) : (
              <Button
                className="mt-6 w-full"
                onClick={continueAfterMistake}
                disabled={heartModal.saving}
              >
                {heartModal.saving ? "Saving…" : "Keep going"}
              </Button>
            )}
          </div>
        </div>
      )}

      {outOfHearts && !heartModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-md rounded-[2rem] border border-line bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-coral">
              <Glyph name="heart-break" className="size-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-extrabold">Out of hearts</h2>
            <p className="mt-2 text-sm text-muted">
              Lessons are locked until hearts refill, you practice a unit, you spend gems, or you
              switch to Pro.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => router.push(`/practice/${lesson.unit.id}`)}>
                Practice for a heart
              </Button>
              <Button asChild variant="secondary">
                <Link href="/shop">Visit shop</Link>
              </Button>
              <Button className="sm:col-span-2" variant="ghost" onClick={() => router.push("/learn")}>
                Back to cards
              </Button>
            </div>
          </div>
        </div>
      )}

      {practiceResult && !outOfHearts && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-md rounded-[2rem] border border-teal/30 bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal/15 text-teal">
              <Glyph name={practiceResult.heartEarned ? "heart" : "spark"} className="size-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-extrabold">
              {practiceResult.heartEarned ? "Heart earned!" : "Practice complete!"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {practiceResult.isPro
                ? "Your Pro hearts are already unlimited."
                : practiceResult.heartEarned
                  ? `You now have ${practiceResult.hearts} ${practiceResult.hearts === 1 ? "heart" : "hearts"}. You can jump back into any lesson.`
                  : "Your hearts are already full — nice work."}
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => router.push("/learn")}>Back to lessons</Button>
              <Button asChild variant="secondary">
                <Link href={`/lesson/${lesson.plan.id}`}>Keep learning</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {result && !outOfHearts && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-md rounded-[2rem] border border-line bg-surface p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Glyph name={result.perfect ? "trophy" : "spark"} className="size-8" />
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
              {saving ? "Saving…" : "Continue"} <Glyph name="chevron" className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
