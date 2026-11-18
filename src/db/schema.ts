import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) => integer(name, { mode: "timestamp" });

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user id
    email: text("email").notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    sourceLanguage: text("source_language").notNull().default("en"),
    targetLanguage: text("target_language").notNull().default("es"),
    avatar: text("avatar").notNull().default("fox"),
    dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(10),
    learningReason: text("learning_reason"),
    onboardingCompleted: integer("onboarding_completed", { mode: "boolean" })
      .notNull()
      .default(false),
    plan: text("plan").notNull().default("free"), // free | pro
    planExpiresAt: timestamp("plan_expires_at"),
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const progress = sqliteTable("progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  gems: integer("gems").notNull().default(0),
  hearts: integer("hearts").notNull().default(5),
  heartsUpdatedAt: timestamp("hearts_updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"), // YYYY-MM-DD (UTC)
  streakFreezes: integer("streak_freezes").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const heartEvents = sqliteTable(
  "heart_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonKey: text("lesson_key").notNull(),
    heartsAfter: integer("hearts_after").notNull(),
    applied: integer("applied", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  },
);

export const practiceSessions = sqliteTable("practice_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  unitId: text("unit_id").notNull(),
  heartsAwarded: integer("hearts_awarded").notNull().default(0),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const lessonAttempts = sqliteTable("lesson_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonKey: text("lesson_key").notNull(),
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkoutId: text("checkout_id"),
    kind: text("kind").notNull(),
    amountDzd: integer("amount_dzd").notNull().default(0),
    provisioned: integer("provisioned", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("pending"),
    livemode: integer("livemode", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("purchases_checkout_idx").on(table.checkoutId)],
);

export type UserRow = typeof users.$inferSelect;
export type ProgressRow = typeof progress.$inferSelect;
