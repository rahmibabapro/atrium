"use client";

import { useState, useTransition } from "react";
import { listUsersAction, setUserRoleAction } from "@/app/admin/actions";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  username?: string | null;
  createdAt?: string | Date | null;
};

export function UsersPanel({
  initialUsers,
  canSetRole,
  totalHint,
}: {
  initialUsers: UserRow[];
  canSetRole: boolean;
  totalHint?: number;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function search() {
    setMsg(null);
    start(async () => {
      const res = await listUsersAction(q);
      const list = (res as { users?: UserRow[] }).users || [];
      setUsers(list as UserRow[]);
    });
  }

  function setRole(userId: string, role: "admin" | "moderator" | "user") {
    setMsg(null);
    start(async () => {
      try {
        await setUserRoleAction(userId, role);
        setMsg(`Role set to ${role}`);
        search();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {typeof totalHint === "number" ? (
        <p className="text-sm text-[var(--atr-sub)]">
          Showing {users.length}
          {totalHint > users.length ? ` of ~${totalHint}` : ""} registered
          accounts. Deeper activity is on{" "}
          <a href="/admin/analytics" className="underline">
            Analytics
          </a>
          .
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          className="min-w-[220px] flex-1 rounded-xl border border-[var(--atr-border)] px-3 py-2"
        />
        <button
          type="button"
          disabled={pending}
          onClick={search}
          className="btn btn-primary !py-2 text-sm"
        >
          Search
        </button>
      </div>
      {msg ? <p className="text-sm text-[var(--atr-sub)]">{msg}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--atr-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--atr-border)] bg-[var(--atr-p-slate-050)] text-xs uppercase tracking-wide text-[var(--atr-muted)]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--atr-border)]">
                <td className="px-4 py-3">
                  <div className="font-semibold">{u.username || u.name}</div>
                  <div className="text-xs text-[var(--atr-muted)]">{u.email}</div>
                  <div className="font-mono text-[10px] text-[var(--atr-muted)]">
                    {u.id}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--atr-muted)]">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3">{u.role || "user"}</td>
                <td className="px-4 py-3">
                  {u.banned ? (
                    <span className="text-red-600">Banned</span>
                  ) : (
                    <span className="text-emerald-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {canSetRole ? (
                    <div className="flex flex-wrap gap-1">
                      {(["user", "moderator", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          disabled={pending}
                          onClick={() => setRole(u.id, r)}
                          className="rounded-full bg-[var(--atr-p-slate-100)] px-2 py-1 text-[11px] font-semibold"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--atr-muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-[var(--atr-muted)]">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
