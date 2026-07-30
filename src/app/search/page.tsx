import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { allWikiPages } from "@/lib/content";
import { searchForum } from "@/lib/search";

export const metadata: Metadata = { title: "Search" };

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLocaleLowerCase("tr");
  const wikiHits = query
    ? allWikiPages().filter((p) =>
        [p.title, p.lead, ...(p.tags || [])]
          .join(" ")
          .toLocaleLowerCase("tr")
          .includes(query),
      )
    : [];
  const forumHits = query ? await searchForum(q).catch(() => []) : [];

  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Find"
        title="Search"
        description="Full-text search across forum threads and posts, plus wiki pages."
      />
      <form data-reveal className="mt-8" action="/search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Threads, posts, wiki…"
          className="w-full max-w-xl rounded-2xl border border-[var(--atr-border)] bg-white px-4 py-3 outline-none focus:border-[var(--atr-brand)]"
        />
      </form>
      {query ? (
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <section data-reveal>
            <h2 className="font-semibold tracking-tight">
              Forum ({forumHits.length})
            </h2>
            <ul className="mt-4 space-y-4 text-sm">
              {forumHits.map((hit) => (
                <li key={hit.postId}>
                  <Link
                    href={`/threads/${hit.threadSlug}`}
                    className="font-medium text-[var(--atr-brand)] hover:underline"
                  >
                    {hit.threadTitle}
                  </Link>
                  <p className="mt-1 text-[var(--atr-sub)]">{hit.excerpt}</p>
                  <p className="mt-0.5 text-xs text-[var(--atr-muted)]">
                    {hit.authorLabel} ·{" "}
                    {new Date(hit.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
              {!forumHits.length ? (
                <li className="text-[var(--atr-muted)]">No forum hits.</li>
              ) : null}
            </ul>
          </section>
          <section data-reveal>
            <h2 className="font-semibold tracking-tight">Wiki ({wikiHits.length})</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {wikiHits.slice(0, 20).map((p) => (
                <li key={p.slug}>
                  <Link href={`/wiki#/${p.slug}/`} className="text-[var(--atr-brand)] hover:underline">
                    {p.title}
                  </Link>
                </li>
              ))}
              {!wikiHits.length ? (
                <li className="text-[var(--atr-muted)]">No wiki hits.</li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : null}
    </PageReveal>
  );
}
