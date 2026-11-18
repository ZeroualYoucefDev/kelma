import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

/**
 * SQLite persistence using Node's built-in SQLite engine. No external database
 * service and no native npm package are required. DATABASE_URL is optional and
 * may be a SQLite file path (`./kelma.db`) or a `file:`/`sqlite:` URL. Legacy
 * PostgreSQL URLs are ignored so an old .env.local cannot break the app.
 */
const configured = process.env.DATABASE_URL?.trim();
const disabled = configured
  ? /^(0|false|none|disabled)$/i.test(configured)
  : false;
const isLegacyPostgresUrl = configured
  ? /^postgres(?:ql)?:\/\//i.test(configured)
  : false;

function resolveDatabasePath() {
  if (!configured || isLegacyPostgresUrl) {
    return path.join(process.cwd(), "kelma.db");
  }
  const normalized = configured
    .replace(/^sqlite:/i, "")
    .replace(/^file:/i, "");
  return normalized === ":memory:"
    ? normalized
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), normalized);
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    source_language TEXT NOT NULL DEFAULT 'en',
    target_language TEXT NOT NULL DEFAULT 'es',
    avatar TEXT NOT NULL DEFAULT 'fox',
    daily_goal_minutes INTEGER NOT NULL DEFAULT 10,
    learning_reason TEXT,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    plan TEXT NOT NULL DEFAULT 'free',
    plan_expires_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    gems INTEGER NOT NULL DEFAULT 0,
    hearts INTEGER NOT NULL DEFAULT 5,
    hearts_updated_at INTEGER NOT NULL,
    streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,
    streak_freezes INTEGER NOT NULL DEFAULT 0,
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS heart_events (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_key TEXT NOT NULL,
    hearts_after INTEGER NOT NULL,
    applied INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS heart_events_user_idx ON heart_events (user_id);

  CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL,
    hearts_awarded INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS practice_sessions_user_idx ON practice_sessions (user_id);

  CREATE TABLE IF NOT EXISTS lesson_attempts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_key TEXT NOT NULL,
    correct INTEGER NOT NULL,
    total INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkout_id TEXT,
    kind TEXT NOT NULL,
    amount_dzd INTEGER NOT NULL DEFAULT 0,
    provisioned INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    livemode INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS purchases_checkout_idx ON purchases (checkout_id);
`;

function createDb() {
  const databasePath = resolveDatabasePath();
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const sqlite = new DatabaseSync(databasePath);
  sqlite.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  if (databasePath !== ":memory:") {
    sqlite.exec("PRAGMA journal_mode = WAL;");
  }
  sqlite.exec(SCHEMA_SQL);

  // Existing databases created before onboarding need their new columns.
  const userColumns = new Set(
    (sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>).map(
      (column) => column.name,
    ),
  );
  const addUserColumn: Record<string, string> = {
    avatar: "ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT 'fox'",
    daily_goal_minutes:
      "ALTER TABLE users ADD COLUMN daily_goal_minutes INTEGER NOT NULL DEFAULT 10",
    learning_reason: "ALTER TABLE users ADD COLUMN learning_reason TEXT",
    onboarding_completed:
      "ALTER TABLE users ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0",
  };
  for (const [column, statement] of Object.entries(addUserColumn)) {
    if (!userColumns.has(column)) sqlite.exec(statement);
  }

  // Multiple Next.js build workers can open this file at the same time, so an
  // ALTER that loses the race must be treated as success.
  function ensureColumn(table: string, column: string, statement: string) {
    const columns = new Set(
      (sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map(
        (entry) => entry.name,
      ),
    );
    if (columns.has(column)) return;
    try {
      sqlite.exec(statement);
    } catch (error) {
      if (!/duplicate column name/i.test(String(error))) throw error;
    }
  }

  // Older heart events were finalized in a separate step, so they are already
  // applied. New events use the atomic settle path below.
  ensureColumn(
    "heart_events",
    "applied",
    "ALTER TABLE heart_events ADD COLUMN applied INTEGER NOT NULL DEFAULT 0",
  );
  sqlite.exec("UPDATE heart_events SET applied = 1 WHERE applied = 0");

  // Purchases created before the atomic provision path were activated by the
  // old webhook handler, so mark them provisioned.
  ensureColumn(
    "purchases",
    "provisioned",
    "ALTER TABLE purchases ADD COLUMN provisioned INTEGER NOT NULL DEFAULT 0",
  );
  sqlite.exec("UPDATE purchases SET provisioned = 1 WHERE status = 'paid' AND provisioned = 0");

  const cleanParams = (params: unknown[]) =>
    params.map((value): any => (value === undefined ? null : value));

  const arrayRows = (statement: ReturnType<DatabaseSync["prepare"]>, params: unknown[]) => {
    const names = statement.columns().map((column) => column.name);
    const records = statement.all(...cleanParams(params)) as Array<Record<string, unknown>>;
    return records.map((record) => names.map((name) => record[name] ?? null));
  };

  const database = drizzle(
    async (sql, params, method) => {
      const statement = sqlite.prepare(sql);
      if (method === "run") {
        statement.run(...cleanParams(params));
        return { rows: [] };
      }
      const rows = arrayRows(statement, params);
      return {
        rows: method === "get" ? rows[0] ?? (undefined as never) : rows,
      };
    },
    { schema },
  );

  return { database, sqlite };
}

export const isDbConfigured = !disabled;

const created = disabled ? null : createDb();

/** Typed Drizzle client. SQLite is always available unless explicitly disabled. */
export const db = created?.database ?? null;

/** Raw handle for the few operations that must be atomic across two tables. */
export const rawSqlite = created?.sqlite ?? null;
