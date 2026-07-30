# Atrium Roadmap

Where the foundation is headed. Shipped ≠ frozen — everything below the line
is direction, not a promise, and ordering follows adopter demand.

## Shipped

- Forum engine: threads, markdown posts, reactions, reports, trust levels,
  rate limits, moderation wiring (hide / purge / audit)
- Unified data layer: Kysely over SQLite (default) and Postgres, in-code
  migrations, `pnpm db:migrate`
- Full-text search (FTS5 / tsvector) on `/search`
- Notification center + header unread badge (replies, mentions, moderation)
- Atrium ID: username, passkeys, 2FA, RBAC, Discord/Google social login,
  device bridge for game clients
- Email abstraction (Resend / SMTP) for reset + verification
- XenForo importer with preserved thread URLs, BBCode → markdown, 301 map
- Self-hosting: standalone Docker image, compose (SQLite or Postgres),
  `/api/health`, fail-fast env validation, CI

## Next

- **Store checkout** — the store module renders packages but checkout is a
  stub; Stripe-first provider abstraction planned
- **Real-time pulse** — the pulse page is a placeholder; WebSocket-backed
  activity feed / chat is the intended shape
- **Wiki editing** — wiki renders pack content; in-admin editing with
  history is the goal
- **Attachments** — post uploads (S3-compatible storage) for the forum and
  the XenForo importer
- **Thread pagination + permalinks** — posts-per-page and `/posts/{id}`
  anchors for very large threads
- **Meilisearch adapter** — drop-in replacement for the built-in FTS when a
  community outgrows it (`src/lib/search` is the seam; see docs/SEARCH.md)
- **Importer coverage** — XenForo private conversations, reactions history,
  attachments; phpBB and Discourse importers

## Non-goals (for now)

- Federation (ActivityPub) — interesting, not foundational
- Plugin marketplace — forks + site packs are the extension model
- Multi-tenancy — one deployment, one community
