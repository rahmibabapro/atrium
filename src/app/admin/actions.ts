"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/atriumid/auth";
import { appendAudit } from "@/lib/admin/audit";
import { clientIp, requireStaff, roleList, staffLabel } from "@/lib/admin/guard";
import {
  addWarning,
  completePurge,
  getPurge,
  queuePurge,
  readModerationStore,
} from "@/lib/admin/moderation-store";
import {
  listOpenReports,
  moderatePost,
  purgeUserForumContent,
  resolveReport,
} from "@/lib/forum/service";
import { createNotification } from "@/lib/notifications/service";
import { packHrefSet } from "@/lib/admin/page-registry";
import {
  formatZodError,
  mergeHomeWidgets,
  readSiteOverrides,
  siteOverridesSchema,
  writeSiteOverrides,
  type SiteOverrides,
} from "@/lib/admin/site-overrides";
import { config } from "@/lib/content";

async function actorContext() {
  const session = await requireStaff({ redirectTo: "/admin" });
  return {
    session,
    label: staffLabel(session),
    roles: roleList(session),
    ip: await clientIp(),
  };
}

export async function saveSiteOrganization(input: unknown) {
  const { session, label, roles, ip } = await actorContext();
  if (!roles.includes("admin")) {
    throw new Error("FORBIDDEN_SITE_UPDATE");
  }

  const parsed = siteOverridesSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const allowed = packHrefSet(config);
  const rawPages = parsed.data.pages;
  if (rawPages?.length) {
    const unknown = rawPages.filter((p) => !allowed.has(p.href)).map((p) => p.href);
    if (unknown.length) {
      throw new Error(`Unknown page hrefs (not in pack): ${unknown.join(", ")}`);
    }
    const seen = new Set<string>();
    for (const p of rawPages) {
      if (seen.has(p.href)) {
        throw new Error(`Duplicate page href: ${p.href}`);
      }
      seen.add(p.href);
    }
  }

  const current = readSiteOverrides();
  const pages = rawPages?.map((p, index) => ({
    ...p,
    order: p.order ?? index,
    inHeader: p.status === "offline" ? false : p.inHeader,
    inFooter: p.status === "offline" ? false : p.inFooter,
  }));

  const next: SiteOverrides = {
    theme: parsed.data.theme ?? current.theme,
    pages: pages ?? current.pages,
    homeWidgets: mergeHomeWidgets(
      parsed.data.homeWidgets ?? current.homeWidgets,
    ),
    google:
      parsed.data.google !== undefined ? parsed.data.google : current.google,
    navOrder:
      pages?.map((p) => p.href) ??
      parsed.data.navOrder ??
      current.navOrder,
    navHidden:
      pages
        ?.filter((p) => !p.inHeader || p.status === "offline")
        .map((p) => p.href) ??
      parsed.data.navHidden ??
      current.navHidden,
    updatedAt: new Date().toISOString(),
    updatedBy: session.user.id,
  };

  await writeSiteOverrides(next);
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "site.organize",
    meta: {
      themeKeys: Object.keys(next.theme || {}),
      pages: next.pages?.length,
      widgets: next.homeWidgets?.length,
      google: Boolean(next.google?.analyticsId || next.google?.adsenseClient),
    },
    ip,
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/site");
  return { ok: true as const };
}

export async function resetSiteOrganization() {
  const { session, label, roles, ip } = await actorContext();
  if (!roles.includes("admin")) {
    throw new Error("FORBIDDEN_SITE_UPDATE");
  }
  await writeSiteOverrides({
    updatedAt: new Date().toISOString(),
    updatedBy: session.user.id,
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "site.reset",
    ip,
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/site");
  return { ok: true as const };
}

const warnInput = z.object({
  userId: z.string().min(1).max(80),
  username: z.string().max(32).optional(),
  reason: z.string().min(3).max(500),
});

export async function warnUser(raw: unknown) {
  const { session, label, ip } = await actorContext();
  const parsed = warnInput.safeParse(raw);
  if (!parsed.success) throw new Error(formatZodError(parsed.error));
  const input = parsed.data;
  const row = await addWarning({
    userId: input.userId,
    username: input.username,
    reason: input.reason,
    by: session.user.id,
    byLabel: label,
  });
  await createNotification({
    userId: input.userId,
    kind: "moderation",
    title: "You received a moderation warning",
    body: input.reason,
    actorLabel: label,
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "mod.warn",
    target: input.userId,
    meta: { reason: input.reason },
    ip,
  });
  revalidatePath("/admin/moderation");
  return row;
}

const banInput = z.object({
  userId: z.string().min(1).max(80),
  reason: z.string().min(3).max(500),
  banExpiresIn: z.number().int().positive().max(60 * 60 * 24 * 365).optional(),
});

export async function banUserAction(raw: unknown) {
  const { session, label, ip } = await actorContext();
  const parsed = banInput.safeParse(raw);
  if (!parsed.success) throw new Error(formatZodError(parsed.error));
  const input = parsed.data;
  if (input.userId === session.user.id) {
    throw new Error("CANNOT_BAN_SELF");
  }
  await auth.api.banUser({
    body: {
      userId: input.userId,
      banReason: input.reason,
      banExpiresIn: input.banExpiresIn,
    },
    headers: await headers(),
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "mod.ban",
    target: input.userId,
    meta: { reason: input.reason, banExpiresIn: input.banExpiresIn },
    ip,
  });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function unbanUserAction(userId: string) {
  const { session, label, ip } = await actorContext();
  const id = z.string().min(1).max(80).parse(userId);
  await auth.api.unbanUser({
    body: { userId: id },
    headers: await headers(),
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "mod.unban",
    target: id,
    ip,
  });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/users");
  return { ok: true as const };
}

const purgeInput = z.object({
  userId: z.string().min(1).max(80),
  username: z.string().max(32).optional(),
  scope: z.enum(["messages", "threads", "all"]),
  note: z.string().max(500).optional(),
});

export async function purgeUserContent(raw: unknown) {
  const { session, label, ip } = await actorContext();
  const parsed = purgeInput.safeParse(raw);
  if (!parsed.success) throw new Error(formatZodError(parsed.error));
  const input = parsed.data;
  const row = await queuePurge({
    userId: input.userId,
    username: input.username,
    scope: input.scope,
    by: session.user.id,
    byLabel: label,
    note: input.note,
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "mod.purge_queue",
    target: input.userId,
    meta: { scope: input.scope },
    ip,
  });
  revalidatePath("/admin/moderation");
  return row;
}

export async function listUsersAction(search = "") {
  await actorContext();
  const q = z.string().max(80).parse(search || "");
  const res = await auth.api.listUsers({
    query: {
      limit: 50,
      searchValue: q || undefined,
      searchField: q ? "name" : undefined,
      searchOperator: q ? "contains" : undefined,
    },
    headers: await headers(),
  });
  return res;
}

export async function setUserRoleAction(
  userId: string,
  role: "admin" | "moderator" | "user",
) {
  const { session, label, roles, ip } = await actorContext();
  if (!roles.includes("admin")) {
    throw new Error("FORBIDDEN_SET_ROLE");
  }
  const id = z.string().min(1).max(80).parse(userId);
  const r = z.enum(["admin", "moderator", "user"]).parse(role);
  if (id === session.user.id && r !== "admin") {
    throw new Error("CANNOT_DEMOTE_SELF");
  }
  await auth.api.setRole({
    body: { userId: id, role: r },
    headers: await headers(),
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: "admin.set_role",
    target: id,
    meta: { role: r },
    ip,
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function getModerationSnapshot() {
  await actorContext();
  return await readModerationStore();
}

/** Executes a queued purge against the real forum tables. */
export async function runPurgeAction(purgeId: string) {
  const { session, label, ip } = await actorContext();
  const id = z.string().min(1).max(64).parse(purgeId);
  const purge = await getPurge(id);
  if (!purge) throw new Error("PURGE_NOT_FOUND");
  if (purge.status !== "queued") throw new Error("PURGE_ALREADY_PROCESSED");

  try {
    const removed = await purgeUserForumContent(purge.userId, purge.scope);
    await completePurge(id, "done");
    await appendAudit({
      actorId: session.user.id,
      actorLabel: label,
      action: "mod.purge_run",
      target: purge.userId,
      meta: { scope: purge.scope, ...removed },
      ip,
    });
    revalidatePath("/admin/moderation");
    return { ok: true as const, removed };
  } catch (err) {
    await completePurge(id, "failed");
    revalidatePath("/admin/moderation");
    throw err;
  }
}

const moderatePostInput = z.object({
  postId: z.string().min(1).max(64),
  action: z.enum(["hide", "unhide"]),
  reason: z.string().max(500).optional(),
});

export async function moderatePostAction(raw: unknown) {
  const { session, label, ip } = await actorContext();
  const input = moderatePostInput.parse(raw);
  await moderatePost({
    postId: input.postId,
    action: input.action,
    by: session.user.id,
    reason: input.reason,
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: `mod.post_${input.action}`,
    target: input.postId,
    meta: input.reason ? { reason: input.reason } : undefined,
    ip,
  });
  revalidatePath("/admin/moderation");
  return { ok: true as const };
}

const resolveReportInput = z.object({
  reportId: z.string().min(1).max(64),
  status: z.enum(["resolved", "dismissed"]),
  hidePostId: z.string().max(64).optional(),
});

export async function resolveReportAction(raw: unknown) {
  const { session, label, ip } = await actorContext();
  const input = resolveReportInput.parse(raw);
  if (input.hidePostId) {
    await moderatePost({
      postId: input.hidePostId,
      action: "hide",
      by: session.user.id,
      reason: "Report resolved",
    });
  }
  await resolveReport({
    reportId: input.reportId,
    status: input.status,
    by: session.user.id,
  });
  await appendAudit({
    actorId: session.user.id,
    actorLabel: label,
    action: `mod.report_${input.status}`,
    target: input.reportId,
    meta: input.hidePostId ? { hidPost: input.hidePostId } : undefined,
    ip,
  });
  revalidatePath("/admin/moderation");
  return { ok: true as const };
}

export async function listOpenReportsAction() {
  await actorContext();
  return listOpenReports();
}
