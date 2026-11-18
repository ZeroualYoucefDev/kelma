"use client";

import { useEffect, useState } from "react";
import { Glyph } from "@/components/brand/glyphs";
import { speak } from "@/services/audio";
import { cn } from "@/lib/utils";

export type HeroPair = { source: string; translated: string };

export function HeroDemo({
  pairs,
  language,
  sourceLocale,
  targetLocale,
}: {
  pairs: HeroPair[];
  language: string;
  sourceLocale: string;
  targetLocale: string;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (pairs.length === 0) return;
    const cycle = window.setInterval(() => {
      setRevealed(false);
      setIndex((current) => (current + 1) % pairs.length);
    }, 3200);
    const reveal = window.setInterval(() => setRevealed(true), 1500);
    return () => {
      window.clearInterval(cycle);
      window.clearInterval(reveal);
    };
  }, [pairs.length]);

  if (pairs.length === 0) {
    return (
      <div className="h-[330px] animate-pulse rounded-3xl border border-line bg-surface/70" />
    );
  }

  const pair = pairs[index % pairs.length];
  const distractors = pairs
    .filter((item) => item.translated !== pair.translated)
    .slice(0, 2)
    .map((item) => item.translated);
  const options = [pair.translated, ...distractors];

  return (
    <div className="relative w-full max-w-md animate-float">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/10 blur-3xl" />
      <div className="rounded-3xl border border-line bg-surface/90 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="mb-6 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
          <span>Live lesson · {language}</span>
          <span className="text-violet">{sourceLocale} → {targetLocale}</span>
          <span className="text-accent">+10 XP</span>
        </div>

        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-2/3 rounded-full bg-accent transition-all" />
        </div>

        <p className="mt-7 text-sm font-semibold text-slate-400">Translate this word</p>
        <div className="mt-2 flex items-center gap-3">
          <h3 key={pair.source} className="animate-pop font-display text-3xl font-extrabold text-white">
            {pair.source}
          </h3>
          <button
            onClick={() => void speak(pair.source, "en-US")}
            className="rounded-lg border border-line p-2 text-slate-400 transition-colors hover:border-accent hover:text-accent"
            aria-label="Pronounce source word"
          >
            <Glyph name="sound" className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-2.5">
          {options.map((option) => {
            const correct = option === pair.translated;
            return (
              <div
                key={option}
                className={cn(
                  "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all duration-300",
                  revealed && correct
                    ? "border-accent bg-accent/12 text-accent"
                    : "border-line bg-surface-2/60 text-slate-300",
                )}
              >
                {option}
                {revealed && correct && <Glyph name="check" className="size-4" />}
              </div>
            );
          })}
        </div>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-teal transition-all duration-1000" style={{ width: revealed ? "100%" : "66%" }} />
        </div>
      </div>
    </div>
  );
}
