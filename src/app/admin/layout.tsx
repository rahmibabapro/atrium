import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff, roleList } from "@/lib/admin/guard";
import { site } from "@/lib/content";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff({ redirectTo: "/admin" });
  const roles = roleList(session);

  return (
    <AdminShell brand={site.brand} roleLabel={roles.join(" · ")} roles={roles}>
      {children}
    </AdminShell>
  );
}
