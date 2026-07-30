import fs from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { Kysely, PostgresDialect, SqliteDialect } from "kysely";
import { Migrator } from "kysely/migration";
import { Pool } from "pg";
import { StaticMigrationProvider } from "./migrations";
import type { Database } from "./schema";

export type DbDriver =
  | { kind: "sqlite"; sqlite: BetterSqlite3.Database }
  | { kind: "postgres"; pool: Pool };

/**
 * One process-wide connection shared by Atrium ID (Better Auth) and the
 * Kysely app layer. SQLite (WAL) by default; Postgres when
 * ATRIUM_DATABASE_URL / DATABASE_URL points at postgres://.
 */
declare global {
  var __atriumDbDriver: DbDriver | undefined;
  var __atriumDb: Kysely<Database> | undefined;
  var __atriumDbReady: Promise<void> | undefined;
}

function createDriver(): DbDriver {
  const url = process.env.ATRIUM_DATABASE_URL || process.env.DATABASE_URL;
  if (url && /^postgres(ql)?:/.test(url)) {
    return { kind: "postgres", pool: new Pool({ connectionString: url, max: 10 }) };
  }

  const dbPath =
    process.env.ATRIUM_DB_PATH ||
    path.join(process.cwd(), "data", "atrium.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new BetterSqlite3(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return { kind: "sqlite", sqlite };
}

export function getDriver(): DbDriver {
  if (!globalThis.__atriumDbDriver) {
    globalThis.__atriumDbDriver = createDriver();
  }
  return globalThis.__atriumDbDriver;
}

function createKysely(driver: DbDriver): Kysely<Database> {
  if (driver.kind === "postgres") {
    return new Kysely<Database>({
      dialect: new PostgresDialect({ pool: driver.pool }),
    });
  }
  return new Kysely<Database>({
    dialect: new SqliteDialect({ database: driver.sqlite }),
  });
}

async function migrateToLatest(db: Kysely<Database>, kind: DbDriver["kind"]) {
  const migrator = new Migrator({
    db: db as Kysely<unknown>,
    provider: new StaticMigrationProvider(kind),
  });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
}

/** App-layer database, migrated to the latest schema on first access. */
export async function getDb(): Promise<Kysely<Database>> {
  if (!globalThis.__atriumDb) {
    globalThis.__atriumDb = createKysely(getDriver());
  }
  if (!globalThis.__atriumDbReady) {
    globalThis.__atriumDbReady = migrateToLatest(
      globalThis.__atriumDb,
      getDriver().kind,
    ).catch(
      (err) => {
        globalThis.__atriumDbReady = undefined;
        throw err;
      },
    );
  }
  await globalThis.__atriumDbReady;
  return globalThis.__atriumDb;
}

/** Explicit migration entry point for release pipelines (pnpm db:migrate). */
export async function runMigrations() {
  await getDb();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
