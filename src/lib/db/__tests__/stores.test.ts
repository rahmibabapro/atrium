import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

// Isolated database per test run — must be set before the db module loads.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "atrium-db-test-"));
process.env.ATRIUM_DB_PATH = path.join(tmpDir, "test.sqlite");
delete process.env.ATRIUM_DATABASE_URL;
delete process.env.DATABASE_URL;

import { appendAudit, readAudit } from "../../admin/audit";
import {
  addWarning,
  completePurge,
  queuePurge,
  readModerationStore,
} from "../../admin/moderation-store";
import {
  warmSiteOverrides,
  writeSiteOverrides,
  readSiteOverrides,
} from "../../admin/site-overrides";
import {
  analyticsSummary,
  ingestAnalyticsBatch,
  normalizeAnalyticsPath,
} from "../../analytics/store";
import { getDb } from "../index";

describe("db bootstrap", () => {
  before(async () => {
    await getDb();
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("runs migrations and exposes the ops tables", async () => {
    const db = await getDb();
    await db.selectFrom("audit_log").selectAll().execute();
    await db.selectFrom("forum_threads").selectAll().execute();
    await db.selectFrom("notifications").selectAll().execute();
  });

  it("audit log appends and reads newest-first", async () => {
    await appendAudit({
      actorId: "u1",
      actorLabel: "Admin",
      action: "test.first",
    });
    await appendAudit({
      actorId: "u1",
      actorLabel: "Admin",
      action: "test.second",
      target: "u2",
      meta: { hello: "world" },
    });
    const events = await readAudit(10);
    assert.equal(events[0]!.action, "test.second");
    assert.deepEqual(events[0]!.meta, { hello: "world" });
    assert.equal(events[1]!.action, "test.first");
  });

  it("moderation warnings + purge lifecycle", async () => {
    await addWarning({
      userId: "u2",
      username: "trouble",
      reason: "spam",
      by: "u1",
      byLabel: "Admin",
    });
    const purge = await queuePurge({
      userId: "u2",
      scope: "messages",
      by: "u1",
      byLabel: "Admin",
    });
    let store = await readModerationStore();
    assert.equal(store.warnings.length, 1);
    assert.equal(store.purges[0]!.status, "queued");

    await completePurge(purge.id, "done");
    store = await readModerationStore();
    assert.equal(store.purges[0]!.status, "done");
  });

  it("site overrides round-trip through DB + sync cache", async () => {
    await writeSiteOverrides({ theme: { brand: "#123456" } });
    const cached = readSiteOverrides();
    assert.equal(cached.theme?.brand, "#123456");

    const warmed = await warmSiteOverrides();
    assert.equal(warmed.theme?.brand, "#123456");
  });

  it("analytics ingest aggregates pages, sessions, totals", async () => {
    await ingestAnalyticsBatch({
      sessionId: "session-aaaa",
      userLabel: "guest",
      events: [
        { type: "pageview", path: "/wiki" },
        { type: "heartbeat", path: "/wiki", ms: 30_000 },
        { type: "click", path: "/wiki", target: "a[href=/forums]" },
        { type: "pageview", path: "/admin/secret" },
      ],
    });
    await ingestAnalyticsBatch({
      sessionId: "session-aaaa",
      events: [{ type: "pageview", path: "/forums" }],
    });

    const summary = await analyticsSummary();
    assert.equal(summary.totals.pageviews, 2);
    assert.equal(summary.totals.sessions, 1);
    assert.equal(summary.totals.clicks, 1);
    const wiki = summary.topPages.find((p) => p.path === "/wiki");
    assert.ok(wiki && wiki.views === 1 && wiki.clicks === 1);
    assert.equal(summary.activeSessions[0]!.pageviews, 2);
    assert.ok(summary.activeSessions[0]!.paths.includes("/forums"));
  });

  it("normalizeAnalyticsPath drops admin/api and trims", () => {
    assert.equal(normalizeAnalyticsPath("/admin/site"), "");
    assert.equal(normalizeAnalyticsPath("/api/health"), "");
    assert.equal(normalizeAnalyticsPath("https://x.test/wiki/"), "/wiki");
  });
});
