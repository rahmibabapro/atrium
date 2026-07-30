import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const pageStatSchema = z.object({
  views: z.number().int().nonnegative(),
  dwellMs: z.number().nonnegative(),
  clicks: z.number().int().nonnegative(),
});

const sessionSchema = z.object({
  firstAt: z.string(),
  lastAt: z.string(),
  dwellMs: z.number().nonnegative(),
  paths: z.array(z.string()).max(80),
  userId: z.string().optional(),
  userLabel: z.string().optional(),
  pageviews: z.number().int().nonnegative(),
});

const clickSchema = z.object({
  at: z.string(),
  path: z.string(),
  target: z.string().max(200),
  sessionId: z.string(),
  userId: z.string().optional(),
});

const storeSchema = z.object({
  pages: z.record(z.string(), pageStatSchema).default({}),
  sessions: z.record(z.string(), sessionSchema).default({}),
  clicks: z.array(clickSchema).max(800).default([]),
  totals: z
    .object({
      pageviews: z.number().int().nonnegative(),
      sessions: z.number().int().nonnegative(),
      dwellMs: z.number().nonnegative(),
      clicks: z.number().int().nonnegative(),
    })
    .default({ pageviews: 0, sessions: 0, dwellMs: 0, clicks: 0 }),
  updatedAt: z.string().optional(),
});

export type AnalyticsStore = z.infer<typeof storeSchema>;

const MAX_SESSIONS = 400;
const MAX_CLICKS = 500;

function storePath() {
  return path.join(process.cwd(), "data", "analytics.json");
}

export function readAnalyticsStore(): AnalyticsStore {
  const file = storePath();
  if (!fs.existsSync(file)) {
    return storeSchema.parse({});
  }
  try {
    return storeSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    return storeSchema.parse({});
  }
}

function writeAnalyticsStore(data: AnalyticsStore) {
  const parsed = storeSchema.parse(data);
  const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(parsed) + "\n", "utf8");
  fs.renameSync(tmp, file);
  return parsed;
}

export function normalizeAnalyticsPath(raw: string): string {
  try {
    const u = raw.startsWith("http")
      ? new URL(raw)
      : new URL(raw, "http://local.invalid");
    let p = u.pathname || "/";
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    if (p.startsWith("/admin") || p.startsWith("/api") || p.startsWith("/login")) {
      return "";
    }
    return p.slice(0, 200) || "/";
  } catch {
    return "";
  }
}

function pruneSessions(store: AnalyticsStore) {
  const entries = Object.entries(store.sessions).sort(
    (a, b) => Date.parse(b[1].lastAt) - Date.parse(a[1].lastAt),
  );
  if (entries.length <= MAX_SESSIONS) return;
  store.sessions = Object.fromEntries(entries.slice(0, MAX_SESSIONS));
}

export function ingestAnalyticsBatch(input: {
  sessionId: string;
  userId?: string;
  userLabel?: string;
  events: Array<
    | { type: "pageview"; path: string; at?: string }
    | { type: "heartbeat"; path: string; ms: number; at?: string }
    | { type: "click"; path: string; target: string; at?: string }
  >;
}) {
  const store = readAnalyticsStore();
  const now = new Date().toISOString();
  const sid = input.sessionId.slice(0, 64);
  if (!sid) return store;

  let session = store.sessions[sid];
  if (!session) {
    session = {
      firstAt: now,
      lastAt: now,
      dwellMs: 0,
      paths: [],
      pageviews: 0,
    };
    store.totals.sessions += 1;
  }
  if (input.userId) session.userId = input.userId.slice(0, 80);
  if (input.userLabel) session.userLabel = input.userLabel.slice(0, 80);

  for (const event of input.events.slice(0, 40)) {
    const pathName = normalizeAnalyticsPath(event.path);
    if (!pathName) continue;
    const at = event.at && !Number.isNaN(Date.parse(event.at)) ? event.at : now;

    if (!store.pages[pathName]) {
      store.pages[pathName] = { views: 0, dwellMs: 0, clicks: 0 };
    }
    const page = store.pages[pathName]!;

    if (event.type === "pageview") {
      page.views += 1;
      store.totals.pageviews += 1;
      session.pageviews += 1;
      if (!session.paths.includes(pathName)) {
        session.paths = [...session.paths, pathName].slice(-40);
      }
    } else if (event.type === "heartbeat") {
      const ms = Math.min(Math.max(0, event.ms), 120_000);
      page.dwellMs += ms;
      session.dwellMs += ms;
      store.totals.dwellMs += ms;
    } else if (event.type === "click") {
      const target = event.target.slice(0, 200);
      page.clicks += 1;
      store.totals.clicks += 1;
      store.clicks.unshift({
        at,
        path: pathName,
        target,
        sessionId: sid,
        userId: session.userId,
      });
    }

    session.lastAt = at;
  }

  store.sessions[sid] = session;
  store.clicks = store.clicks.slice(0, MAX_CLICKS);
  pruneSessions(store);
  store.updatedAt = now;
  return writeAnalyticsStore(store);
}

export function analyticsSummary(store = readAnalyticsStore()) {
  const topPages = Object.entries(store.pages)
    .map(([path, s]) => ({
      path,
      views: s.views,
      clicks: s.clicks,
      dwellHours: Math.round((s.dwellMs / 3_600_000) * 100) / 100,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 25);

  const activeSessions = Object.entries(store.sessions)
    .map(([id, s]) => ({
      id,
      userId: s.userId,
      userLabel: s.userLabel,
      firstAt: s.firstAt,
      lastAt: s.lastAt,
      dwellHours: Math.round((s.dwellMs / 3_600_000) * 100) / 100,
      pageviews: s.pageviews,
      paths: s.paths,
    }))
    .sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt))
    .slice(0, 40);

  const topClicks = [...store.clicks]
    .slice(0, 40)
    .reduce<Record<string, number>>((acc, c) => {
      const key = `${c.path} → ${c.target}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return {
    totals: {
      ...store.totals,
      dwellHours: Math.round((store.totals.dwellMs / 3_600_000) * 100) / 100,
    },
    topPages,
    activeSessions,
    topClickTargets: Object.entries(topClicks)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    recentClicks: store.clicks.slice(0, 30),
    updatedAt: store.updatedAt,
  };
}
