import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

export const isDbConfigured = Boolean(connectionString);

const client = connectionString
  ? postgres(connectionString, {
      max: 5,
      ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : "require",
    })
  : null;

/**
 * Typed Drizzle client. When DATABASE_URL is absent (local UI preview),
 * `db` is null and the data layer falls back to an in-process store.
 */
export const db = client ? drizzle(client, { schema }) : null;
