import { getDb, newId, nowIso } from "@/lib/db";
import type { NotificationTable } from "@/lib/db/schema";

export type NotificationInput = {
  userId: string;
  kind: "reply" | "mention" | "moderation" | "system";
  title: string;
  body?: string;
  href?: string;
  actorLabel?: string;
};

export async function createNotification(input: NotificationInput) {
  const db = await getDb();
  await db
    .insertInto("notifications")
    .values({
      id: newId(),
      user_id: input.userId,
      kind: input.kind,
      title: input.title.slice(0, 200),
      body: input.body?.slice(0, 500) ?? null,
      href: input.href?.slice(0, 300) ?? null,
      actor_label: input.actorLabel?.slice(0, 80) ?? null,
      read: 0,
      at: nowIso(),
    })
    .execute();
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<NotificationTable[]> {
  const db = await getDb();
  return db
    .selectFrom("notifications")
    .selectAll()
    .where("user_id", "=", userId)
    .orderBy("at", "desc")
    .limit(limit)
    .execute();
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .selectFrom("notifications")
    .select((eb) => eb.fn.countAll().as("n"))
    .where("user_id", "=", userId)
    .where("read", "=", 0)
    .executeTakeFirst();
  return Number(row?.n ?? 0);
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const db = await getDb();
  let q = db
    .updateTable("notifications")
    .set({ read: 1 })
    .where("user_id", "=", userId);
  if (ids?.length) q = q.where("id", "in", ids);
  await q.execute();
}
