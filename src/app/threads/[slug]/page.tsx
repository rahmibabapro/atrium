import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageReveal } from "@/components/motion/PageReveal";
import { site, threads } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(threads).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: threads[slug]?.title || slug };
}

export default async function ThreadPage({ params }: Props) {
  const { slug } = await params;
  const thread = threads[slug];
  if (!thread) notFound();
  return (
    <PageReveal className="container section-pad">
      <Link
        data-reveal
        href={`/forums/${thread.forum}`}
        className="text-sm text-[var(--atr-brand)]"
      >
        ← {thread.forum}
      </Link>
      <article
        data-reveal
        className="mt-6 max-w-3xl border-b border-[var(--atr-border)] pb-10"
      >
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{thread.title}</h1>
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-[var(--atr-sub)]">
          {thread.body}
        </p>
      </article>
      <p data-reveal className="mt-4 text-sm text-[var(--atr-muted)]">
        Sitemap parity thread · {site.brand}
      </p>
    </PageReveal>
  );
}
