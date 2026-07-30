import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/atriumid/session";
import {
  bootstrapAdminIds,
  isBootstrapAdmin,
  parseRoles,
  sessionIsAdmin,
  sessionIsStaff,
} from "@/lib/atriumid/permissions";

export type StaffSession = NonNullable<Awaited<ReturnType<typeof getServerSession>>> & {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    username?: string | null;
  };
};

/** Server-only staff gate. Never rely on client checks for authorization. */
export async function requireStaff(opts?: {
  adminOnly?: boolean;
  redirectTo?: string;
}): Promise<StaffSession> {
  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/login?redirect=${encodeURIComponent(opts?.redirectTo || "/admin")}`);
  }

  const user = session.user as StaffSession["user"];
  const staff = sessionIsStaff(user);
  const admin = sessionIsAdmin(user);

  if (!staff || (opts?.adminOnly && !admin)) {
    redirect("/?error=forbidden");
  }

  return session as StaffSession;
}

export function staffLabel(session: StaffSession) {
  const u = session.user;
  return u.username || u.name || u.email;
}

export async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}

export function roleList(session: StaffSession) {
  if (isBootstrapAdmin(session.user.id)) return ["admin"];
  return parseRoles(session.user.role);
}

export { bootstrapAdminIds, isBootstrapAdmin, sessionIsAdmin, sessionIsStaff };
