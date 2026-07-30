import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { requireStaff } from "@/lib/admin/guard";
import { readModerationStore } from "@/lib/admin/moderation-store";
import { listOpenReports } from "@/lib/forum/service";

export default async function AdminModerationPage() {
  await requireStaff({ redirectTo: "/admin/moderation" });
  const [store, reports] = await Promise.all([
    readModerationStore(),
    listOpenReports(),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Moderation</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          Warn, ban/unban (Better Auth), handle post reports, and purge forum
          content. Every action is audited. Copy user ids from the Users screen.
        </p>
      </div>
      <ModerationPanel initial={store} reports={reports} />
    </div>
  );
}
