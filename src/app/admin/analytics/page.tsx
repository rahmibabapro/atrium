import Link from "next/link";
import { headers } from "next/headers";
import { analyticsSummary } from "@/lib/analytics/store";
import { auth } from "@/lib/atriumid/auth";
import { requireStaff } from "@/lib/admin/guard";
import { readSiteOverrides } from "@/lib/admin/site-overrides";
import { siteOrigin } from "@/lib/site-url";

export default async function AdminAnalyticsPage() {
  await requireStaff({ redirectTo: "/admin/analytics" });
  const summary = await analyticsSummary();
  const google = readSiteOverrides().google;
  const origin = siteOrigin();

  let registered = 0;
  let userSample: Array<{
    id: string;
    name: string;
    email: string;
    createdAt?: string | Date;
    username?: string | null;
    banned?: boolean | null;
  }> = [];
  try {
    const res = await auth.api.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
      headers: await headers(),
    });
    const users = (res as { users?: typeof userSample }).users || [];
    userSample = users as typeof userSample;
    registered =
      (res as { total?: number }).total ??
      (res as { users?: unknown[] }).users?.length ??
      0;
  } catch {
    registered = 0;
  }

  const checklist = [
    {
      ok: Boolean(google?.analyticsId),
      label: "GA4 measurement ID",
      hint: google?.analyticsId || "Set in Site foundation → Google",
    },
    {
      ok: Boolean(google?.adsenseClient && google.adsenseEnabled),
      label: "AdSense enabled",
      hint: google?.adsenseClient || "Add ca-pub-… and enable",
    },
    {
      ok: Boolean(google?.searchConsoleVerification),
      label: "Search Console verification",
      hint: google?.searchConsoleVerification
        ? "Meta tag configured"
        : "Paste verification content",
    },
    {
      ok: true,
      label: "Sitemap",
      hint: `${origin}/sitemap.xml`,
    },
    {
      ok: true,
      label: "robots.txt",
      hint: `${origin}/robots.txt`,
    },
    {
      ok: Boolean(google?.adsenseClient),
      label: "ads.txt",
      hint: `${origin}/ads.txt`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics & Google</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          First-party database review (pageviews, dwell time, clicks, sessions)
          plus Google connection checklist for Search Console, Analytics, and
          AdSense. Consent is required before Google tags load.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Registered users", String(registered)],
          ["Pageviews", String(summary.totals.pageviews)],
          ["Sessions", String(summary.totals.sessions)],
          ["Active hours", String(summary.totals.dwellHours)],
        ].map(([t, v]) => (
          <div
            key={t}
            className="rounded-2xl border border-[var(--atr-border)] bg-white p-5"
          >
            <p className="text-xs font-semibold tracking-wide text-[var(--atr-muted)] uppercase">
              {t}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Google connection checklist</h3>
          <Link
            href="/admin/site"
            className="text-xs font-semibold text-[var(--atr-brand)]"
          >
            Configure in Site foundation →
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {checklist.map((c) => (
            <li
              key={c.label}
              className="flex flex-wrap items-baseline gap-2 border-b border-[var(--atr-border)] pb-2"
            >
              <span
                className={
                  c.ok
                    ? "font-semibold text-emerald-700"
                    : "font-semibold text-amber-700"
                }
              >
                {c.ok ? "Ready" : "Todo"}
              </span>
              <span className="font-medium">{c.label}</span>
              <span className="font-mono text-xs text-[var(--atr-muted)]">
                {c.hint}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--atr-sub)]">
          Ranking tip: submit{" "}
          <a className="underline" href={`${origin}/sitemap.xml`}>
            sitemap.xml
          </a>{" "}
          in{" "}
          <a
            className="underline"
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
          >
            Google Search Console
          </a>
          , keep pages Live in Site foundation, and improve content quality —
          tags alone do not rank a site.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-5">
          <h3 className="font-semibold">Top pages</h3>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--atr-muted)]">
              <tr>
                <th className="py-2">Path</th>
                <th>Views</th>
                <th>Clicks</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {summary.topPages.map((p) => (
                <tr key={p.path} className="border-t border-[var(--atr-border)]">
                  <td className="py-2 font-mono text-xs">{p.path}</td>
                  <td>{p.views}</td>
                  <td>{p.clicks}</td>
                  <td>{p.dwellHours}</td>
                </tr>
              ))}
              {!summary.topPages.length ? (
                <tr>
                  <td colSpan={4} className="py-6 text-[var(--atr-muted)]">
                    No page data yet — browse the public site with Analytics
                    consent.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-5">
          <h3 className="font-semibold">Most clicked targets</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {summary.topClickTargets.map((c) => (
              <li
                key={c.label}
                className="flex justify-between gap-3 border-b border-[var(--atr-border)] pb-2"
              >
                <span className="truncate font-mono text-xs">{c.label}</span>
                <span className="font-semibold tabular-nums">{c.count}</span>
              </li>
            ))}
            {!summary.topClickTargets.length ? (
              <li className="text-[var(--atr-muted)]">No clicks recorded yet.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-5">
        <h3 className="font-semibold">Recent sessions (active time & paths)</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--atr-muted)]">
              <tr>
                <th className="px-2 py-2">Visitor</th>
                <th className="px-2 py-2">Hours</th>
                <th className="px-2 py-2">Views</th>
                <th className="px-2 py-2">Paths</th>
                <th className="px-2 py-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {summary.activeSessions.map((s) => (
                <tr key={s.id} className="border-t border-[var(--atr-border)]">
                  <td className="px-2 py-2">
                    <div className="font-semibold">
                      {s.userLabel || s.userId || "Anonymous"}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--atr-muted)]">
                      {s.id}
                    </div>
                  </td>
                  <td className="px-2 py-2 tabular-nums">{s.dwellHours}</td>
                  <td className="px-2 py-2 tabular-nums">{s.pageviews}</td>
                  <td className="max-w-xs truncate px-2 py-2 font-mono text-[10px]">
                    {s.paths.join(" · ")}
                  </td>
                  <td className="px-2 py-2 text-xs text-[var(--atr-muted)]">
                    {new Date(s.lastAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Latest registrations</h3>
          <Link
            href="/admin/users"
            className="text-xs font-semibold text-[var(--atr-brand)]"
          >
            Full directory →
          </Link>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {userSample.slice(0, 15).map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--atr-border)] pb-2"
            >
              <span>
                <span className="font-semibold">{u.username || u.name}</span>{" "}
                <span className="text-[var(--atr-muted)]">{u.email}</span>
              </span>
              <span className="text-xs text-[var(--atr-muted)]">
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleString()
                  : u.banned
                    ? "banned"
                    : u.id}
              </span>
            </li>
          ))}
          {!userSample.length ? (
            <li className="text-[var(--atr-muted)]">No users loaded.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
