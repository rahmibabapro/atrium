import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview", roles: ["admin", "moderator"] as const },
  { href: "/admin/site", label: "Site foundation", roles: ["admin"] as const },
  {
    href: "/admin/analytics",
    label: "Analytics",
    roles: ["admin", "moderator"] as const,
  },
  {
    href: "/admin/moderation",
    label: "Moderation",
    roles: ["admin", "moderator"] as const,
  },
  { href: "/admin/users", label: "Users", roles: ["admin", "moderator"] as const },
  { href: "/admin/audit", label: "Audit log", roles: ["admin", "moderator"] as const },
];

export function AdminShell({
  children,
  roleLabel,
  brand,
  roles,
}: {
  children: React.ReactNode;
  roleLabel: string;
  brand: string;
  roles: string[];
}) {
  const visible = links.filter((l) => l.roles.some((r) => roles.includes(r)));

  return (
    <div className="min-h-screen bg-[var(--atr-p-slate-050)]">
      <div className="border-b border-[var(--atr-border)] bg-[var(--hp-bg)] text-white">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--atr-p-gold-500)] uppercase">
              Atrium ID Control
            </p>
            <h1 className="text-xl font-bold tracking-tight">{brand} Admin</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">{roleLabel}</span>
            <Link href="/" className="text-white/80 hover:text-white">
              View site
            </Link>
          </div>
        </div>
        <nav className="container flex gap-1 overflow-x-auto pb-3">
          {visible.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/20"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="container py-8">{children}</div>
    </div>
  );
}
