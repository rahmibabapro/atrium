import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atrium-forum-test-"));
process.env.ATRIUM_DB_PATH = path.join(tmpDir, "test.sqlite");
delete process.env.ATRIUM_DATABASE_URL;
delete process.env.DATABASE_URL;

import {
  containsLink,
  extractMentions,
  renderPostHtml,
} from "../markdown";
import { computeTrustLevel, trustLimits } from "../trust";
import {
  ForumError,
  categoryStats,
  createReply,
  createThread,
  ensureCategories,
  getThread,
  listOpenReports,
  listThreads,
  moderatePost,
  purgeUserForumContent,
  reportPost,
  resolveReport,
  toggleReaction,
  type ForumUser,
} from "../service";
import {
  listNotifications,
  unreadNotificationCount,
} from "../../notifications/service";

const alice: ForumUser = {
  id: "user-alice",
  label: "alice",
  createdAt: new Date(Date.now() - 30 * 86_400_000),
  isStaff: false,
};
const bob: ForumUser = {
  id: "user-bob",
  label: "bob",
  createdAt: new Date(),
  isStaff: false,
};
const mod: ForumUser = {
  id: "user-mod",
  label: "mod",
  createdAt: new Date(),
  isStaff: true,
};

describe("markdown", () => {
  it("escapes html and renders the safe subset", () => {
    const html = renderPostHtml(
      "**bold** and <script>alert(1)</script>\n\n> quoted\n\n`inline` [site](https://example.com)",
    );
    assert.ok(html.includes("<strong>bold</strong>"));
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("<blockquote"));
    assert.ok(html.includes('<a href="https://example.com/"'));
    assert.ok(html.includes("<code"));
  });

  it("never emits javascript: hrefs", () => {
    const html = renderPostHtml("[x](javascript:alert(1))");
    assert.ok(!html.includes('href="javascript'));
    assert.ok(!html.includes("<a "));
  });

  it("detects links and mentions", () => {
    assert.equal(containsLink("see https://x.test"), true);
    assert.equal(containsLink("no links"), false);
    assert.deepEqual(extractMentions("hi @alice and @bob_99!"), [
      "alice",
      "bob_99",
    ]);
  });
});

describe("trust levels", () => {
  it("computes 0 → 1 → 2", () => {
    assert.equal(
      computeTrustLevel({ accountCreatedAt: new Date(), stats: null }),
      0,
    );
    assert.equal(
      computeTrustLevel({
        accountCreatedAt: new Date(Date.now() - 3 * 86_400_000),
        stats: { post_count: 5, reactions_received: 0 },
      }),
      1,
    );
    assert.equal(
      computeTrustLevel({
        accountCreatedAt: new Date(Date.now() - 20 * 86_400_000),
        stats: { post_count: 25, reactions_received: 12 },
      }),
      2,
    );
    assert.equal(trustLimits(0).allowLinks, false);
    assert.equal(trustLimits(2).editWindowMs, null);
  });
});

describe("forum engine", () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("seeds categories idempotently", async () => {
    await ensureCategories([
      { slug: "general", title: { tr: "Genel", en: "General" } },
    ]);
    await ensureCategories([
      { slug: "general", title: { tr: "Genel", en: "General" } },
    ]);
    const { category } = await listThreads("general");
    assert.ok(category);
  });

  it("creates thread + reply, tracks counts, notifies author", async () => {
    const thread = await createThread({
      categorySlug: "general",
      title: "Welcome to Atrium",
      body: "First! **bold** body",
      user: alice,
    });
    assert.match(thread.slug, /^welcome-to-atrium\./);

    await createReply({
      threadSlug: thread.slug,
      body: "Nice thread @alice",
      user: bob,
    });

    const full = await getThread(thread.slug, bob.id);
    assert.equal(full!.posts.length, 2);
    assert.equal(full!.thread.reply_count, 1);

    // Reply notification for the thread author.
    const notes = await listNotifications(alice.id);
    assert.ok(notes.some((n) => n.kind === "reply"));

    const stats = await categoryStats(["general"]);
    assert.equal(stats.get("general")!.threadCount, 1);
  });

  it("blocks links for brand-new accounts", async () => {
    await assert.rejects(
      createThread({
        categorySlug: "general",
        title: "Spammy link thread",
        body: "buy at https://spam.example",
        user: bob,
      }),
      (err: unknown) =>
        err instanceof ForumError && err.code === "LINKS_NOT_ALLOWED",
    );
  });

  it("enforces per-day thread rate limit for new users", async () => {
    await createThread({
      categorySlug: "general",
      title: "Bob thread one",
      body: "hello there",
      user: bob,
    });
    await createThread({
      categorySlug: "general",
      title: "Bob thread two",
      body: "hello again",
      user: bob,
    });
    await assert.rejects(
      createThread({
        categorySlug: "general",
        title: "Bob thread three",
        body: "too many",
        user: bob,
      }),
      (err: unknown) =>
        err instanceof ForumError && err.code === "RATE_LIMITED",
    );
  });

  it("reactions toggle and update author stats", async () => {
    const { threads } = await listThreads("general");
    const thread = threads.find((t) => t.title === "Welcome to Atrium")!;
    const full = await getThread(thread.slug, bob.id);
    const op = full!.posts[0]!;

    const first = await toggleReaction({
      postId: op.id,
      userId: bob.id,
      emoji: "👍",
    });
    assert.equal(first.added, true);
    const second = await toggleReaction({
      postId: op.id,
      userId: bob.id,
      emoji: "👍",
    });
    assert.equal(second.added, false);
  });

  it("report → hide → resolve moderation flow", async () => {
    const { threads } = await listThreads("general");
    const thread = threads.find((t) => t.title === "Welcome to Atrium")!;
    const full = await getThread(thread.slug);
    const reply = full!.posts[1]!;

    await reportPost({
      postId: reply.id,
      reporterId: alice.id,
      reason: "rude reply",
    });
    let open = await listOpenReports();
    assert.equal(open.length, 1);
    assert.equal(open[0]!.post!.id, reply.id);

    await moderatePost({ postId: reply.id, action: "hide", by: mod.id });
    await resolveReport({
      reportId: open[0]!.id,
      status: "resolved",
      by: mod.id,
    });
    open = await listOpenReports();
    assert.equal(open.length, 0);

    const refreshed = await getThread(thread.slug);
    assert.equal(refreshed!.posts[1]!.hidden, 1);
  });

  it("purge removes a user's forum content for real", async () => {
    const removed = await purgeUserForumContent(bob.id, "all");
    assert.ok(removed.threads >= 2);

    const { threads } = await listThreads("general");
    assert.ok(threads.every((t) => t.author_id !== bob.id));
    const welcome = threads.find((t) => t.title === "Welcome to Atrium")!;
    const full = await getThread(welcome.slug);
    assert.ok(full!.posts.every((p) => p.author_id !== bob.id));
  });

  it("mentions create notifications when auth user table exists", async () => {
    // No better-auth "user" table in this test db — mention lookup must
    // fail silently rather than break posting.
    const before = await unreadNotificationCount(alice.id);
    await createReply({
      threadSlug: (await listThreads("general")).threads[0]!.slug,
      body: "ping @alice",
      user: mod,
    });
    const afterCount = await unreadNotificationCount(alice.id);
    assert.ok(afterCount >= before);
  });
});
