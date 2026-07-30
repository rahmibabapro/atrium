import { getDb, newId, nowIso } from "@/lib/db";

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorLabel: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
  ip?: string;
};

/** Append-only audit log (database). Never truncated from the UI. */
export async function appendAudit(
  event: Omit<AuditEvent, "id" | "at"> & { at?: string },
): Promise<AuditEvent> {
  const full: AuditEvent = {
    id: newId(),
    at: event.at || nowIso(),
    actorId: event.actorId,
    actorLabel: event.actorLabel,
    action: event.action,
    target: event.target,
    meta: event.meta,
    ip: event.ip,
  };
  const db = await getDb();
  await db
    .insertInto("audit_log")
    .values({
      id: full.id,
      at: full.at,
      actor_id: full.actorId,
      actor_label: full.actorLabel,
      action: full.action,
      target: full.target ?? null,
      meta: full.meta ? JSON.stringify(full.meta) : null,
      ip: full.ip ?? null,
    })
    .execute();
  return full;
}

export async function readAudit(limit = 100): Promise<AuditEvent[]> {
  const db = await getDb();
  const rows = await db
    .selectFrom("audit_log")
    .selectAll()
    .orderBy("at", "desc")
    .limit(limit)
    .execute();
  return rows.map((r) => ({
    id: r.id,
    at: r.at,
    actorId: r.actor_id,
    actorLabel: r.actor_label,
    action: r.action,
    target: r.target ?? undefined,
    meta: r.meta ? (JSON.parse(r.meta) as Record<string, unknown>) : undefined,
    ip: r.ip ?? undefined,
  }));
}
