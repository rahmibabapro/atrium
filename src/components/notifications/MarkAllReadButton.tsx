"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsReadAction } from "@/app/notifications/actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="btn border border-[var(--atr-border)] bg-white !py-2 text-sm"
      onClick={() =>
        start(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      {pending ? "Marking…" : "Mark all read"}
    </button>
  );
}
