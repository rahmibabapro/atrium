# Search architecture

Forum search lives behind one module: `src/lib/search/index.ts` exposing
`searchForum(query, limit)`. Call sites (the `/search` page) never know which
backend answered.

## Built-in backends

| Database | Mechanism | Kept in sync by |
|---|---|---|
| SQLite (default) | FTS5 table `forum_fts`, bm25 ranking | triggers on `forum_posts` (insert/update/delete) |
| Postgres | `forum_posts.search_tsv` tsvector + GIN, `ts_rank` | `BEFORE INSERT OR UPDATE` trigger |

Both are created by migration `0003_forum_search` and seeded from existing
posts, so enabling search on an imported forum requires nothing extra.

User input is sanitized before hitting FTS5 (tokens are quoted and joined,
so `NEAR/`, `*`, quotes and parentheses cannot break the query).

## Scaling up: Meilisearch (documented, not built)

When a community outgrows database FTS (millions of posts, typo tolerance,
faceting), the seam is this module:

1. Run Meilisearch and create a `posts` index with `threadSlug`,
   `threadTitle`, `body`, `authorLabel`, `createdAt`.
2. Index writes: mirror `createThread` / `createReply` / `editPost` /
   `moderatePost` / purge operations to Meilisearch (a small wrapper around
   the forum service, or a periodic reindex job reading `forum_posts`).
3. Replace the body of `searchForum()` with a Meilisearch query returning
   the same `ForumSearchHit` shape.

Nothing else in the app changes.
