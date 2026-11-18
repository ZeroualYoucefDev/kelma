import path from "node:path";
import { defineConfig } from "drizzle-kit";

const configured = process.env.DATABASE_URL?.trim();
const useDefault =
  !configured || /^(0|false|none|disabled|postgres(?:ql)?:\/\/)/i.test(configured);
const databasePath = useDefault
  ? "./kelma.db"
  : configured.replace(/^sqlite:/i, "").replace(/^file:/i, "");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(process.cwd(), databasePath),
  },
});
