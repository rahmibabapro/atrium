import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site, threads } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return site.forumCategories.flatMap((c) =>
    c.forums.map((f) => ({ slug: f.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const forum = site.forumCategories
    .flatMap((c) => c.forums)
    .find((f) => f.slug === slug);
  return { title: forum?.title.tr || slug };
}

export default async function ForumDetailPage({ params }: Props) {
  const { slug } = await params;
  const forum = site.forumCategories
    .flatMap((c) => c.forums)
    .find((f) => f.slug === slug);
  if (!forum) notFound();
  const forumThreads = Object.entries(threads).filter(([, t]) => t.forum === slug);

  return (
    <PageReveal className="container section-pad">
      <Link data-reveal href="/forums" className="text-sm text-[var(--atr-brand)]">
        ← Forums
      </Link>
      <div className="mt-4">
        <PageHero title={forum.title.tr} description={`Forum · ${slug}`} />
      </div>
      <div data-reveal className="mt-8 divide-y divide-[var(--atr-border)] border-y border-[var(--atr-border)]">
        {forumThreads.length ? (
          forumThreads.map(([id, thread]) => (
            <Link
              key={id}
              href={`/threads/${id}`}
              className="block py-4 font-medium transition hover:text-[var(--atr-brand)]"
            >
              {thread.title}
            </Link>
          ))
        ) : (
          <p className="py-8 text-sm text-[var(--atr-sub)]">
            No migrated threads yet — category kept for sitemap parity.
          </p>
        )}
      </div>
    </PageReveal>
  );
}
