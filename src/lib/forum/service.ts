import { sql } from "kysely";
import { getDb, newId, nowIso } from "@/lib/db";
import type {
  ForumPostTable,
  ForumThreadTable,
} from "@/lib/db/schema";
import { pickLocalized, type Lang } from "@/lib/i18n";
import type { Localized } from "@/lib/site-types";
import { createNotification } from "@/lib/notifications/service";
import { containsLink, extractMentions } from "./markdown";
import { computeTrustLevel, trustLimits, type TrustLevel } from "./trust";

export type ForumUser = {
  id: string;
  label: string;
  createdAt?: Date | string | null;
  isStaff: boolean;
};

export class ForumError extends Error {
  constructor(
    public code:
      | "RATE_LIMITED"
      | "LINKS_NOT_ALLOWED"
      | "LOCKED"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "INVALID",
    message: string,
  ) {
    super(message);
  }
}

/** Idempotent: makes sure every pack forum slug exists as a DB category. */
export async function ensureCategories(
  forums: Array<{ slug: string; title: Localized; position?: number }>,
) {
  const db = await getDb();
  let position = 0;
  for (const forum of forums) {
    await db
      .insertInto("forum_categories")
      .values({
        id: newId(),
        slug: forum.slug,
        title: JSON.stringify(forum.title),
        description: null,
        position: forum.position ?? position,
        locked: 0,
      })
      .onConflict((oc) =>
        oc.column("slug").doUpdateSet({ title: JSON.stringify(forum.title) }),
      )
      .execute();
    position += 1;
  }
}

export function categoryTitle(titleJson: string, lang: Lang): string {
  try {
    return pickLocalized(JSON.parse(titleJson) as Localized, lang) || titleJson;
  } catch {
    return titleJson;
  }
}

export type CategoryStats = {
  slug: string;
  threadCount: number;
  postCount: number;
  latestThread: { slug: string; title: string; lastPostAt: string } | null;
};

export async function categoryStats(slugs: string[]): Promise<Map<string, CategoryStats>> {
  const db = await getDb();
  const map = new Map<string, CategoryStats>();
  for (const slug of slugs) {
    map.set(slug, { slug, threadCount: 0, postCount: 0, latestThread: null });
  }
  if (!slugs.length) return map;

  const categories = await db
    .selectFrom("forum_categories")
    .select(["id", "slug"])
    .where("slug", "in", slugs)
    .execute();
  const idToSlug = new Map(categories.map((c) => [c.id, c.slug]));
  if (!categories.length) return map;

  const rows = await db
    .selectFrom("forum_threads")
    .select(({ fn }) => [
      "category_id",
      fn.countAll().as("threads"),
      fn.sum("reply_count").as("replies"),
      fn.max("last_post_at").as("latest"),
    ])
    .where("hidden", "=", 0)
    .where("category_id", "in", categories.map((c) => c.id))
    .groupBy("category_id")
    .execute();

  for (const row of rows) {
    const slug = idToSlug.get(row.category_id);
    if (!slug) continue;
    const stat = map.get(slug)!;
    stat.threadCount = Number(row.threads);
    stat.postCount = Number(row.replies ?? 0);
  }

  // Latest thread per category (small N — one query per active category).
  for (const cat of categories) {
    const latest = await db
      .selectFrom("forum_threads")
      .select(["slug", "title", "last_post_at"])
      .where("category_id", "=", cat.id)
      .where("hidden", "=", 0)
      .orderBy("last_post_at", "desc")
      .limit(1)
      .executeTakeFirst();
    if (latest) {
      map.get(cat.slug)!.latestThread = {
        slug: latest.slug,
        title: latest.title,
        lastPostAt: latest.last_post_at,
      };
    }
  }
  return map;
}

export async function listThreads(categorySlug: string, limit = 50) {
  const db = await getDb();
  const category = await db
    .selectFrom("forum_categories")
    .selectAll()
    .where("slug", "=", categorySlug)
    .executeTakeFirst();
  if (!category) return { category: null, threads: [] as ForumThreadTable[] };
  const threads = await db
    .selectFrom("forum_threads")
    .selectAll()
    .where("category_id", "=", category.id)
    .where("hidden", "=", 0)
    .orderBy("pinned", "desc")
    .orderBy("last_post_at", "desc")
    .limit(limit)
    .execute();
  return { category, threads };
}

export type ThreadWithPosts = {
  thread: ForumThreadTable;
  categorySlug: string | null;
  posts: Array<
    ForumPostTable & {
      reactions: Array<{ emoji: string; count: number; mine: boolean }>;
    }
  >;
};

export async function getThread(
  slug: string,
  viewerId?: string,
): Promise<ThreadWithPosts | null> {
  const db = await getDb();
  const thread = await db
    .selectFrom("forum_threads")
    .selectAll()
    .where("slug", "=", slug)
    .executeTakeFirst();
  if (!thread) return null;

  const category = await db
    .selectFrom("forum_categories")
    .select("slug")
    .where("id", "=", thread.category_id)
    .executeTakeFirst();

  const posts = await db
    .selectFrom("forum_posts")
    .selectAll()
    .where("thread_id", "=", thread.id)
    .orderBy("created_at", "asc")
    .limit(500)
    .execute();

  const postIds = posts.map((p) => p.id);
  const reactionRows = postIds.length
    ? await db
        .selectFrom("forum_reactions")
        .select(["post_id", "emoji", "user_id"])
        .where("post_id", "in", postIds)
        .execute()
    : [];

  const grouped = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const r of reactionRows) {
    let byEmoji = grouped.get(r.post_id);
    if (!byEmoji) {
      byEmoji = new Map();
      grouped.set(r.post_id, byEmoji);
    }
    const entry = byEmoji.get(r.emoji) || { count: 0, mine: false };
    entry.count += 1;
    if (viewerId && r.user_id === viewerId) entry.mine = true;
    byEmoji.set(r.emoji, entry);
  }

  return {
    thread,
    categorySlug: category?.slug ?? null,
    posts: posts.map((p) => ({
      ...p,
      reactions: [...(grouped.get(p.id) ?? new Map())].map(([emoji, e]) => ({
        emoji,
        count: e.count,
        mine: e.mine,
      })),
    })),
  };
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "thread"
  );
}

async function trustFor(user: ForumUser): Promise<{
  level: TrustLevel;
  limits: ReturnType<typeof trustLimits>;
}> {
  const db = await getDb();
  const stats = await db
    .selectFrom("user_stats")
    .selectAll()
    .where("user_id", "=", user.id)
    .executeTakeFirst();
  const level = computeTrustLevel({
    accountCreatedAt: user.createdAt,
    stats: stats ?? null,
  });
  return { level, limits: trustLimits(level) };
}

async function bumpUserStats(
  userId: string,
  delta: { posts?: number; threads?: number; reactions?: number },
) {
  const db = await getDb();
  await db
    .insertInto("user_stats")
    .values({
      user_id: userId,
      first_seen_at: nowIso(),
      post_count: delta.posts ?? 0,
      thread_count: delta.threads ?? 0,
      reactions_received: delta.reactions ?? 0,
    })
    .onConflict((oc) =>
      oc.column("user_id").doUpdateSet((eb) => ({
        post_count: eb("user_stats.post_count", "+", delta.posts ?? 0),
        thread_count: eb("user_stats.thread_count", "+", delta.threads ?? 0),
        reactions_received: eb(
          "user_stats.reactions_received",
          "+",
          delta.reactions ?? 0,
        ),
      })),
    )
    .execute();
}

async function countRecent(
  table: "forum_threads" | "forum_posts",
  authorId: string,
): Promise<number> {
  const db = await getDb();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const row = await db
    .selectFrom(table)
    .select((eb) => eb.fn.countAll().as("n"))
    .where("author_id", "=", authorId)
    .where("created_at", ">", since)
    .executeTakeFirst();
  return Number(row?.n ?? 0);
}

async function notifyMentions(input: {
  body: string;
  actor: ForumUser;
  href: string;
  threadTitle: string;
}) {
  const mentions = extractMentions(input.body);
  if (!mentions.length) return;
  const db = await getDb();
  try {
    const rows = await sql<{ id: string; username: string | null }>`
      select id, username from "user"
      where username in (${sql.join(mentions)})
    `.execute(db);
    for (const row of rows.rows) {
      if (row.id === input.actor.id) continue;
      await createNotification({
        userId: row.id,
        kind: "mention",
        title: `${input.actor.label} mentioned you`,
        body: input.threadTitle,
        href: input.href,
        actorLabel: input.actor.label,
      });
    }
  } catch {
    /* auth tables not migrated yet — mentions silently skipped */
  }
}

export async function createThread(input: {
  categorySlug: string;
  title: string;
  body: string;
  user: ForumUser;
}): Promise<ForumThreadTable> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 4 || title.length > 160) {
    throw new ForumError("INVALID", "Title must be 4-160 characters.");
  }
  if (body.length < 2 || body.length > 20_000) {
    throw new ForumError("INVALID", "Body must be 2-20000 characters.");
  }

  const db = await getDb();
  const category = await db
    .selectFrom("forum_categories")
    .selectAll()
    .where("slug", "=", input.categorySlug)
    .executeTakeFirst();
  if (!category) throw new ForumError("NOT_FOUND", "Unknown forum.");
  if (category.locked && !input.user.isStaff) {
    throw new ForumError("LOCKED", "This forum is locked.");
  }

  if (!input.user.isStaff) {
    const { limits } = await trustFor(input.user);
    if (!limits.allowLinks && containsLink(body)) {
      throw new ForumError(
        "LINKS_NOT_ALLOWED",
        "New accounts cannot post links yet. Participate a bit first.",
      );
    }
    const recent = await countRecent("forum_threads", input.user.id);
    if (recent >= limits.threadsPerDay) {
      throw new ForumError(
        "RATE_LIMITED",
        `Thread limit reached (${limits.threadsPerDay}/day at your trust level).`,
      );
    }
  }

  const now = nowIso();
  const threadId = newId();
  const slug = `${slugify(title)}.${Date.now().toString(36)}`;

  const thread: ForumThreadTable = {
    id: threadId,
    category_id: category.id,
    slug,
    title,
    author_id: input.user.id,
    author_label: input.user.label,
    created_at: now,
    updated_at: now,
    last_post_at: now,
    reply_count: 0,
    pinned: 0,
    locked: 0,
    hidden: 0,
  };

  await db.transaction().execute(async (trx) => {
    await trx.insertInto("forum_threads").values(thread).execute();
    await trx
      .insertInto("forum_posts")
      .values({
        id: newId(),
        thread_id: threadId,
        author_id: input.user.id,
        author_label: input.user.label,
        body,
        created_at: now,
        edited_at: null,
        hidden: 0,
        hidden_by: null,
        hidden_reason: null,
      })
      .execute();
  });

  await bumpUserStats(input.user.id, { threads: 1, posts: 1 });
  await notifyMentions({
    body,
    actor: input.user,
    href: `/threads/${slug}`,
    threadTitle: title,
  });
  return thread;
}

export async function createReply(input: {
  threadSlug: string;
  body: string;
  user: ForumUser;
}): Promise<ForumPostTable> {
  const body = input.body.trim();
  if (body.length < 2 || body.length > 20_000) {
    throw new ForumError("INVALID", "Reply must be 2-20000 characters.");
  }

  const db = await getDb();
  const thread = await db
    .selectFrom("forum_threads")
    .selectAll()
    .where("slug", "=", input.threadSlug)
    .executeTakeFirst();
  if (!thread || thread.hidden) throw new ForumError("NOT_FOUND", "Thread not found.");
  if (thread.locked && !input.user.isStaff) {
    throw new ForumError("LOCKED", "Thread is locked.");
  }

  if (!input.user.isStaff) {
    const { limits } = await trustFor(input.user);
    if (!limits.allowLinks && containsLink(body)) {
      throw new ForumError(
        "LINKS_NOT_ALLOWED",
        "New accounts cannot post links yet. Participate a bit first.",
      );
    }
    const recent = await countRecent("forum_posts", input.user.id);
    if (recent >= limits.repliesPerDay) {
      throw new ForumError(
        "RATE_LIMITED",
        `Reply limit reached (${limits.repliesPerDay}/day at your trust level).`,
      );
    }
  }

  const now = nowIso();
  const post: ForumPostTable = {
    id: newId(),
    thread_id: thread.id,
    author_id: input.user.id,
    author_label: input.user.label,
    body,
    created_at: now,
    edited_at: null,
    hidden: 0,
    hidden_by: null,
    hidden_reason: null,
  };

  await db.transaction().execute(async (trx) => {
    await trx.insertInto("forum_posts").values(post).execute();
    await trx
      .updateTable("forum_threads")
      .set((eb) => ({
        reply_count: eb("reply_count", "+", 1),
        last_post_at: now,
        updated_at: now,
      }))
      .where("id", "=", thread.id)
      .execute();
  });

  await bumpUserStats(input.user.id, { posts: 1 });

  if (thread.author_id !== input.user.id) {
    await createNotification({
      userId: thread.author_id,
      kind: "reply",
      title: `${input.user.label} replied to "${thread.title}"`,
      body: body.slice(0, 200),
      href: `/threads/${thread.slug}`,
      actorLabel: input.user.label,
    });
  }
  await notifyMentions({
    body,
    actor: input.user,
    href: `/threads/${thread.slug}`,
    threadTitle: thread.title,
  });
  return post;
}

export async function editPost(input: {
  postId: string;
  body: string;
  user: ForumUser;
}) {
  const body = input.body.trim();
  if (body.length < 2 || body.length > 20_000) {
    throw new ForumError("INVALID", "Post must be 2-20000 characters.");
  }
  const db = await getDb();
  const post = await db
    .selectFrom("forum_posts")
    .selectAll()
    .where("id", "=", input.postId)
    .executeTakeFirst();
  if (!post) throw new ForumError("NOT_FOUND", "Post not found.");

  if (!input.user.isStaff) {
    if (post.author_id !== input.user.id) {
      throw new ForumError("FORBIDDEN", "You can only edit your own posts.");
    }
    const { limits } = await trustFor(input.user);
    if (
      limits.editWindowMs !== null &&
      Date.now() - Date.parse(post.created_at) > limits.editWindowMs
    ) {
      throw new ForumError("FORBIDDEN", "Edit window has closed for this post.");
    }
    if (!limits.allowLinks && containsLink(body)) {
      throw new ForumError("LINKS_NOT_ALLOWED", "New accounts cannot post links yet.");
    }
  }

  await db
    .updateTable("forum_posts")
    .set({ body, edited_at: nowIso() })
    .where("id", "=", input.postId)
    .execute();
}

const REACTION_SET = ["👍", "❤️", "🎉", "👀"] as const;

export function reactionSet(): readonly string[] {
  return REACTION_SET;
}

export async function toggleReaction(input: {
  postId: string;
  userId: string;
  emoji: string;
}): Promise<{ added: boolean }> {
  if (!REACTION_SET.includes(input.emoji as (typeof REACTION_SET)[number])) {
    throw new ForumError("INVALID", "Unknown reaction.");
  }
  const db = await getDb();
  const post = await db
    .selectFrom("forum_posts")
    .select(["id", "author_id"])
    .where("id", "=", input.postId)
    .executeTakeFirst();
  if (!post) throw new ForumError("NOT_FOUND", "Post not found.");

  const existing = await db
    .selectFrom("forum_reactions")
    .select("id")
    .where("post_id", "=", input.postId)
    .where("user_id", "=", input.userId)
    .where("emoji", "=", input.emoji)
    .executeTakeFirst();

  if (existing) {
    await db.deleteFrom("forum_reactions").where("id", "=", existing.id).execute();
    if (post.author_id !== input.userId) {
      await bumpUserStats(post.author_id, { reactions: -1 });
    }
    return { added: false };
  }

  await db
    .insertInto("forum_reactions")
    .values({
      id: newId(),
      post_id: input.postId,
      user_id: input.userId,
      emoji: input.emoji,
      at: nowIso(),
    })
    .execute();
  if (post.author_id !== input.userId) {
    await bumpUserStats(post.author_id, { reactions: 1 });
  }
  return { added: true };
}

export async function reportPost(input: {
  postId: string;
  reporterId: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500) {
    throw new ForumError("INVALID", "Reason must be 3-500 characters.");
  }
  const db = await getDb();
  const post = await db
    .selectFrom("forum_posts")
    .select("id")
    .where("id", "=", input.postId)
    .executeTakeFirst();
  if (!post) throw new ForumError("NOT_FOUND", "Post not found.");

  await db
    .insertInto("forum_reports")
    .values({
      id: newId(),
      post_id: input.postId,
      reporter_id: input.reporterId,
      reason,
      status: "open",
      at: nowIso(),
      resolved_by: null,
      resolved_at: null,
    })
    .execute();
}

export async function listOpenReports(limit = 50) {
  const db = await getDb();
  const reports = await db
    .selectFrom("forum_reports")
    .selectAll()
    .where("status", "=", "open")
    .orderBy("at", "desc")
    .limit(limit)
    .execute();
  if (!reports.length) return [];

  const posts = await db
    .selectFrom("forum_posts")
    .select(["id", "body", "author_id", "author_label", "thread_id", "hidden"])
    .where("id", "in", reports.map((r) => r.post_id))
    .execute();
  const threads = posts.length
    ? await db
        .selectFrom("forum_threads")
        .select(["id", "slug", "title"])
        .where("id", "in", posts.map((p) => p.thread_id))
        .execute()
    : [];
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const threadMap = new Map(threads.map((t) => [t.id, t]));

  return reports.map((r) => {
    const post = postMap.get(r.post_id);
    const thread = post ? threadMap.get(post.thread_id) : undefined;
    return {
      ...r,
      post: post
        ? {
            id: post.id,
            excerpt: post.body.slice(0, 240),
            authorId: post.author_id,
            authorLabel: post.author_label,
            hidden: Boolean(post.hidden),
          }
        : null,
      thread: thread ? { slug: thread.slug, title: thread.title } : null,
    };
  });
}

export async function moderatePost(input: {
  postId: string;
  action: "hide" | "unhide";
  by: string;
  reason?: string;
}) {
  const db = await getDb();
  await db
    .updateTable("forum_posts")
    .set(
      input.action === "hide"
        ? { hidden: 1, hidden_by: input.by, hidden_reason: input.reason ?? null }
        : { hidden: 0, hidden_by: null, hidden_reason: null },
    )
    .where("id", "=", input.postId)
    .execute();
}

export async function resolveReport(input: {
  reportId: string;
  status: "resolved" | "dismissed";
  by: string;
}) {
  const db = await getDb();
  await db
    .updateTable("forum_reports")
    .set({ status: input.status, resolved_by: input.by, resolved_at: nowIso() })
    .where("id", "=", input.reportId)
    .execute();
}

/** Real purge execution for the moderation queue. Returns removal counts. */
export async function purgeUserForumContent(
  userId: string,
  scope: "messages" | "threads" | "all",
): Promise<{ posts: number; threads: number }> {
  const db = await getDb();
  let removedPosts = 0;
  let removedThreads = 0;

  await db.transaction().execute(async (trx) => {
    if (scope === "threads" || scope === "all") {
      const threads = await trx
        .selectFrom("forum_threads")
        .select("id")
        .where("author_id", "=", userId)
        .execute();
      if (threads.length) {
        const ids = threads.map((t) => t.id);
        const res = await trx
          .deleteFrom("forum_posts")
          .where("thread_id", "in", ids)
          .executeTakeFirst();
        removedPosts += Number(res.numDeletedRows ?? 0);
        await trx.deleteFrom("forum_threads").where("id", "in", ids).execute();
        removedThreads = ids.length;
      }
    }

    if (scope === "messages" || scope === "all") {
      const posts = await trx
        .selectFrom("forum_posts")
        .select(["id", "thread_id"])
        .where("author_id", "=", userId)
        .execute();
      if (posts.length) {
        await trx
          .deleteFrom("forum_posts")
          .where("id", "in", posts.map((p) => p.id))
          .execute();
        removedPosts += posts.length;
        // Recompute reply counts for affected threads.
        const affected = [...new Set(posts.map((p) => p.thread_id))];
        for (const threadId of affected) {
          const row = await trx
            .selectFrom("forum_posts")
            .select((eb) => eb.fn.countAll().as("n"))
            .where("thread_id", "=", threadId)
            .executeTakeFirst();
          const count = Number(row?.n ?? 0);
          if (count === 0) {
            await trx.deleteFrom("forum_threads").where("id", "=", threadId).execute();
            removedThreads += 1;
          } else {
            await trx
              .updateTable("forum_threads")
              .set({ reply_count: Math.max(0, count - 1) })
              .where("id", "=", threadId)
              .execute();
          }
        }
      }
    }
  });

  return { posts: removedPosts, threads: removedThreads };
}
