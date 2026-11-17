import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user id
    email: text("email").notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    sourceLanguage: text("source_language").notNull().default("en"),
    targetLanguage: text("target_language").notNull().default("es"),
    plan: text("plan").notNull().default("free"), // free | pro
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const progress = pgTable("progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  gems: integer("gems").notNull().default(0),
  hearts: integer("hearts").notNull().default(5),
  heartsUpdatedAt: timestamp("hearts_updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"), // YYYY-MM-DD (UTC)
  streakFreezes: integer("streak_freezes").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonAttempts = pgTable("lesson_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonKey: text("lesson_key").notNull(),
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const purchases = pgTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkoutId: text("checkout_id"),
    kind: text("kind").notNull(),
    amountDzd: integer("amount_dzd").notNull().default(0),
    status: text("status").notNull().default("pending"),
    livemode: boolean("livemode").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("purchases_checkout_idx").on(table.checkoutId)],
);

export type UserRow = typeof users.$inferSelect;
export type ProgressRow = typeof progress.$inferSelect;
