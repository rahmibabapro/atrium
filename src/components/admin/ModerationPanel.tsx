"use client";

import { useState, useTransition } from "react";
import {
  banUserAction,
  purgeUserContent,
  unbanUserAction,
  warnUser,
} from "@/app/admin/actions";
import type { ModerationStore } from "@/lib/admin/moderation-types";

export function ModerationPanel({ initial }: { initial: ModerationStore }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    start(async () => {
      try {
        await fn();
        setMsg(ok);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl border border-[var(--atr-border)] bg-white p-6">
        <h2 className="text-lg font-bold tracking-tight">Take action</h2>
        <p className="mt-1 text-sm text-[var(--atr-sub)]">
          Server-authorized. Bans use Better Auth admin APIs. Purge queues until
          forum/Pulse stores are wired.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium">
            User id
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              placeholder="Atrium ID user id"
            />
          </label>
          <label className="block text-sm font-medium">
            Username (optional)
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Reason
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 min-h-24 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn btn-primary !py-2 text-sm"
            onClick={() =>
              run(
                () => warnUser({ userId, username, reason }),
                "Warning recorded",
              )
            }
          >
            Warn
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn border border-red-200 bg-red-50 !py-2 text-sm text-red-700"
            onClick={() =>
              run(
                () => banUserAction({ userId, reason }),
                "User banned",
              )
            }
          >
            Ban
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn border border-[var(--atr-border)] bg-white !py-2 text-sm"
            onClick={() => run(() => unbanUserAction(userId), "User unbanned")}
          >
            Unban
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn border border-[var(--atr-border)] bg-white !py-2 text-sm"
            onClick={() =>
              run(
                () =>
                  purgeUserContent({
                    userId,
                    username,
                    scope: "all",
                    note: reason,
                  }),
                "Purge queued",
              )
            }
          >
            Queue delete all content
          </button>
        </div>
        {msg ? <p className="mt-3 text-sm text-[var(--atr-sub)]">{msg}</p> : null}
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-[var(--atr-border)] bg-white p-6">
          <h3 className="font-semibold">Recent warnings</h3>
          <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
            {initial.warnings.slice(0, 20).map((w) => (
              <li key={w.id} className="border-b border-[var(--atr-border)] pb-2">
                <span className="font-mono text-xs">{w.userId}</span>
                <p className="text-[var(--atr-sub)]">{w.reason}</p>
                <p className="text-xs text-[var(--atr-muted)]">
                  {w.byLabel} · {new Date(w.at).toLocaleString()}
                </p>
              </li>
            ))}
            {!initial.warnings.length ? (
              <li className="text-[var(--atr-muted)]">No warnings yet.</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--atr-border)] bg-white p-6">
          <h3 className="font-semibold">Purge queue</h3>
          <ul className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
            {initial.purges.slice(0, 20).map((p) => (
              <li key={p.id} className="border-b border-[var(--atr-border)] pb-2">
                <span className="font-mono text-xs">{p.userId}</span>
                <p className="text-[var(--atr-sub)]">
                  {p.scope} · {p.status}
                </p>
              </li>
            ))}
            {!initial.purges.length ? (
              <li className="text-[var(--atr-muted)]">Queue empty.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
