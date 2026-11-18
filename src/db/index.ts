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

  const cleanParams = (params: unknown[]) =>
    params.map((value): any => (value === undefined ? null : value));

  const arrayRows = (statement: ReturnType<DatabaseSync["prepare"]>, params: unknown[]) => {
    const names = statement.columns().map((column) => column.name);
    const records = statement.all(...cleanParams(params)) as Array<Record<string, unknown>>;
    return records.map((record) => names.map((name) => record[name] ?? null));
  };

  return drizzle(
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
}

export const isDbConfigured = !disabled;

/** Typed Drizzle client. SQLite is always available unless explicitly disabled. */
export const db = disabled ? null : createDb();
