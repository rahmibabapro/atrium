/**
 * XenForo → Atrium importer.
 *
 *   pnpm import:xenforo -- --dump backup.sql [--redirect-base ""]
 *
 * Reads a XenForo MySQL dump (mysqldump output) and:
 *   1. imports forum nodes → forum_categories (slug "{xf-slug}.{node_id}")
 *   2. imports threads + posts (BBCode → markdown), preserving XenForo
 *      thread URLs: /threads/{xf-slug}.{thread_id} works natively
 *   3. imports users into the Atrium ID `user` table when it exists
 *      (passwords cannot migrate — members use the password-reset flow)
 *   4. writes data/xenforo-redirects.json (301 map for /forums/* nodes)
 *
 * Target database: SQLite (ATRIUM_DB_PATH) or Postgres (ATRIUM_DATABASE_URL),
 * same as the app. Run `pnpm atriumid:migrate` first if you want user import.
 */
import fs from "node:fs";
import path from "node:path";
import { sql } from "kysely";
import { bbcodeToMarkdown } from "../src/lib/import/bbcode";
import {
  parseXenForoDump,
  xenforoSlug,
  type DumpRow,
} from "../src/lib/import/xenforo-dump";
import { getDb, newId } from "../src/lib/db";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function isoFromUnix(value: unknown): string {
  const n = Number(value);
  return new Date((Number.isFinite(n) && n > 0 ? n : 0) * 1000).toISOString();
}

async function main() {
  const dumpPath = arg("dump");
  if (!dumpPath || !fs.existsSync(dumpPath)) {
    console.error("Usage: pnpm import:xenforo -- --dump path/to/xenforo.sql");
    process.exit(1);
  }

  console.log(`Parsing ${dumpPath}…`);
  const dump = parseXenForoDump(fs.readFileSync(dumpPath, "utf8"));
  console.log(
    `Found: ${dump.users.length} users, ${dump.nodes.length} nodes, ` +
      `${dump.threads.length} threads, ${dump.posts.length} posts`,
  );

  const db = await getDb();
  const redirects: Record<string, string> = {};

  // 1. Forum nodes → categories.
  const forumNodes = dump.nodes.filter(
    (n) => !n.node_type_id || n.node_type_id === "Forum",
  );
  const nodeSlug = new Map<number, string>();
  for (const node of forumNodes) {
    const nodeId = Number(node.node_id);
    const title = String(node.title ?? `forum-${nodeId}`);
    const slug = `${xenforoSlug(title)}.${nodeId}`;
    nodeSlug.set(nodeId, slug);
    await db
      .insertInto("forum_categories")
      .values({
        id: newId(),
        slug,
        title: JSON.stringify({ tr: title, en: title }),
        description: node.description ? String(node.description) : null,
        position: Number(node.display_order ?? 0),
        locked: 0,
      })
      .onConflict((oc) => oc.column("slug").doNothing())
      .execute();
    redirects[`/forums/${xenforoSlug(title)}.${nodeId}`] = `/forums/${slug}`;
  }

  const categoryRows = await db
    .selectFrom("forum_categories")
    .select(["id", "slug"])
    .execute();
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  // 2. Threads + posts.
  const postsByThread = new Map<number, DumpRow[]>();
  for (const post of dump.posts) {
    if (post.message_state && post.message_state !== "visible") continue;
    const tid = Number(post.thread_id);
    const list = postsByThread.get(tid) ?? [];
    list.push(post);
    postsByThread.set(tid, list);
  }

  let importedThreads = 0;
  let importedPosts = 0;
  for (const thread of dump.threads) {
    if (thread.discussion_state && thread.discussion_state !== "visible") {
      continue;
    }
    const threadId = Number(thread.thread_id);
    const title = String(thread.title ?? `Thread ${threadId}`);
    // Preserves the XenForo URL: /threads/{slug}.{id} keeps working as-is.
    const slug = `${xenforoSlug(title)}.${threadId}`;
    const catSlug = nodeSlug.get(Number(thread.node_id));
    const categoryId = catSlug ? categoryIdBySlug.get(catSlug) : undefined;
    if (!categoryId) continue;

    const posts = (postsByThread.get(threadId) ?? []).sort(
      (a, b) => Number(a.post_date ?? 0) - Number(b.post_date ?? 0),
    );
    if (!posts.length) continue;

    const createdAt = isoFromUnix(thread.post_date);
    const lastPostAt = isoFromUnix(
      thread.last_post_date ?? posts[posts.length - 1]!.post_date,
    );

    const dbThreadId = newId();
    const inserted = await db
      .insertInto("forum_threads")
      .values({
        id: dbThreadId,
        category_id: categoryId,
        slug,
        title,
        author_id: `xf:${thread.user_id ?? 0}`,
        author_label: String(thread.username ?? "member"),
        created_at: createdAt,
        updated_at: lastPostAt,
        last_post_at: lastPostAt,
        reply_count: Math.max(0, posts.length - 1),
        pinned: Number(thread.sticky ?? 0) ? 1 : 0,
        locked: Number(thread.discussion_open ?? 1) ? 0 : 1,
        hidden: 0,
      })
      .onConflict((oc) => oc.column("slug").doNothing())
      .executeTakeFirst();
    if (Number(inserted.numInsertedOrUpdatedRows ?? 1) === 0) continue;
    importedThreads += 1;

    for (const post of posts) {
      await db
        .insertInto("forum_posts")
        .values({
          id: newId(),
          thread_id: dbThreadId,
          author_id: `xf:${post.user_id ?? 0}`,
          author_label: String(post.username ?? "member"),
          body: bbcodeToMarkdown(String(post.message ?? "")),
          created_at: isoFromUnix(post.post_date),
          edited_at: null,
          hidden: 0,
          hidden_by: null,
          hidden_reason: null,
        })
        .execute();
      importedPosts += 1;
    }
  }

  // 3. Users → Atrium ID (best effort; requires better-auth tables).
  let importedUsers = 0;
  let skippedUsers = 0;
  try {
    await sql`SELECT 1 FROM "user" LIMIT 1`.execute(db);
    for (const user of dump.users) {
      const email = String(user.email ?? "").trim();
      const username = String(user.username ?? "").trim();
      if (!email || !username) {
        skippedUsers += 1;
        continue;
      }
      const normalized = username.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const createdAt = isoFromUnix(user.register_date);
      try {
        await sql`
          INSERT INTO "user" (id, name, email, "emailVerified", username, "displayUsername", role, "createdAt", "updatedAt")
          VALUES (${`xf:${user.user_id}`}, ${username}, ${email}, ${0}, ${normalized}, ${username}, ${"user"}, ${createdAt}, ${createdAt})
        `.execute(db);
        importedUsers += 1;
      } catch {
        skippedUsers += 1; // duplicate email/username or schema drift
      }
    }
  } catch {
    console.warn(
      "User import skipped — run `pnpm atriumid:migrate` first to create Atrium ID tables.",
    );
  }

  // 4. Redirect map (nodes + common XenForo routes).
  redirects["/whats-new"] = "/whats-new/posts";
  redirects["/find-new/posts"] = "/whats-new/posts";
  const redirectPath = path.join(process.cwd(), "data", "xenforo-redirects.json");
  fs.mkdirSync(path.dirname(redirectPath), { recursive: true });
  fs.writeFileSync(redirectPath, JSON.stringify(redirects, null, 2) + "\n");

  console.log("");
  console.log("Import complete:");
  console.log(`  categories : ${forumNodes.length}`);
  console.log(`  threads    : ${importedThreads}`);
  console.log(`  posts      : ${importedPosts}`);
  console.log(`  users      : ${importedUsers} imported, ${skippedUsers} skipped`);
  console.log(`  redirects  : ${redirectPath}`);
  console.log("");
  console.log(
    "Thread URLs are preserved (/threads/{slug}.{id}). Members sign in via the",
  );
  console.log(
    'password-reset flow ("Forgot password") — XenForo hashes cannot migrate.',
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
