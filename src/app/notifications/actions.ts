"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/atriumid/session";
import { markNotificationsRead } from "@/lib/notifications/service";

export async function markAllNotificationsReadAction() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  await markNotificationsRead(session.user.id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true as const };
}
