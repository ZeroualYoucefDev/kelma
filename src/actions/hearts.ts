"use server";

import { revalidatePath } from "next/cache";
import { requireOnboardedViewer } from "@/lib/auth";
import {
  decrementHeart,
  finalizeHeartEvent,
  getPlayer,
  getProgressFor,
  reserveHeartEvent,
  saveProgress,
} from "@/lib/data";
import { MAX_HEARTS, refillHearts } from "@/lib/gamification";

export type HeartState = {
  hearts: number;
  max: number;
  deducted: boolean;
  locked: boolean;
  isPro: boolean;
};

/**
 * Charge exactly one heart for one wrong answer.
 *
 * The client sends a fresh UUID for every answer. That id is stored with a
 * unique constraint, so a retried or duplicated request is idempotent while a
 * real wrong answer still updates the database immediately.
 */
export async function registerWrongAnswer(input: {
  answerId: string;
  lessonKey: string;
}): Promise<HeartState> {
  const viewer = await requireOnboardedViewer();
  const player = await getPlayer(viewer);

  if (player.plan === "pro") {
    return { hearts: MAX_HEARTS, max: MAX_HEARTS, deducted: false, locked: false, isPro: true };
  }

  const answerId = input.answerId?.trim();
  if (!answerId || answerId.length > 128) {
    throw new Error("A valid answer id is required.");
  }

  const current = await getProgressFor(viewer.id);
  const refilled = refillHearts(current.hearts, current.heartsUpdatedAt);

  // Persist any time-based refill before the atomic decrement so a level-up in
  // hearts is never lost by the UPDATE that follows.
  if (
    refilled.hearts !== current.hearts ||
    refilled.heartsUpdatedAt.getTime() !== current.heartsUpdatedAt.getTime()
  ) {
    await saveProgress(viewer.id, { ...current, ...refilled });
  }

  if (refilled.hearts <= 0) {
    return { hearts: 0, max: MAX_HEARTS, deducted: false, locked: true, isPro: false };
  }

  const reserved = await reserveHeartEvent({
    eventId: answerId,
    userId: viewer.id,
    lessonKey: input.lessonKey,
    projectedHearts: refilled.hearts - 1,
  });

  if (!reserved.applied) {
    return {
      hearts: reserved.heartsAfter,
      max: MAX_HEARTS,
      deducted: false,
      locked: reserved.heartsAfter <= 0,
      isPro: false,
    };
  }

  const hearts = await decrementHeart(viewer.id);
  await finalizeHeartEvent(answerId, hearts);

  revalidatePath("/learn");
  revalidatePath("/lesson/[lessonId]", "page");
  revalidatePath("/shop");
  revalidatePath("/profile");

  return {
    hearts,
    max: MAX_HEARTS,
    deducted: hearts < refilled.hearts,
    locked: hearts <= 0,
    isPro: false,
  };
}
