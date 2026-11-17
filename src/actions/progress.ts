"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import {
  getPlayer,
  getProgressFor,
  recordAttempt,
  saveProgress,
} from "@/lib/data";
import {
  advanceStreak,
  dayKey,
  heartsAfterLesson,
  lessonRewards,
  refillHearts,
} from "@/lib/gamification";

export type LessonResult = {
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  perfect: boolean;
};

/** Commit a finished lesson to the progression state machine. */
export async function completeLesson(input: {
  lessonKey: string;
  correct: number;
  total: number;
}): Promise<LessonResult> {
  const viewer = await requireViewer();
  const player = await getPlayer(viewer);
  const current = await getProgressFor(viewer.id);
  const isPro = player.plan === "pro";

  const refilled = refillHearts(current.hearts, current.heartsUpdatedAt);
  const rewards = lessonRewards(input.correct, input.total, isPro);
  const streak = advanceStreak(
    current.streak,
    current.lastActiveDate,
    current.streakFreezes,
  );
  const wrong = Math.max(0, input.total - input.correct);
  const hearts = heartsAfterLesson(refilled.hearts, wrong, isPro);
  const perfect = wrong === 0;

  await saveProgress(viewer.id, {
    ...current,
    xp: current.xp + rewards.xp,
    gems: current.gems + rewards.gems,
    hearts,
    heartsUpdatedAt: hearts < refilled.hearts ? new Date() : refilled.heartsUpdatedAt,
    streak: streak.streak,
    longestStreak: Math.max(current.longestStreak, streak.streak),
    lastActiveDate: dayKey(),
    lessonsCompleted: current.lessonsCompleted + 1,
  });

  await recordAttempt({
    userId: viewer.id,
    lessonKey: input.lessonKey,
    correct: input.correct,
    total: input.total,
    xpEarned: rewards.xp,
  });

  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
  revalidatePath("/shop");
  revalidatePath("/profile");

  return { ...rewards, hearts, streak: streak.streak, perfect };
}
