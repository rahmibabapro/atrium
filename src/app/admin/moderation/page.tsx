import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { requireStaff } from "@/lib/admin/guard";
import { readModerationStore } from "@/lib/admin/moderation-store";

export default async function AdminModerationPage() {
  await requireStaff({ redirectTo: "/admin/moderation" });
  const store = readModerationStore();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Moderation</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          Warn, ban/unban (Better Auth), and queue content purges. Every action
          is audited. Copy user ids from the Users screen.
        </p>
      </div>
      <ModerationPanel initial={store} />
    </div>
  );
}
