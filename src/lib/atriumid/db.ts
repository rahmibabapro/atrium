import type BetterSqlite3 from "better-sqlite3";
import type { Pool } from "pg";
import { getDriver } from "@/lib/db";

export type AtriumIdDatabase = BetterSqlite3.Database | Pool;

/**
 * Atrium ID shares the app's single database connection:
 * - Default / local: SQLite file (ATRIUM_DB_PATH, WAL)
 * - Production: Postgres via ATRIUM_DATABASE_URL / DATABASE_URL
 */
export function createAtriumIdDatabase(): AtriumIdDatabase {
  const driver = getDriver();
  return driver.kind === "postgres" ? driver.pool : driver.sqlite;
}

export function isPostgres(db: AtriumIdDatabase): db is Pool {
  return getDriver().kind === "postgres" && !("pragma" in db);
}
