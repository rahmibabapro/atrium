/**
 * Release-step migration runner: pnpm db:migrate
 * Applies pending app-schema migrations (Kysely) against the configured
 * database (SQLite by default, Postgres via ATRIUM_DATABASE_URL).
 * Better Auth tables are managed separately: pnpm atriumid:migrate
 */
import { runMigrations } from "../src/lib/db";

runMigrations()
  .then(() => {
    console.log("Atrium schema is up to date.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
