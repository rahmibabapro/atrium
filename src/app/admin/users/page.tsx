import { headers } from "next/headers";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { auth } from "@/lib/atriumid/auth";
import { requireStaff, roleList } from "@/lib/admin/guard";

export default async function AdminUsersPage() {
  const session = await requireStaff({ redirectTo: "/admin/users" });
  const roles = roleList(session);
  let users: Array<{
    id: string;
    name: string;
    email: string;
    role?: string | null;
    banned?: boolean | null;
    username?: string | null;
    createdAt?: string | Date | null;
  }> = [];
  let total = 0;
  try {
    const res = await auth.api.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
      headers: await headers(),
    });
    users = ((res as { users?: typeof users }).users || []) as typeof users;
    total = (res as { total?: number }).total ?? users.length;
  } catch {
    users = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          Atrium ID directory (registered accounts). For page activity and Google
          connections, open Analytics.
        </p>
      </div>
      <UsersPanel
        initialUsers={users}
        canSetRole={roles.includes("admin")}
        totalHint={total}
      />
    </div>
  );
}
