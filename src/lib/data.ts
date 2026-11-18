import { and, desc, eq } from "drizzle-orm";
import { db, rawSqlite } from "@/db";
import { heartEvents, lessonAttempts, progress, users } from "@/db/schema";
import { MAX_HEARTS } from "./gamification";
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

/**
 * Apply a reserved answer exactly once. The ledger row, the atomic decrement
 * and the authoritative heart count are committed in one SQLite transaction,
 * so a crash between steps can never cause a lost or duplicated deduction.
 */
export async function settleHeartEvent(input: {
  eventId: string;
  userId: string;
}): Promise<{ hearts: number; appliedNow: boolean }> {
  if (!rawSqlite) {
    const existing = previewHeartEvents.get(input.eventId);
    if (existing !== undefined) return { hearts: existing, appliedNow: false };
    const current = previewProgress.get(input.userId) ?? defaultProgress();
    const hearts = Math.max(0, current.hearts - 1);
    previewProgress.set(input.userId, {
      ...current,
      hearts,
      heartsUpdatedAt: new Date(),
    });
    previewHeartEvents.set(input.eventId, hearts);
    return { hearts, appliedNow: true };
  }

  const now = Math.floor(Date.now() / 1000);
  rawSqlite.exec("BEGIN IMMEDIATE");
  try {
    const event = rawSqlite
      .prepare("SELECT user_id, applied, hearts_after FROM heart_events WHERE id = ?")
      .get(input.eventId) as
      | { user_id: string; applied: number; hearts_after: number }
      | undefined;

    if (!event || event.user_id !== input.userId) {
      throw new Error("Heart event not found for this learner.");
    }
    if (event.applied === 1) {
      rawSqlite.exec("COMMIT");
      return { hearts: event.hearts_after, appliedNow: false };
    }

    rawSqlite
      .prepare(
        `UPDATE progress
         SET hearts = CASE WHEN hearts > 0 THEN hearts - 1 ELSE 0 END,
             hearts_updated_at = ?, updated_at = ?
         WHERE user_id = ?`,
      )
      .run(now, now, input.userId);

    const current = rawSqlite
      .prepare("SELECT hearts FROM progress WHERE user_id = ?")
      .get(input.userId) as { hearts: number } | undefined;
    const hearts = current?.hearts ?? 0;

    rawSqlite
      .prepare("UPDATE heart_events SET applied = 1, hearts_after = ? WHERE id = ?")
      .run(hearts, input.eventId);

    rawSqlite.exec("COMMIT");
    return { hearts, appliedNow: true };
  } catch (error) {
    rawSqlite.exec("ROLLBACK");
    throw error;
  }
}

/** Completed unit practice always gives a free learner one heart, capped at 5. */
export async function awardPracticeHeart(input: {
  sessionId: string;
  userId: string;
  unitId: string;
}): Promise<{ hearts: number; heartsAwarded: number; alreadyApplied: boolean }> {
  if (!rawSqlite) {
    const current = previewProgress.get(input.userId) ?? defaultProgress();
    const hearts = Math.min(MAX_HEARTS, current.hearts + 1);
    previewProgress.set(input.userId, { ...current, hearts, heartsUpdatedAt: new Date() });
    return { hearts, heartsAwarded: hearts - current.hearts, alreadyApplied: false };
  }

  const now = Math.floor(Date.now() / 1000);
  rawSqlite.exec("BEGIN IMMEDIATE");
  try {
    const existing = rawSqlite
      .prepare("SELECT user_id, unit_id, hearts_awarded FROM practice_sessions WHERE id = ?")
      .get(input.sessionId) as
      | { user_id: string; unit_id: string; hearts_awarded: number }
      | undefined;

    if (existing) {
      if (existing.user_id !== input.userId || existing.unit_id !== input.unitId) {
        throw new Error("Practice session does not belong to this learner.");
      }
      const current = rawSqlite
        .prepare("SELECT hearts FROM progress WHERE user_id = ?")
        .get(input.userId) as { hearts: number } | undefined;
      rawSqlite.exec("COMMIT");
      return {
        hearts: current?.hearts ?? MAX_HEARTS,
        heartsAwarded: existing.hearts_awarded,
        alreadyApplied: true,
      };
    }

    const current = rawSqlite
      .prepare("SELECT hearts FROM progress WHERE user_id = ?")
      .get(input.userId) as { hearts: number } | undefined;
    const heartsBefore = current?.hearts ?? 0;
    const heartsAwarded = Math.min(1, Math.max(0, MAX_HEARTS - heartsBefore));
    const hearts = Math.min(MAX_HEARTS, heartsBefore + heartsAwarded);

    rawSqlite
      .prepare(
        `INSERT INTO practice_sessions
          (id, user_id, unit_id, hearts_awarded, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(input.sessionId, input.userId, input.unitId, heartsAwarded, now);
    rawSqlite
      .prepare(
        `UPDATE progress
         SET hearts = ?, hearts_updated_at = ?, updated_at = ?
         WHERE user_id = ?`,
      )
      .run(hearts, now, now, input.userId);

    rawSqlite.exec("COMMIT");
    return { hearts, heartsAwarded, alreadyApplied: false };
  } catch (error) {
    rawSqlite.exec("ROLLBACK");
    throw error;
  }
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

/**
 * Record a paid checkout and provision Pro in one transaction. A retry with
 * the same checkout id returns without a second charge or activation, and a
 * crash after the user update rolls the whole operation back.
 */
export async function provisionProPurchase(input: {
  userId: string;
  checkoutId: string;
  kind: string;
  amountDzd: number;
  livemode: boolean;
}): Promise<boolean> {
  if (!rawSqlite) {
    if (previewPurchases.has(input.checkoutId)) return false;
    previewPurchases.set(input.checkoutId, input);
    const current = previewPlayers.get(input.userId);
    if (current) previewPlayers.set(input.userId, { ...current, plan: "pro" });
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expires = now + 365 * 24 * 60 * 60;
  rawSqlite.exec("BEGIN IMMEDIATE");
  try {
    const existing = rawSqlite
      .prepare("SELECT user_id, provisioned FROM purchases WHERE checkout_id = ?")
      .get(input.checkoutId) as
      | { user_id: string; provisioned: number }
      | undefined;

    if (existing && existing.user_id !== input.userId) {
      throw new Error("Checkout belongs to another learner.");
    }
    if (existing?.provisioned === 1) {
      rawSqlite.exec("COMMIT");
      return false;
    }

    if (!existing) {
      rawSqlite
        .prepare(
          `INSERT INTO purchases
            (id, user_id, checkout_id, kind, amount_dzd, provisioned, status, livemode, created_at)
           VALUES (?, ?, ?, ?, ?, 0, 'paid', ?, ?)`,
        )
        .run(
          crypto.randomUUID(),
          input.userId,
          input.checkoutId,
          input.kind,
          input.amountDzd,
          input.livemode ? 1 : 0,
          now,
        );
    }

    rawSqlite
      .prepare("UPDATE users SET plan = 'pro', plan_expires_at = ?, updated_at = ? WHERE id = ?")
      .run(expires, now, input.userId);
    rawSqlite
      .prepare("UPDATE purchases SET provisioned = 1, status = 'paid' WHERE checkout_id = ?")
      .run(input.checkoutId);

    rawSqlite.exec("COMMIT");
    return true;
  } catch (error) {
    rawSqlite.exec("ROLLBACK");
    throw error;
  }
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
