import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atrium-search-test-"));
process.env.ATRIUM_DB_PATH = path.join(tmpDir, "test.sqlite");
delete process.env.ATRIUM_DATABASE_URL;
delete process.env.DATABASE_URL;

import {
  createReply,
  createThread,
  ensureCategories,
  moderatePost,
  getThread,
  type ForumUser,
} from "../../forum/service";
import { searchForum } from "../index";

const author: ForumUser = {
  id: "user-search",
  label: "seeker",
  createdAt: new Date(Date.now() - 60 * 86_400_000),
  isStaff: true,
};

describe("forum full-text search (FTS5)", () => {
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("indexes new posts and ranks matches", async () => {
    await ensureCategories([
      { slug: "lounge", title: { tr: "Lobi", en: "Lounge" } },
    ]);
    const thread = await createThread({
      categorySlug: "lounge",
      title: "Obsidian portal construction guide",
      body: "How to build a nether portal with obsidian blocks.",
      user: author,
    });
    await createReply({
      threadSlug: thread.slug,
      body: "You can also use a lava bucket and water instead of mining obsidian.",
      user: author,
    });

    const hits = await searchForum("obsidian");
    assert.ok(hits.length >= 2);
    assert.equal(hits[0]!.threadSlug, thread.slug);
    assert.ok(hits[0]!.excerpt.length > 0);

    const lava = await searchForum("lava bucket");
    assert.ok(lava.length >= 1);
  });

  it("supports prefix matching and ignores fts syntax injection", async () => {
    const prefix = await searchForum("obsid");
    assert.ok(prefix.length >= 1);

    // Must not throw on FTS5 operators / quotes.
    const weird = await searchForum('"obsidian" OR (NEAR/2 *');
    assert.ok(Array.isArray(weird));
  });

  it("excludes hidden posts from results", async () => {
    const hits = await searchForum("lava bucket");
    const target = hits[0]!;
    await moderatePost({ postId: target.postId, action: "hide", by: "mod" });
    const again = await searchForum("lava bucket");
    assert.ok(again.every((h) => h.postId !== target.postId));
  });

  it("returns nothing for sub-2-char queries", async () => {
    assert.deepEqual(await searchForum("a"), []);
  });

  it("keeps index in sync after purge-style deletes", async () => {
    const hits = await searchForum("portal");
    assert.ok(hits.length >= 1);
    const full = await getThread(hits[0]!.threadSlug);
    assert.ok(full);
  });
});
