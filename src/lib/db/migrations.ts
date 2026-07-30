import { sql, type Kysely } from "kysely";
import type { Migration, MigrationProvider } from "kysely/migration";

export type DriverKind = "sqlite" | "postgres";

/**
 * In-code migrations, executed in key order by Kysely's Migrator.
 * DDL below sticks to portable column types (text / integer) so the same
 * migration runs on SQLite and Postgres.
 */
const migrations: Record<string, Migration> = {
  "0001_ops_stores": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("site_config")
        .addColumn("id", "integer", (c) => c.primaryKey())
        .addColumn("overrides", "text", (c) => c.notNull())
        .addColumn("updated_at", "text", (c) => c.notNull())
        .execute();

      await db.schema
        .createTable("audit_log")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("at", "text", (c) => c.notNull())
        .addColumn("actor_id", "text", (c) => c.notNull())
        .addColumn("actor_label", "text", (c) => c.notNull())
        .addColumn("action", "text", (c) => c.notNull())
        .addColumn("target", "text")
        .addColumn("meta", "text")
        .addColumn("ip", "text")
        .execute();
      await db.schema
        .createIndex("audit_log_at_idx")
        .on("audit_log")
        .column("at")
        .execute();

      await db.schema
        .createTable("moderation_warnings")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("at", "text", (c) => c.notNull())
        .addColumn("user_id", "text", (c) => c.notNull())
        .addColumn("username", "text")
        .addColumn("reason", "text", (c) => c.notNull())
        .addColumn("by_id", "text", (c) => c.notNull())
        .addColumn("by_label", "text", (c) => c.notNull())
        .execute();

      await db.schema
        .createTable("moderation_notes")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("at", "text", (c) => c.notNull())
        .addColumn("user_id", "text", (c) => c.notNull())
        .addColumn("body", "text", (c) => c.notNull())
        .addColumn("by_id", "text", (c) => c.notNull())
        .addColumn("by_label", "text", (c) => c.notNull())
        .execute();

      await db.schema
        .createTable("moderation_purges")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("at", "text", (c) => c.notNull())
        .addColumn("user_id", "text", (c) => c.notNull())
        .addColumn("username", "text")
        .addColumn("scope", "text", (c) => c.notNull())
        .addColumn("status", "text", (c) => c.notNull())
        .addColumn("note", "text")
        .addColumn("by_id", "text", (c) => c.notNull())
        .addColumn("by_label", "text", (c) => c.notNull())
        .addColumn("processed_at", "text")
        .execute();

      await db.schema
        .createTable("analytics_pages")
        .addColumn("path", "text", (c) => c.primaryKey())
        .addColumn("views", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("dwell_ms", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("clicks", "integer", (c) => c.notNull().defaultTo(0))
        .execute();

      await db.schema
        .createTable("analytics_sessions")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("first_at", "text", (c) => c.notNull())
        .addColumn("last_at", "text", (c) => c.notNull())
        .addColumn("dwell_ms", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("pageviews", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("user_id", "text")
        .addColumn("user_label", "text")
        .addColumn("paths", "text", (c) => c.notNull().defaultTo("[]"))
        .execute();
      await db.schema
        .createIndex("analytics_sessions_last_at_idx")
        .on("analytics_sessions")
        .column("last_at")
        .execute();

      await db.schema
        .createTable("analytics_clicks")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("at", "text", (c) => c.notNull())
        .addColumn("path", "text", (c) => c.notNull())
        .addColumn("target", "text", (c) => c.notNull())
        .addColumn("session_id", "text", (c) => c.notNull())
        .addColumn("user_id", "text")
        .execute();
      await db.schema
        .createIndex("analytics_clicks_at_idx")
        .on("analytics_clicks")
        .column("at")
        .execute();

      await db.schema
        .createTable("analytics_totals")
        .addColumn("id", "integer", (c) => c.primaryKey())
        .addColumn("pageviews", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("sessions", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("dwell_ms", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("clicks", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("updated_at", "text")
        .execute();
    },
  },

  "0002_forum_core": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("forum_categories")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("slug", "text", (c) => c.notNull().unique())
        .addColumn("title", "text", (c) => c.notNull())
        .addColumn("description", "text")
        .addColumn("position", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("locked", "integer", (c) => c.notNull().defaultTo(0))
        .execute();

      await db.schema
        .createTable("forum_threads")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("category_id", "text", (c) => c.notNull())
        .addColumn("slug", "text", (c) => c.notNull().unique())
        .addColumn("title", "text", (c) => c.notNull())
        .addColumn("author_id", "text", (c) => c.notNull())
        .addColumn("author_label", "text", (c) => c.notNull())
        .addColumn("created_at", "text", (c) => c.notNull())
        .addColumn("updated_at", "text", (c) => c.notNull())
        .addColumn("last_post_at", "text", (c) => c.notNull())
        .addColumn("reply_count", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("pinned", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("locked", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("hidden", "integer", (c) => c.notNull().defaultTo(0))
        .execute();
      await db.schema
        .createIndex("forum_threads_category_idx")
        .on("forum_threads")
        .columns(["category_id", "last_post_at"])
        .execute();
      await db.schema
        .createIndex("forum_threads_author_idx")
        .on("forum_threads")
        .column("author_id")
        .execute();

      await db.schema
        .createTable("forum_posts")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("thread_id", "text", (c) => c.notNull())
        .addColumn("author_id", "text", (c) => c.notNull())
        .addColumn("author_label", "text", (c) => c.notNull())
        .addColumn("body", "text", (c) => c.notNull())
        .addColumn("created_at", "text", (c) => c.notNull())
        .addColumn("edited_at", "text")
        .addColumn("hidden", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("hidden_by", "text")
        .addColumn("hidden_reason", "text")
        .execute();
      await db.schema
        .createIndex("forum_posts_thread_idx")
        .on("forum_posts")
        .columns(["thread_id", "created_at"])
        .execute();
      await db.schema
        .createIndex("forum_posts_author_idx")
        .on("forum_posts")
        .column("author_id")
        .execute();

      await db.schema
        .createTable("forum_reactions")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("post_id", "text", (c) => c.notNull())
        .addColumn("user_id", "text", (c) => c.notNull())
        .addColumn("emoji", "text", (c) => c.notNull())
        .addColumn("at", "text", (c) => c.notNull())
        .execute();
      await db.schema
        .createIndex("forum_reactions_post_user_idx")
        .on("forum_reactions")
        .columns(["post_id", "user_id", "emoji"])
        .unique()
        .execute();

      await db.schema
        .createTable("forum_reports")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("post_id", "text", (c) => c.notNull())
        .addColumn("reporter_id", "text", (c) => c.notNull())
        .addColumn("reason", "text", (c) => c.notNull())
        .addColumn("status", "text", (c) => c.notNull().defaultTo("open"))
        .addColumn("at", "text", (c) => c.notNull())
        .addColumn("resolved_by", "text")
        .addColumn("resolved_at", "text")
        .execute();
      await db.schema
        .createIndex("forum_reports_status_idx")
        .on("forum_reports")
        .column("status")
        .execute();

      await db.schema
        .createTable("notifications")
        .addColumn("id", "text", (c) => c.primaryKey())
        .addColumn("user_id", "text", (c) => c.notNull())
        .addColumn("kind", "text", (c) => c.notNull())
        .addColumn("title", "text", (c) => c.notNull())
        .addColumn("body", "text")
        .addColumn("href", "text")
        .addColumn("actor_label", "text")
        .addColumn("read", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("at", "text", (c) => c.notNull())
        .execute();
      await db.schema
        .createIndex("notifications_user_idx")
        .on("notifications")
        .columns(["user_id", "read", "at"])
        .execute();

      await db.schema
        .createTable("user_stats")
        .addColumn("user_id", "text", (c) => c.primaryKey())
        .addColumn("first_seen_at", "text", (c) => c.notNull())
        .addColumn("post_count", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("thread_count", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("reactions_received", "integer", (c) => c.notNull().defaultTo(0))
        .execute();
    },
  },
};

/**
 * Full-text search is the one place the dialects diverge:
 * SQLite gets an FTS5 shadow table maintained by triggers, Postgres gets a
 * tsvector column with a GIN index and an equivalent trigger.
 */
function searchMigration(kind: DriverKind): Migration {
  if (kind === "sqlite") {
    return {
      async up(db: Kysely<unknown>) {
        await sql`
          CREATE VIRTUAL TABLE IF NOT EXISTS forum_fts USING fts5(
            post_id UNINDEXED,
            thread_id UNINDEXED,
            title,
            body
          )
        `.execute(db);
        await sql`
          INSERT INTO forum_fts (post_id, thread_id, title, body)
          SELECT p.id, p.thread_id, t.title, p.body
          FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id
        `.execute(db);
        await sql`
          CREATE TRIGGER IF NOT EXISTS forum_posts_fts_ai
          AFTER INSERT ON forum_posts BEGIN
            INSERT INTO forum_fts (post_id, thread_id, title, body)
            VALUES (
              new.id,
              new.thread_id,
              coalesce((SELECT title FROM forum_threads WHERE id = new.thread_id), ''),
              new.body
            );
          END
        `.execute(db);
        await sql`
          CREATE TRIGGER IF NOT EXISTS forum_posts_fts_ad
          AFTER DELETE ON forum_posts BEGIN
            DELETE FROM forum_fts WHERE post_id = old.id;
          END
        `.execute(db);
        await sql`
          CREATE TRIGGER IF NOT EXISTS forum_posts_fts_au
          AFTER UPDATE OF body ON forum_posts BEGIN
            UPDATE forum_fts SET body = new.body WHERE post_id = new.id;
          END
        `.execute(db);
      },
    };
  }

  return {
    async up(db: Kysely<unknown>) {
      await sql`ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS search_tsv tsvector`.execute(db);
      await sql`
        UPDATE forum_posts p SET search_tsv = to_tsvector('simple',
          coalesce((SELECT title FROM forum_threads t WHERE t.id = p.thread_id), '') || ' ' || p.body)
      `.execute(db);
      await sql`
        CREATE INDEX IF NOT EXISTS forum_posts_search_idx
        ON forum_posts USING GIN (search_tsv)
      `.execute(db);
      await sql`
        CREATE OR REPLACE FUNCTION forum_posts_tsv_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_tsv := to_tsvector('simple',
            coalesce((SELECT title FROM forum_threads t WHERE t.id = NEW.thread_id), '') || ' ' || NEW.body);
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql
      `.execute(db);
      await sql`DROP TRIGGER IF EXISTS forum_posts_tsv_trg ON forum_posts`.execute(db);
      await sql`
        CREATE TRIGGER forum_posts_tsv_trg
        BEFORE INSERT OR UPDATE OF body ON forum_posts
        FOR EACH ROW EXECUTE FUNCTION forum_posts_tsv_update()
      `.execute(db);
    },
  };
}

export class StaticMigrationProvider implements MigrationProvider {
  constructor(private kind: DriverKind) {}

  async getMigrations() {
    return {
      ...migrations,
      "0003_forum_search": searchMigration(this.kind),
    };
  }
}
