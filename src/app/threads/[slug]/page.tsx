import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactionBar, ReplyBox } from "@/components/forum/PostInteractions";
import { PageReveal } from "@/components/motion/PageReveal";
import { getServerSession } from "@/lib/atriumid/session";
import { sessionIsStaff } from "@/lib/atriumid/permissions";
import { site, threads as legacyThreads } from "@/lib/content";
import { renderPostHtml } from "@/lib/forum/markdown";
import { getThread, reactionSet } from "@/lib/forum/service";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const live = await getThread(slug).catch(() => null);
  if (live) return { title: live.thread.title };
  return { title: legacyThreads[slug]?.title || slug };
}

export default async function ThreadPage({ params }: Props) {
  const { slug } = await params;
  const session = await getServerSession();
  const viewer = session?.user as
    | { id: string; role?: string | null }
    | undefined;
  const isStaff = sessionIsStaff(viewer ?? null);

  const live = await getThread(slug, viewer?.id);

  if (live && (!live.thread.hidden || isStaff)) {
    const { thread, posts, categorySlug } = live;
    const visiblePosts = posts.filter((p) => !p.hidden || isStaff);
    return (
      <PageReveal className="container section-pad">
        <Link
          data-reveal
          href={categorySlug ? `/forums/${categorySlug}` : "/forums"}
          className="text-sm text-[var(--atr-brand)]"
        >
          ← {categorySlug || "forums"}
        </Link>

        <div data-reveal className="mt-6 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {thread.pinned ? "📌 " : ""}
            {thread.locked ? "🔒 " : ""}
            {thread.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--atr-muted)]">
            {thread.author_label} ·{" "}
            {new Date(thread.created_at).toLocaleDateString()} ·{" "}
            {thread.reply_count} replies
          </p>
        </div>

        <div data-reveal className="mt-8 max-w-3xl space-y-6">
          {visiblePosts.map((post, index) => (
            <article
              key={post.id}
              className={`rounded-2xl border p-5 ${
                post.hidden
                  ? "border-red-200 bg-red-50/50"
                  : "border-[var(--atr-border)] bg-white"
              }`}
            >
              <header className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold">{post.author_label}</p>
                <p className="text-xs text-[var(--atr-muted)]">
                  {index === 0 ? "OP · " : ""}
                  {new Date(post.created_at).toLocaleString()}
                  {post.edited_at ? " · edited" : ""}
                  {post.hidden ? " · hidden by moderators" : ""}
                </p>
              </header>
              <div
                className="post-body mt-3 text-sm leading-relaxed text-[var(--atr-sub)]"
                dangerouslySetInnerHTML={{ __html: renderPostHtml(post.body) }}
              />
              <ReactionBar
                postId={post.id}
                threadSlug={thread.slug}
                reactions={post.reactions}
                reactionChoices={reactionSet()}
                signedIn={Boolean(viewer)}
              />
            </article>
          ))}
        </div>

        <div className="max-w-3xl">
          {viewer && (!thread.locked || isStaff) ? (
            <ReplyBox threadSlug={thread.slug} />
          ) : !viewer ? (
            <p data-reveal className="mt-8 text-sm text-[var(--atr-sub)]">
              <Link href="/login" className="text-[var(--atr-brand)] hover:underline">
                Sign in
              </Link>{" "}
              to join the conversation.
            </p>
          ) : (
            <p data-reveal className="mt-8 text-sm text-[var(--atr-muted)]">
              This thread is locked.
            </p>
          )}
        </div>
      </PageReveal>
    );
  }

  // Legacy pack thread (seed/archive content shipped with the site pack).
  const legacy = legacyThreads[slug];
  if (!legacy) notFound();
  return (
    <PageReveal className="container section-pad">
      <Link
        data-reveal
        href={`/forums/${legacy.forum}`}
        className="text-sm text-[var(--atr-brand)]"
      >
        ← {legacy.forum}
      </Link>
      <article
        data-reveal
        className="mt-6 max-w-3xl border-b border-[var(--atr-border)] pb-10"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {legacy.title}
        </h1>
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-[var(--atr-sub)]">
          {legacy.body}
        </p>
      </article>
      <p data-reveal className="mt-4 text-sm text-[var(--atr-muted)]">
        Archived pack thread · {site.brand}
      </p>
    </PageReveal>
  );
}
