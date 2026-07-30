# Migrating from XenForo to Atrium

Atrium ships a first-party importer that moves a XenForo community — forums,
threads, posts, and members — into Atrium while **preserving your thread
URLs**, which is usually the most expensive part of leaving XenForo.

## What migrates

| XenForo | Atrium | Notes |
| --- | --- | --- |
| Forum nodes | `forum_categories` | slug `{xf-slug}.{node_id}` |
| Threads | `forum_threads` | slug `{xf-slug}.{thread_id}` — original URLs keep working |
| Posts | `forum_posts` | BBCode converted to markdown |
| Sticky / locked flags | `pinned` / `locked` | preserved |
| Members | Atrium ID `user` table | username + email + join date |
| Passwords | — | cannot migrate (different hash storage); members use the password-reset flow |
| Attachments, PMs, reactions | — | not yet imported (see ROADMAP) |

Deleted/moderated threads and posts are skipped. Non-forum nodes
(link forums, pages, categories) are skipped.

## Step by step

### 1. Export your XenForo database

```bash
mysqldump -u xf_user -p xenforo_db \
  xf_user xf_node xf_thread xf_post > xenforo.sql
```

A full-database dump also works — the importer only reads those four tables.

### 2. Prepare Atrium

```bash
cp .env.example .env.local        # set BETTER_AUTH_SECRET etc.
pnpm install
pnpm atriumid:migrate             # Atrium ID (auth) tables — needed for user import
pnpm db:migrate                   # forum + ops tables
```

Point `ATRIUM_DB_PATH` (SQLite) or `ATRIUM_DATABASE_URL` (Postgres) at the
database you will run in production.

### 3. Run the importer

```bash
pnpm import:xenforo -- --dump xenforo.sql
```

The importer is idempotent for threads and categories (existing slugs are
left untouched), so a re-run after a fresh dump only adds new content.

### 4. URLs and redirects

- **Threads need nothing.** XenForo's `/threads/my-topic.12345/` is imported
  as slug `my-topic.12345`, so the same URL renders the thread in Atrium.
- Forum nodes and a few utility routes get a 301 map written to
  `data/xenforo-redirects.json`. It is automatically included in
  `next.config.ts` `redirects()` at the next build.
- Add your own entries to that JSON for custom routes (route → destination).

### 5. Tell your members

Passwords cannot be migrated — XenForo's password storage is not compatible
with Atrium ID. Imported members sign in the first time via
**Log in → Forgot password** with their old email address. If you have email
configured (`RESEND_API_KEY` or `ATRIUM_SMTP_URL`), reset mails go out
automatically.

## BBCode conversion reference

| BBCode | Markdown |
| --- | --- |
| `[b]` `[i]` `[s]` | `**bold**` `*italic*` `~~strike~~` |
| `[url=…]label[/url]` | `[label](…)` |
| `[img]src[/img]` | plain link |
| `[quote=name]` | `> **name said:**` blockquote |
| `[code]` / `[icode]` | fenced / inline code |
| `[list]` / `[list=1]` | `-` / `1.` lists |
| `[media=youtube]id[/media]` | YouTube watch link |
| `[size]` `[color]` `[font]` `[center]` … | stripped, content kept |
| `[spoiler]` | labelled blockquote |

## Not imported yet

Attachments, private conversations, reactions history, warnings, and custom
user fields. If you need one of these, open an issue — the dump parser
(`src/lib/import/xenforo-dump.ts`) is deliberately easy to extend.
