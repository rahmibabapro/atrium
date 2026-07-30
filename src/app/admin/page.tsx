import Link from "next/link";
import { readAudit } from "@/lib/admin/audit";
import { requireStaff, roleList } from "@/lib/admin/guard";
import { readModerationStore } from "@/lib/admin/moderation-store";
import { readSiteOverrides } from "@/lib/admin/site-overrides";

export default async function AdminHomePage() {
  const session = await requireStaff();
  const roles = roleList(session);
  const overrides = readSiteOverrides();
  const mod = readModerationStore();
  const audit = readAudit(5);

  const cards: Array<{ href: string; title: string; desc: string }> = [
    ...(roles.includes("admin")
      ? [
          {
            href: "/admin/site",
            title: "Site foundation",
            desc: "Pages, countdown, look, Google",
          },
        ]
      : []),
    {
      href: "/admin/analytics",
      title: "Analytics",
      desc: "Users, pages, clicks, Google checklist",
    },
    {
      href: "/admin/moderation",
      title: "Moderation",
      desc: "Warn, ban, purge queue",
    },
    { href: "/admin/users", title: "Users", desc: "Roles & directory" },
    {
      href: "/admin/audit",
      title: "Audit log",
      desc: "Append-only staff actions",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operations overview</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          Hardened staff console: server-side RBAC, audited mutations, and a simple
          site foundation (pages / home / look) plus moderation — patterns from
          Payload, Directus, Discourse, and XenForo, without unsafe admin surfaces.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Your roles", roles.join(", ")],
          [
            "Site overrides",
            overrides.updatedAt
              ? `${overrides.pages?.length || 0} pages customized`
              : "Pack defaults",
          ],
          ["Warnings / purges", `${mod.warnings.length} / ${mod.purges.length}`],
        ].map(([t, v]) => (
          <div
            key={t}
            className="rounded-2xl border border-[var(--atr-border)] bg-white p-5"
          >
            <p className="text-xs font-semibold tracking-wide text-[var(--atr-muted)] uppercase">
              {t}
            </p>
            <p className="mt-2 text-lg font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-[var(--atr-border)] bg-white p-5 transition hover:border-[var(--atr-brand)]"
          >
            <h3 className="font-semibold">{card.title}</h3>
            <p className="mt-1 text-sm text-[var(--atr-sub)]">{card.desc}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-5">
        <h3 className="font-semibold">Latest audit events</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {audit.map((e) => (
            <li key={e.id} className="border-b border-[var(--atr-border)] pb-2">
              <span className="font-medium">{e.action}</span>
              <span className="text-[var(--atr-muted)]">
                {" "}
                · {e.actorLabel} · {new Date(e.at).toLocaleString()}
              </span>
            </li>
          ))}
          {!audit.length ? (
            <li className="text-[var(--atr-muted)]">No audited actions yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
