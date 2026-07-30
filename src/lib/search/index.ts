import { sql } from "kysely";
import { getDb, getDriver } from "@/lib/db";

/**
 * Forum full-text search behind one interface:
 * - SQLite: FTS5 shadow table (forum_fts), bm25 ranking
 * - Postgres: tsvector + GIN, ts_rank ordering
 * Upgrade path to an external engine (Meilisearch) is documented in
 * docs/SEARCH.md — swap this module, keep the call sites.
 */
export type ForumSearchHit = {
  postId: string;
  threadSlug: string;
  threadTitle: string;
  authorLabel: string;
  excerpt: string;
  createdAt: string;
};

/** Turns free text into a safe FTS5 query: quoted prefix tokens, AND'ed. */
function ftsQuery(input: string): string {
  const tokens = input
    .replace(/["'*]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  return tokens.map((t) => `"${t}"*`).join(" ");
}

function excerpt(body: string, query: string): string {
  const needle = query.split(/\s+/)[0]?.toLowerCase() || "";
  const idx = needle ? body.toLowerCase().indexOf(needle) : -1;
  const start = idx > 60 ? idx - 60 : 0;
  const slice = body.slice(start, start + 220);
  return `${start > 0 ? "…" : ""}${slice}${start + 220 < body.length ? "…" : ""}`;
}

export async function searchForum(
  query: string,
  limit = 20,
): Promise<ForumSearchHit[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];
  const db = await getDb();

  if (getDriver().kind === "sqlite") {
    const match = ftsQuery(q);
    if (!match) return [];
    const res = await sql<{
      post_id: string;
      slug: string;
      title: string;
      author_label: string;
      body: string;
      created_at: string;
    }>`
      SELECT f.post_id, t.slug, t.title, p.author_label, p.body, p.created_at
      FROM forum_fts f
      JOIN forum_posts p ON p.id = f.post_id
      JOIN forum_threads t ON t.id = p.thread_id
      WHERE forum_fts MATCH ${match}
        AND p.hidden = 0 AND t.hidden = 0
      ORDER BY rank
      LIMIT ${limit}
    `.execute(db);
    return res.rows.map((r) => ({
      postId: r.post_id,
      threadSlug: r.slug,
      threadTitle: r.title,
      authorLabel: r.author_label,
      excerpt: excerpt(r.body, q),
      createdAt: r.created_at,
    }));
  }

  const res = await sql<{
    post_id: string;
    slug: string;
    title: string;
    author_label: string;
    body: string;
    created_at: string;
  }>`
    SELECT p.id AS post_id, t.slug, t.title, p.author_label, p.body, p.created_at
    FROM forum_posts p
    JOIN forum_threads t ON t.id = p.thread_id
    WHERE p.search_tsv @@ plainto_tsquery('simple', ${q})
      AND p.hidden = 0 AND t.hidden = 0
    ORDER BY ts_rank(p.search_tsv, plainto_tsquery('simple', ${q})) DESC
    LIMIT ${limit}
  `.execute(db);
  return res.rows.map((r) => ({
    postId: r.post_id,
    threadSlug: r.slug,
    threadTitle: r.title,
    authorLabel: r.author_label,
    excerpt: excerpt(r.body, q),
    createdAt: r.created_at,
  }));
}
