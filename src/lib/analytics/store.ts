import { getDb, newId, nowIso } from "@/lib/db";

const MAX_SESSIONS = 400;
const MAX_CLICKS = 500;

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

type IngestEvent =
  | { type: "pageview"; path: string; at?: string }
  | { type: "heartbeat"; path: string; ms: number; at?: string }
  | { type: "click"; path: string; target: string; at?: string };

export async function ingestAnalyticsBatch(input: {
  sessionId: string;
  userId?: string;
  userLabel?: string;
  events: IngestEvent[];
}): Promise<void> {
  const sid = input.sessionId.slice(0, 64);
  if (!sid) return;
  const now = nowIso();
  const db = await getDb();

  await db.transaction().execute(async (trx) => {
    let session = await trx
      .selectFrom("analytics_sessions")
      .selectAll()
      .where("id", "=", sid)
      .executeTakeFirst();

    let isNewSession = false;
    if (!session) {
      isNewSession = true;
      session = {
        id: sid,
        first_at: now,
        last_at: now,
        dwell_ms: 0,
        pageviews: 0,
        user_id: null,
        user_label: null,
        paths: "[]",
      };
    }

    const paths = new Set<string>(JSON.parse(session.paths) as string[]);
    let sessionDwell = 0;
    let sessionViews = 0;
    let lastAt = session.last_at;
    let totalViews = 0;
    let totalDwell = 0;
    let totalClicks = 0;

    for (const event of input.events.slice(0, 40)) {
      const pathName = normalizeAnalyticsPath(event.path);
      if (!pathName) continue;
      const at =
        event.at && !Number.isNaN(Date.parse(event.at)) ? event.at : now;

      let views = 0;
      let dwell = 0;
      let clicks = 0;
      if (event.type === "pageview") {
        views = 1;
        sessionViews += 1;
        totalViews += 1;
        paths.add(pathName);
      } else if (event.type === "heartbeat") {
        dwell = Math.min(Math.max(0, event.ms), 120_000);
        sessionDwell += dwell;
        totalDwell += dwell;
      } else if (event.type === "click") {
        clicks = 1;
        totalClicks += 1;
        await trx
          .insertInto("analytics_clicks")
          .values({
            id: newId(),
            at,
            path: pathName,
            target: event.target.slice(0, 200),
            session_id: sid,
            user_id: input.userId?.slice(0, 80) ?? session.user_id,
          })
          .execute();
      }

      await trx
        .insertInto("analytics_pages")
        .values({ path: pathName, views, dwell_ms: dwell, clicks })
        .onConflict((oc) =>
          oc.column("path").doUpdateSet((eb) => ({
            views: eb("analytics_pages.views", "+", views),
            dwell_ms: eb("analytics_pages.dwell_ms", "+", dwell),
            clicks: eb("analytics_pages.clicks", "+", clicks),
          })),
        )
        .execute();

      if (at > lastAt) lastAt = at;
    }

    await trx
      .insertInto("analytics_sessions")
      .values({
        id: sid,
        first_at: session.first_at,
        last_at: lastAt,
        dwell_ms: session.dwell_ms + sessionDwell,
        pageviews: session.pageviews + sessionViews,
        user_id: input.userId?.slice(0, 80) ?? session.user_id,
        user_label: input.userLabel?.slice(0, 80) ?? session.user_label,
        paths: JSON.stringify([...paths].slice(-40)),
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet((eb) => ({
          last_at: lastAt,
          dwell_ms: eb("analytics_sessions.dwell_ms", "+", sessionDwell),
          pageviews: eb("analytics_sessions.pageviews", "+", sessionViews),
          user_id: input.userId?.slice(0, 80) ?? session!.user_id,
          user_label: input.userLabel?.slice(0, 80) ?? session!.user_label,
          paths: JSON.stringify([...paths].slice(-40)),
        })),
      )
      .execute();

    await trx
      .insertInto("analytics_totals")
      .values({
        id: 1,
        pageviews: totalViews,
        sessions: isNewSession ? 1 : 0,
        dwell_ms: totalDwell,
        clicks: totalClicks,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet((eb) => ({
          pageviews: eb("analytics_totals.pageviews", "+", totalViews),
          sessions: eb(
            "analytics_totals.sessions",
            "+",
            isNewSession ? 1 : 0,
          ),
          dwell_ms: eb("analytics_totals.dwell_ms", "+", totalDwell),
          clicks: eb("analytics_totals.clicks", "+", totalClicks),
          updated_at: now,
        })),
      )
      .execute();

    // Retention caps: keep the freshest N rows, drop the tail.
    await trx
      .deleteFrom("analytics_clicks")
      .where("id", "in", (qb) =>
        qb
          .selectFrom("analytics_clicks")
          .select("id")
          .orderBy("at", "desc")
          .offset(MAX_CLICKS)
          .limit(1_000_000),
      )
      .execute();
    await trx
      .deleteFrom("analytics_sessions")
      .where("id", "in", (qb) =>
        qb
          .selectFrom("analytics_sessions")
          .select("id")
          .orderBy("last_at", "desc")
          .offset(MAX_SESSIONS)
          .limit(1_000_000),
      )
      .execute();
  });
}

export async function analyticsSummary() {
  const db = await getDb();

  const [totalsRow, pageRows, sessionRows, clickRows] = await Promise.all([
    db.selectFrom("analytics_totals").selectAll().where("id", "=", 1).executeTakeFirst(),
    db
      .selectFrom("analytics_pages")
      .selectAll()
      .orderBy("views", "desc")
      .limit(25)
      .execute(),
    db
      .selectFrom("analytics_sessions")
      .selectAll()
      .orderBy("last_at", "desc")
      .limit(40)
      .execute(),
    db
      .selectFrom("analytics_clicks")
      .selectAll()
      .orderBy("at", "desc")
      .limit(40)
      .execute(),
  ]);

  const totals = {
    pageviews: Number(totalsRow?.pageviews ?? 0),
    sessions: Number(totalsRow?.sessions ?? 0),
    dwellMs: Number(totalsRow?.dwell_ms ?? 0),
    clicks: Number(totalsRow?.clicks ?? 0),
  };

  const topClicks = clickRows.reduce<Record<string, number>>((acc, c) => {
    const key = `${c.path} → ${c.target}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totals: {
      ...totals,
      dwellHours: Math.round((totals.dwellMs / 3_600_000) * 100) / 100,
    },
    topPages: pageRows.map((p) => ({
      path: p.path,
      views: Number(p.views),
      clicks: Number(p.clicks),
      dwellHours: Math.round((Number(p.dwell_ms) / 3_600_000) * 100) / 100,
    })),
    activeSessions: sessionRows.map((s) => ({
      id: s.id,
      userId: s.user_id ?? undefined,
      userLabel: s.user_label ?? undefined,
      firstAt: s.first_at,
      lastAt: s.last_at,
      dwellHours: Math.round((Number(s.dwell_ms) / 3_600_000) * 100) / 100,
      pageviews: Number(s.pageviews),
      paths: JSON.parse(s.paths) as string[],
    })),
    topClickTargets: Object.entries(topClicks)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    recentClicks: clickRows.slice(0, 30).map((c) => ({
      at: c.at,
      path: c.path,
      target: c.target,
      sessionId: c.session_id,
      userId: c.user_id ?? undefined,
    })),
    updatedAt: totalsRow?.updated_at ?? undefined,
  };
}
