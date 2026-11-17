/** Pure rules for hearts, XP, gems and daily streaks. */

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 10 * 60 * 1000;

export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** One heart regenerates every ten minutes, capped at the maximum. */
export function refillHearts(
  hearts: number,
  heartsUpdatedAt: Date,
  now: Date = new Date(),
): { hearts: number; heartsUpdatedAt: Date } {
  if (hearts >= MAX_HEARTS) return { hearts, heartsUpdatedAt };

  const elapsed = Math.max(0, now.getTime() - heartsUpdatedAt.getTime());
  const gained = Math.floor(elapsed / HEART_REFILL_MS);
  if (gained <= 0) return { hearts, heartsUpdatedAt };

  return {
    hearts: Math.min(MAX_HEARTS, hearts + gained),
    heartsUpdatedAt: new Date(heartsUpdatedAt.getTime() + gained * HEART_REFILL_MS),
  };
}

/**
 * Advance a streak by UTC day. A single streak freeze absorbs one missed day.
 * Completing twice on the same day is idempotent.
 */
export function advanceStreak(
  streak: number,
  lastActiveDate: string | null,
  freezes: number,
  now: Date = new Date(),
): { streak: number; freezes: number } {
  const today = dayKey(now);
  if (lastActiveDate === today) return { streak, freezes };

  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  if (lastActiveDate === yesterday) return { streak: streak + 1, freezes };

  if (lastActiveDate && freezes > 0) {
    // The freeze covers the whole gap; streak continues from yesterday's value.
    return { streak: streak + 1, freezes: freezes - 1 };
  }

  return { streak: 1, freezes };
}

/** XP and gems earned for a completed lesson. */
export function lessonRewards(
  correct: number,
  total: number,
  isPro: boolean,
): { xp: number; gems: number } {
  const baseXp = correct * 10 + (correct === total ? 5 : 0);
  const baseGems = Math.max(1, correct * 2 + (correct === total ? 5 : 0));
  return {
    xp: isPro ? Math.round(baseXp * 1.5) : baseXp,
    gems: isPro ? Math.round(baseGems * 1.5) : baseGems,
  };
}

/** Hearts lost for a lesson result (Pro accounts never lose hearts). */
export function heartsAfterLesson(hearts: number, wrong: number, isPro: boolean): number {
  if (isPro || wrong <= 0) return hearts;
  return Math.max(0, hearts - Math.min(wrong, hearts));
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number } {
  const needed = 100;
  return {
    level: Math.floor(xp / needed) + 1,
    intoLevel: xp % needed,
    needed,
  };
}
