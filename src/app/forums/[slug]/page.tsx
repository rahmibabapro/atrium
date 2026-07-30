import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ThreadComposer } from "@/components/forum/ThreadComposer";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { getServerSession } from "@/lib/atriumid/session";
import { site, threads as legacyThreads } from "@/lib/content";
import { ensureCategories, listThreads } from "@/lib/forum/service";
import { pickLocalized, resolveLang } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const forum = site.forumCategories
    .flatMap((c) => c.forums)
    .find((f) => f.slug === slug);
  return { title: forum ? forum.title.en || forum.title.tr || slug : slug };
}

function timeago(iso: string, lang: string): string {
  const diff = Date.now() - Date.parse(iso);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return lang === "en" ? `${minutes}m ago` : `${minutes}dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return lang === "en" ? `${hours}h ago` : `${hours}sa önce`;
  return new Date(iso).toLocaleDateString();
}

export default async function ForumDetailPage({ params }: Props) {
  const { slug } = await params;
  const lang = resolveLang((await cookies()).get("aom_lang")?.value);
  const forum = site.forumCategories
    .flatMap((c) => c.forums)
    .find((f) => f.slug === slug);
  if (!forum) notFound();

  await ensureCategories([forum]);
  const [{ threads }, session] = await Promise.all([
    listThreads(slug),
    getServerSession(),
  ]);

  const legacy = Object.entries(legacyThreads).filter(
    ([, t]) => t.forum === slug,
  );

  return (
    <PageReveal className="container section-pad">
      <Link data-reveal href="/forums" className="text-sm text-[var(--atr-brand)]">
        ← Forums
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHero
          title={pickLocalized(forum.title, lang)}
          description={`${lang === "en" ? "Forum" : "Forum"} · ${threads.length} ${lang === "en" ? "threads" : "konu"}`}
        />
      </div>

      <div data-reveal className="mt-6">
        {session ? (
          <ThreadComposer categorySlug={slug} />
        ) : (
          <p className="text-sm text-[var(--atr-sub)]">
            <Link href="/login" className="text-[var(--atr-brand)] hover:underline">
              {lang === "en" ? "Sign in" : "Giriş yap"}
            </Link>{" "}
            {lang === "en" ? "to start a thread." : "ve yeni konu aç."}
          </p>
        )}
      </div>

      <div
        data-reveal
        className="mt-8 divide-y divide-[var(--atr-border)] border-y border-[var(--atr-border)]"
      >
        {threads.length ? (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/threads/${thread.slug}`}
              className="flex items-center justify-between gap-4 py-4 transition hover:text-[var(--atr-brand)]"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {thread.pinned ? "📌 " : ""}
                  {thread.locked ? "🔒 " : ""}
                  {thread.title}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--atr-muted)]">
                  {thread.author_label} · {timeago(thread.last_post_at, lang)}
                </span>
              </span>
              <span className="shrink-0 text-sm text-[var(--atr-muted)]">
                {thread.reply_count}{" "}
                {lang === "en" ? "replies" : "yanıt"}
              </span>
            </Link>
          ))
        ) : (
          <p className="py-8 text-sm text-[var(--atr-sub)]">
            {lang === "en"
              ? "No threads yet — start the first one."
              : "Henüz konu yok — ilk konuyu sen aç."}
          </p>
        )}
      </div>

      {legacy.length ? (
        <section data-reveal className="mt-10">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-[var(--atr-muted)] uppercase">
            {lang === "en" ? "Archive" : "Arşiv"}
          </h2>
          <div className="mt-2 divide-y divide-[var(--atr-border)] border-y border-[var(--atr-border)]">
            {legacy.map(([id, thread]) => (
              <Link
                key={id}
                href={`/threads/${id}`}
                className="block py-3 text-sm transition hover:text-[var(--atr-brand)]"
              >
                {thread.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PageReveal>
  );
}
