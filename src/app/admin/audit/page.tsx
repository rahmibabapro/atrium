import { readAudit } from "@/lib/admin/audit";
import { requireStaff } from "@/lib/admin/guard";

export default async function AdminAuditPage() {
  await requireStaff({ redirectTo: "/admin/audit" });
  const events = readAudit(200);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit log</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          Append-only staff action log. Not editable from the UI (Discourse-style
          staff action history).
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--atr-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--atr-border)] bg-[var(--atr-p-slate-050)] text-xs uppercase tracking-wide text-[var(--atr-muted)]">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-[var(--atr-border)]">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(e.at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{e.actorLabel}</td>
                <td className="px-4 py-3 font-medium">{e.action}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.target || "—"}</td>
              </tr>
            ))}
            {!events.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[var(--atr-muted)]">
                  Empty log.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
