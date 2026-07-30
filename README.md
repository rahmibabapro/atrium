# Atrium

**Fork it. Brand it. Ship a community site.**

Atrium is an open Next.js foundation for branded community websites — forums, wiki, store, members, radio, analytics, and a staff control plane — wired so you change a **site pack**, not the engine.

<img src="public/brand/logo-mark.png" alt="Atrium mark" width="96" height="96" />

## What it is

Most “community site” stacks force you to either fight a CMS or rebuild auth, admin, and modules from scratch. Atrium separates those concerns:

| Layer | Responsibility |
|---|---|
| **Engine** (`src/`, `kit/`) | Routes, Atrium ID, admin, modules |
| **Site pack** (`sites/<id>/`) | Brand, theme, copy, feature flags, content |
| **Active runtime** | `site.config.json` + `content/` (generated) |

Ship Solecraft Atelier (included demo), or create your own pack in minutes.

## Quick start

```bash
pnpm install
pnpm site:use -- shoe-atelier
pnpm atriumid:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Create your brand

```bash
pnpm site:new -- my-brand
# edit sites/my-brand/site.config.json
# replace sites/my-brand/content/*
# add assets under public/assets/
pnpm site:use -- my-brand
pnpm atriumid:migrate
pnpm dev
```

Full fork guide: **[FORK.md](./FORK.md)** · Identity notes: **[kit/ATRIUMID.md](./kit/ATRIUMID.md)** · Brand tokens: **[brand/README.md](./brand/README.md)**

## What’s included

- **Atrium ID** — Better Auth identity (username, passkeys, 2FA, admin RBAC, optional game-client device link)
- **Site foundation** — pages live / offline / countdown, header & footer, drag-and-drop home widgets, theme colors
- **Modules** — home, forums, wiki, store, members, pulse, help/support, optional map / guilds / radio
- **Staff console** — `/admin` moderation, users, audit, analytics
- **Google-ready** — GA4 / AdSense / Search Console hooks, sitemap, robots, consent mode
- **Demo pack** — Solecraft Atelier (`shoe-atelier`) so the repo looks and feels usable out of the box

## Layout

```
Atrium
├── brand/                 # Atrium mark + wordmark
├── src/                   # App Router engine
├── kit/                   # config schema + Atrium ID notes
├── sites/shoe-atelier/    # demo product pack
├── site.config.json       # ACTIVE pack config
├── content/               # ACTIVE pack content
└── public/assets/         # ACTIVE media
```

## Environment

Copy `.env.example` → `.env.local` for local secrets:

```bash
BETTER_AUTH_SECRET=          # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
ATRIUM_DB_PATH=./data/atriumid.sqlite
# ATRIUM_ADMIN_USER_IDS=     # bootstrap staff user ids
```

## Downstream products

Clone Atrium into a **private** repository for a real brand. Keep lore, member data, and ops docs only in that private fork — never push them back into this public base.

## License

See repository license (or add one before publishing). Contributions welcome once the public repo is live.
