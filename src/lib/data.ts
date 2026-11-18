import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { heartEvents, lessonAttempts, progress, purchases, users } from "@/db/schema";
import type { Viewer } from "./types";
import { displayName } from "./utils";

export type Player = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  avatar: string;
  dailyGoalMinutes: number;
  learningReason: string | null;
  onboardingCompleted: boolean;
  plan: "free" | "pro";
  planExpiresAt: Date | null;
};

export type PlayerProgress = {
  xp: number;
  gems: number;
  hearts: number;
  heartsUpdatedAt: Date;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakFreezes: number;
  lessonsCompleted: number;
};

const previewPlayers = new Map<string, Player>();
const previewProgress = new Map<string, PlayerProgress>();
const previewPurchases = new Map<string, { checkoutId: string; userId: string }>();
const previewHeartEvents = new Map<string, number>();

export function defaultProgress(): PlayerProgress {
  return {
    xp: 0,
    gems: 0,
    hearts: 5,
    heartsUpdatedAt: new Date(),
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    streakFreezes: 0,
    lessonsCompleted: 0,
  };
}

/** Create the user row on first sight (auth provider is the source of truth). */
export async function getPlayer(viewer: Viewer): Promise<Player> {
  if (!db) {
    const existing = previewPlayers.get(viewer.id);
    if (existing) return existing;
    const created: Player = {
      id: viewer.id,
      email: viewer.email,
      name: viewer.name,
      imageUrl: viewer.imageUrl,
      sourceLanguage: "en",
      targetLanguage: "es",
      avatar: "fox",
      dailyGoalMinutes: 10,
      learningReason: null,
      onboardingCompleted: false,
      plan: "free",
      planExpiresAt: null,
    };
    previewPlayers.set(viewer.id, created);
    return created;
  }

  await db
    .insert(users)
    .values({
      id: viewer.id,
      email: viewer.email,
      name: viewer.name,
      imageUrl: viewer.imageUrl,
    })
    .onConflictDoNothing();

  const [row] = await db.select().from(users).where(eq(users.id, viewer.id));
  const name = displayName(row.name, row.email);
  if (name !== row.name) await updatePlayer(row.id, { name });
  return {
    id: row.id,
    email: row.email,
    name,
    imageUrl: row.imageUrl,
    sourceLanguage: row.sourceLanguage,
    targetLanguage: row.targetLanguage,
    avatar: row.avatar,
    dailyGoalMinutes: row.dailyGoalMinutes,
    learningReason: row.learningReason,
    onboardingCompleted: row.onboardingCompleted,
    plan: row.plan as Player["plan"],
    planExpiresAt: row.planExpiresAt,
  };
}

export async function updatePlayer(
  userId: string,
  patch: Partial<
    Pick<
      Player,
      | "name"
      | "sourceLanguage"
      | "targetLanguage"
      | "imageUrl"
      | "avatar"
      | "dailyGoalMinutes"
      | "learningReason"
      | "onboardingCompleted"
    >
  >,
): Promise<void> {
  if (!db) {
    const current = previewPlayers.get(userId);
    if (current) previewPlayers.set(userId, { ...current, ...patch });
    return;
  }
  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getProgressFor(userId: string): Promise<PlayerProgress> {
  if (!db) return previewProgress.get(userId) ?? defaultProgress();

  const [row] = await db.select().from(progress).where(eq(progress.userId, userId));
  if (!row) return defaultProgress();
  return {
    xp: row.xp,
    gems: row.gems,
    hearts: row.hearts,
    heartsUpdatedAt: row.heartsUpdatedAt,
    streak: row.streak,
    longestStreak: row.longestStreak,
    lastActiveDate: row.lastActiveDate,
    streakFreezes: row.streakFreezes,
    lessonsCompleted: row.lessonsCompleted,
  };
}

export async function saveProgress(userId: string, value: PlayerProgress): Promise<void> {
  if (!db) {
    previewProgress.set(userId, value);
    return;
  }
  await db
    .insert(progress)
    .values({
      userId,
      ...value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: progress.userId,
      set: { ...value, updatedAt: new Date() },
    });
}

export async function recordAttempt(input: {
  userId: string;
  lessonKey: string;
  correct: number;
  total: number;
  xpEarned: number;
}): Promise<void> {
  if (!db) return;
  await db.insert(lessonAttempts).values({
    id: crypto.randomUUID(),
    ...input,
  });
}

/** Reserve a client-generated answer id so retries never cost two hearts. */
export async function reserveHeartEvent(input: {
  eventId: string;
  userId: string;
  lessonKey: string;
  projectedHearts: number;
}): Promise<{ applied: boolean; heartsAfter: number }> {
  if (!db) {
    const existing = previewHeartEvents.get(input.eventId);
    if (existing !== undefined) return { applied: false, heartsAfter: existing };
    previewHeartEvents.set(input.eventId, input.projectedHearts);
    return { applied: true, heartsAfter: input.projectedHearts };
  }

  const inserted = await db
    .insert(heartEvents)
    .values({
      id: input.eventId,
      userId: input.userId,
      lessonKey: input.lessonKey,
      heartsAfter: input.projectedHearts,
    })
    .onConflictDoNothing()
    .returning({ id: heartEvents.id });

  if (inserted.length === 0) {
    const [row] = await db
      .select({ heartsAfter: heartEvents.heartsAfter })
      .from(heartEvents)
      .where(eq(heartEvents.id, input.eventId));
    return { applied: false, heartsAfter: row?.heartsAfter ?? input.projectedHearts };
  }

  return { applied: true, heartsAfter: input.projectedHearts };
}

/** Atomically subtract one heart, never crossing zero. */
export async function decrementHeart(userId: string): Promise<number> {
  if (!db) {
    const current = previewProgress.get(userId) ?? defaultProgress();
    if (current.hearts <= 0) return 0;
    const hearts = current.hearts - 1;
    previewProgress.set(userId, { ...current, hearts, heartsUpdatedAt: new Date() });
    return hearts;
  }

  const [row] = await db
    .update(progress)
    .set({
      hearts: sql<number>`CASE WHEN ${progress.hearts} > 0 THEN ${progress.hearts} - 1 ELSE 0 END`,
      heartsUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(progress.userId, userId), gt(progress.hearts, 0)))
    .returning({ hearts: progress.hearts });

  if (row) return row.hearts;
  const [fallback] = await db
    .select({ hearts: progress.hearts })
    .from(progress)
    .where(eq(progress.userId, userId));
  return fallback?.hearts ?? 0;
}

/** Store the authoritative heart count after an atomic decrement. */
export async function finalizeHeartEvent(eventId: string, heartsAfter: number): Promise<void> {
  if (!db) {
    previewHeartEvents.set(eventId, heartsAfter);
    return;
  }
  await db
    .update(heartEvents)
    .set({ heartsAfter })
    .where(eq(heartEvents.id, eventId));
}

export async function completedLessonKeys(userId: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db
    .selectDistinct({ lessonKey: lessonAttempts.lessonKey })
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId));
  return rows.map((row) => row.lessonKey);
}

export async function recentAttempts(userId: string, limit = 10) {
  if (!db) return [];
  return db
    .select()
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId))
    .orderBy(desc(lessonAttempts.createdAt))
    .limit(limit);
}

export async function topLearners(limit = 10) {
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      imageUrl: users.imageUrl,
      avatar: users.avatar,
      xp: progress.xp,
      streak: progress.streak,
      plan: users.plan,
    })
    .from(progress)
    .innerJoin(users, eq(users.id, progress.userId))
    .orderBy(desc(progress.xp))
    .limit(limit);
}

export async function recordPurchase(input: {
  userId: string;
  checkoutId: string;
  kind: string;
  amountDzd: number;
  livemode: boolean;
}): Promise<boolean> {
  if (!db) {
    if (previewPurchases.has(input.checkoutId)) return false;
    previewPurchases.set(input.checkoutId, input);
    return true;
  }

  const result = await db
    .insert(purchases)
    .values({ id: crypto.randomUUID(), status: "paid", ...input })
    .onConflictDoNothing({ target: purchases.checkoutId })
    .returning({ id: purchases.id });
  return result.length > 0;
}

export async function activatePro(userId: string): Promise<void> {
  if (!db) {
    const current = previewPlayers.get(userId);
    if (current) previewPlayers.set(userId, { ...current, plan: "pro" });
    return;
  }
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await db
    .update(users)
    .set({ plan: "pro", planExpiresAt: expires, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function isProUser(userId: string): Promise<boolean> {
  if (!db) {
    const player = previewPlayers.get(userId);
    return player?.plan === "pro" || previewPurchases.size > 0;
  }
  const [row] = await db
    .select({ plan: users.plan, expires: users.planExpiresAt })
    .from(users)
    .where(and(eq(users.id, userId)));
  if (!row) return false;
  return row.plan === "pro" && (!row.expires || row.expires.getTime() > Date.now());
}
