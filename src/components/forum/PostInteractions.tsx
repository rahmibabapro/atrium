"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  reactAction,
  replyAction,
  reportPostAction,
} from "@/app/forums/actions";

export function ReactionBar({
  postId,
  threadSlug,
  reactions,
  reactionChoices,
  signedIn,
}: {
  postId: string;
  threadSlug: string;
  reactions: Array<{ emoji: string; count: number; mine: boolean }>;
  reactionChoices: readonly string[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle(emoji: string) {
    if (!signedIn || busy) return;
    setBusy(true);
    await reactAction({ postId, threadSlug, emoji });
    setBusy(false);
    router.refresh();
  }

  const byEmoji = new Map(reactions.map((r) => [r.emoji, r]));

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {reactionChoices.map((emoji) => {
        const r = byEmoji.get(emoji);
        return (
          <button
            key={emoji}
            type="button"
            disabled={!signedIn || busy}
            onClick={() => toggle(emoji)}
            title={signedIn ? "React" : "Sign in to react"}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              r?.mine
                ? "border-[var(--atr-brand)] bg-[var(--atr-p-slate-100)] font-semibold"
                : "border-[var(--atr-border)] bg-white hover:border-[var(--atr-brand)]"
            } ${signedIn ? "" : "opacity-60"}`}
          >
            {emoji}
            {r?.count ? <span className="ml-1">{r.count}</span> : null}
          </button>
        );
      })}
      {signedIn ? <ReportButton postId={postId} /> : null}
    </div>
  );
}

function ReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const reason = String(new FormData(e.currentTarget).get("reason") || "");
    const res = await reportPostAction({ postId, reason });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    setOpen(false);
  }

  if (done) {
    return (
      <span className="ml-2 text-xs text-[var(--atr-muted)]">Reported ✓</span>
    );
  }

  return (
    <span className="relative ml-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-[var(--atr-muted)] underline-offset-2 hover:underline"
      >
        Report
      </button>
      {open ? (
        <form
          onSubmit={onSubmit}
          className="absolute left-0 z-20 mt-2 w-64 rounded-xl border border-[var(--atr-border)] bg-white p-3 shadow-lg"
        >
          <input
            name="reason"
            required
            minLength={3}
            maxLength={500}
            placeholder="Why is this post a problem?"
            className="w-full rounded-lg border border-[var(--atr-border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--atr-brand)]"
          />
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <button type="submit" className="btn btn-primary mt-2 w-full !py-1.5 text-xs">
            Send report
          </button>
        </form>
      ) : null}
    </span>
  );
}

export function ReplyBox({ threadSlug }: { threadSlug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") || "");
    const res = await replyAction({ threadSlug, body });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-2xl border border-[var(--atr-border)] bg-white p-5"
    >
      <p className="text-xs font-semibold tracking-wide text-[var(--atr-muted)] uppercase">
        Reply (markdown supported, @mention notifies)
      </p>
      <textarea
        name="body"
        required
        minLength={2}
        maxLength={20000}
        rows={4}
        className="mt-2 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 text-sm outline-none focus:border-[var(--atr-brand)]"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button disabled={busy} type="submit" className="btn btn-primary mt-3 !py-2 text-sm">
        {busy ? "Posting…" : "Post reply"}
      </button>
    </form>
  );
}
