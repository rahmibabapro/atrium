import { getDb, newId, nowIso } from "@/lib/db";
import type {
  ModerationPurge,
  ModerationStore,
  ModerationWarning,
} from "./moderation-types";

export type { ModerationStore } from "./moderation-types";

export async function readModerationStore(): Promise<ModerationStore> {
  const db = await getDb();
  const [warnings, notes, purges] = await Promise.all([
    db
      .selectFrom("moderation_warnings")
      .selectAll()
      .orderBy("at", "desc")
      .limit(200)
      .execute(),
    db
      .selectFrom("moderation_notes")
      .selectAll()
      .orderBy("at", "desc")
      .limit(200)
      .execute(),
    db
      .selectFrom("moderation_purges")
      .selectAll()
      .orderBy("at", "desc")
      .limit(200)
      .execute(),
  ]);

  return {
    warnings: warnings.map((w) => ({
      id: w.id,
      userId: w.user_id,
      username: w.username ?? undefined,
      reason: w.reason,
      by: w.by_id,
      byLabel: w.by_label,
      at: w.at,
    })),
    notes: notes.map((n) => ({
      id: n.id,
      userId: n.user_id,
      body: n.body,
      by: n.by_id,
      byLabel: n.by_label,
      at: n.at,
    })),
    purges: purges.map((p) => ({
      id: p.id,
      userId: p.user_id,
      username: p.username ?? undefined,
      scope: p.scope as ModerationPurge["scope"],
      status: p.status as ModerationPurge["status"],
      by: p.by_id,
      byLabel: p.by_label,
      at: p.at,
      note: p.note ?? undefined,
    })),
  };
}

export async function addWarning(input: {
  userId: string;
  username?: string;
  reason: string;
  by: string;
  byLabel: string;
}): Promise<ModerationWarning> {
  const row: ModerationWarning = {
    id: newId(),
    at: nowIso(),
    ...input,
  };
  const db = await getDb();
  await db
    .insertInto("moderation_warnings")
    .values({
      id: row.id,
      at: row.at,
      user_id: row.userId,
      username: row.username ?? null,
      reason: row.reason,
      by_id: row.by,
      by_label: row.byLabel,
    })
    .execute();
  return row;
}

export async function queuePurge(input: {
  userId: string;
  username?: string;
  scope: "messages" | "threads" | "all";
  by: string;
  byLabel: string;
  note?: string;
}): Promise<ModerationPurge> {
  const row: ModerationPurge = {
    id: newId(),
    at: nowIso(),
    status: "queued",
    ...input,
  };
  const db = await getDb();
  await db
    .insertInto("moderation_purges")
    .values({
      id: row.id,
      at: row.at,
      user_id: row.userId,
      username: row.username ?? null,
      scope: row.scope,
      status: row.status,
      note: row.note ?? null,
      by_id: row.by,
      by_label: row.byLabel,
      processed_at: null,
    })
    .execute();
  return row;
}

/** Mark a queued purge as processed (done/failed) after content removal ran. */
export async function completePurge(
  id: string,
  status: "done" | "failed",
): Promise<void> {
  const db = await getDb();
  await db
    .updateTable("moderation_purges")
    .set({ status, processed_at: nowIso() })
    .where("id", "=", id)
    .execute();
}
