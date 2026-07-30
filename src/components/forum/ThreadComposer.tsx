"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createThreadAction } from "@/app/forums/actions";

export function ThreadComposer({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await createThreadAction({
      categorySlug,
      title: String(data.get("title") || ""),
      body: String(data.get("body") || ""),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/threads/${res.data!.slug}`);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary !py-2 text-sm"
      >
        New thread
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 rounded-2xl border border-[var(--atr-border)] bg-white p-5"
    >
      <label className="block text-xs font-semibold tracking-wide text-[var(--atr-muted)] uppercase">
        Title
        <input
          name="title"
          required
          minLength={4}
          maxLength={160}
          className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[var(--atr-brand)]"
        />
      </label>
      <label className="mt-3 block text-xs font-semibold tracking-wide text-[var(--atr-muted)] uppercase">
        Body (markdown: **bold**, `code`, &gt; quote, links)
        <textarea
          name="body"
          required
          minLength={2}
          maxLength={20000}
          rows={6}
          className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 text-sm font-normal normal-case tracking-normal outline-none focus:border-[var(--atr-brand)]"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} type="submit" className="btn btn-primary !py-2 text-sm">
          {busy ? "Posting…" : "Post thread"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn border border-[var(--atr-border)] !py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
