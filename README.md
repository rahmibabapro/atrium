# Atrium

**Fork it. Brand it. Ship a community.**

Atrium is an open Next.js foundation for community websites — a real forum
engine, wiki, members, notifications, full-text search, staff control plane,
and passkey-first identity — wired so you change a **site pack**, not the
engine. It is built to be the modern answer to XenForo-class forum suites,
including a first-party XenForo importer with URL preservation.

<img src="public/brand/logo-mark.png" alt="Atrium mark" width="96" height="96" />

## Why Atrium

Most “community site” stacks force you to either fight a CMS or rebuild auth,
admin, and modules from scratch. Atrium separates those concerns:

| Layer | Responsibility |
|---|---|
| **Engine** (`src/`, `kit/`) | Routes, forum, Atrium ID, admin, search, notifications |
| **Site pack** (`sites/<id>/`) | Brand, theme, copy, feature flags, seed content |
| **Active runtime** | `site.config.json` + `content/` (generated) |

Ship Solecraft Atelier (included demo), or create your own pack in minutes.

## Quick start

```bash
pnpm install
pnpm site:use -- shoe-atelier
pnpm atriumid:migrate        # identity tables
pnpm db:migrate              # forum + ops tables
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite works out of the
box; set `ATRIUM_DATABASE_URL=postgres://…` for production Postgres.

### Self-host with Docker

```bash
docker compose up -d                      # app + SQLite volume
docker compose --profile postgres up -d   # app + Postgres
```

The image is a multi-stage standalone build (non-root, `HEALTHCHECK` against
`/api/health`). Environment is validated at boot — a misconfigured container
fails fast with a readable error.

## What’s included

- **Forum engine** — categories (seeded from your site pack), threads,
  markdown replies, emoji reactions, reports, pinned/locked threads, and
  Discourse-style **trust levels** (new → member → regular) with per-day rate
  limits and link gating for new accounts
- **Atrium ID** — Better Auth identity: username, passkeys, 2FA, admin RBAC,
  Discord/Google social login (auto-enabled from env), optional game-client
  device link
- **Full-text search** — SQLite FTS5 / Postgres `tsvector` behind one module,
  wired into `/search`
- **Notifications** — replies, @mentions, moderation events; header bell with
  unread badge and a notification center
- **Staff console** — `/admin` moderation (report queue, post hide, real
  content purges), users, append-only audit log, first-party analytics
- **Email** — Resend or SMTP abstraction for password reset + verification
  (logs to stdout in dev)
- **XenForo migration** — dump importer, BBCode → markdown, thread URLs
  preserved (`/threads/slug.123` keeps working), 301 map for the rest.
  See **[MIGRATION.md](./MIGRATION.md)**
- **Site foundation** — pages live / offline / countdown, drag-and-drop home
  widgets, theme colors, GA4 / AdSense / consent mode, sitemap, robots
- **Ops** — GitHub Actions CI (lint, typecheck, test, build), Dockerfile +
  compose, Zod-validated env, `node:test` suite

## Create your brand

```bash
pnpm site:new -- my-brand
# edit sites/my-brand/site.config.json
# replace sites/my-brand/content/*
# add assets under public/assets/
pnpm site:use -- my-brand
pnpm atriumid:migrate && pnpm db:migrate
pnpm dev
```

Full fork guide: **[FORK.md](./FORK.md)** · Identity notes:
**[kit/ATRIUMID.md](./kit/ATRIUMID.md)** · Brand tokens:
**[brand/README.md](./brand/README.md)** · Direction: **[ROADMAP.md](./ROADMAP.md)**

## Layout

```
Atrium
├── brand/                 # Atrium mark + wordmark
├── src/                   # App Router engine
│   ├── lib/db/            # Kysely layer (SQLite / Postgres) + migrations
│   ├── lib/forum/         # forum service, trust levels, markdown
│   ├── lib/search/        # FTS5 / tsvector search
│   └── lib/import/        # XenForo dump parser + BBCode converter
├── kit/                   # config schema + Atrium ID notes
├── sites/shoe-atelier/    # demo product pack
├── scripts/               # db:migrate, import:xenforo, site tooling
├── site.config.json       # ACTIVE pack config
├── content/               # ACTIVE pack content
└── public/assets/         # ACTIVE media
```

## Environment

Copy `.env.example` → `.env.local`. The important ones:

```bash
BETTER_AUTH_SECRET=          # openssl rand -base64 32 (required in prod)
BETTER_AUTH_URL=http://localhost:3000
ATRIUM_DB_PATH=./data/atrium.sqlite
# ATRIUM_DATABASE_URL=postgres://…   # switches everything to Postgres
# ATRIUM_ADMIN_USER_IDS=             # bootstrap staff user ids
# RESEND_API_KEY= / ATRIUM_SMTP_URL= # email delivery
# DISCORD_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET  # social login
```

## Migrating from XenForo

```bash
mysqldump -u xf -p xenforo_db xf_user xf_node xf_thread xf_post > xenforo.sql
pnpm import:xenforo -- --dump xenforo.sql
```

Threads keep their original URLs. Members sign in via the password-reset
flow. Details in **[MIGRATION.md](./MIGRATION.md)**.

## Downstream products

Clone Atrium into a **private** repository for a real brand. Keep lore,
member data, and ops docs only in that private fork — never push them back
into this public base. Pull engine updates from Atrium as an upstream remote.

## License

See repository license (or add one before publishing). Contributions welcome
once the public repo is live.
