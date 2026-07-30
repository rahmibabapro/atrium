import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { getServerSession } from "@/lib/atriumid/session";
import { listNotifications } from "@/lib/notifications/service";

export const metadata: Metadata = { title: "Notifications" };

export const dynamic = "force-dynamic";

const KIND_ICON: Record<string, string> = {
  reply: "💬",
  mention: "@",
  moderation: "🛡️",
  system: "ℹ️",
};

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const notifications = await listNotifications(session.user.id, 50);
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Inbox"
        title="Notifications"
        description="Replies, mentions, and moderation updates on your account."
        actions={hasUnread ? <MarkAllReadButton /> : undefined}
      />

      <ul data-reveal className="mt-8 max-w-2xl divide-y divide-[var(--atr-border)] border-y border-[var(--atr-border)]">
        {notifications.map((n) => {
          const inner = (
            <span className="flex items-start gap-3">
              <span className="mt-0.5 text-base">{KIND_ICON[n.kind] || "•"}</span>
              <span className="min-w-0">
                <span
                  className={`block ${n.read ? "text-[var(--atr-sub)]" : "font-semibold"}`}
                >
                  {n.title}
                </span>
                {n.body ? (
                  <span className="mt-0.5 block truncate text-xs text-[var(--atr-muted)]">
                    {n.body}
                  </span>
                ) : null}
                <span className="mt-0.5 block text-xs text-[var(--atr-muted)]">
                  {new Date(n.at).toLocaleString()}
                </span>
              </span>
              {!n.read ? (
                <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--atr-brand)]" />
              ) : null}
            </span>
          );
          return (
            <li key={n.id} className="py-4">
              {n.href ? (
                <Link href={n.href} className="block transition hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
        {!notifications.length ? (
          <li className="py-10 text-sm text-[var(--atr-muted)]">
            Nothing yet — replies and @mentions will land here.
          </li>
        ) : null}
      </ul>
    </PageReveal>
  );
}
