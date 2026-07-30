import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createPool, type Pool } from "mysql2/promise";

export type AtriumIdDatabase = Database.Database | Pool;

/**
 * Atrium ID database factory.
 * - Default / local: SQLite file (ATRIUM_DB_PATH)
 * - Production MariaDB/MySQL: ATRIUM_DATABASE_URL=mysql://...
 */
export function createAtriumIdDatabase(): AtriumIdDatabase {
  const mysqlUrl = process.env.ATRIUM_DATABASE_URL || process.env.DATABASE_URL;
  if (mysqlUrl && mysqlUrl.startsWith("mysql")) {
    return createPool(mysqlUrl);
  }

  const dbPath =
    process.env.ATRIUM_DB_PATH ||
    path.join(process.cwd(), "data", "atriumid.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export function isMysql(db: AtriumIdDatabase): db is Pool {
  return typeof (db as Pool).query === "function" && !("pragma" in db);
}
