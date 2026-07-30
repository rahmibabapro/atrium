import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Atrium ID RBAC — Better Auth admin access control + Atrium resources.
 * Server is source of truth; never trust client role claims alone.
 */
const statement = {
  ...defaultStatements,
  site: ["read", "update"],
  moderation: ["warn", "ban", "purge", "delete-content"],
} as const;

export const ac = createAccessControl(statement);

/** Full control: users, sessions, site organizer, moderation */
export const adminRole = ac.newRole({
  ...adminAc.statements,
  site: ["read", "update"],
  moderation: ["warn", "ban", "purge", "delete-content"],
});

/** Community staff: moderate users/content; cannot redesign site or set roles */
export const moderatorRole = ac.newRole({
  user: ["list", "ban", "get"],
  session: ["list", "revoke"],
  site: ["read"],
  moderation: ["warn", "ban", "purge", "delete-content"],
});

export const userRole = ac.newRole({
  user: [],
  session: [],
  site: [],
  moderation: [],
});

export const roles = {
  admin: adminRole,
  moderator: moderatorRole,
  user: userRole,
};

export type StaffRole = "admin" | "moderator";

export function parseRoles(role: string | null | undefined): string[] {
  if (!role) return ["user"];
  return role.split(",").map((r) => r.trim()).filter(Boolean);
}

export function hasStaffRole(role: string | null | undefined): boolean {
  const rolesList = parseRoles(role);
  return rolesList.includes("admin") || rolesList.includes("moderator");
}

export function isAdminRole(role: string | null | undefined): boolean {
  return parseRoles(role).includes("admin");
}

/** Comma-separated Atrium ID user ids that always have admin (env bootstrap). */
export function bootstrapAdminIds(): string[] {
  return (process.env.ATRIUM_ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isBootstrapAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return bootstrapAdminIds().includes(userId);
}

export function sessionIsStaff(user: {
  id: string;
  role?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return isBootstrapAdmin(user.id) || hasStaffRole(user.role);
}

export function sessionIsAdmin(user: {
  id: string;
  role?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return isBootstrapAdmin(user.id) || isAdminRole(user.role);
}
