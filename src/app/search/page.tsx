import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { allWikiPages, site } from "@/lib/content";

export const metadata: Metadata = { title: "Search" };

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
  const threadHits = query
    ? site.pinnedThreads.filter((t) =>
        t.title.toLocaleLowerCase("tr").includes(query),
      )
    : [];

  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Find"
        title="Search"
        description="Wiki pages and known threads — Atrium ID member search comes later."
      />
      <form data-reveal className="mt-8" action="/search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Wiki, topic…"
          className="w-full max-w-xl rounded-2xl border border-[var(--atr-border)] bg-white px-4 py-3 outline-none focus:border-[var(--atr-brand)]"
        />
      </form>
      {query ? (
        <div className="mt-10 grid gap-10 md:grid-cols-2">
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
          <section data-reveal>
            <h2 className="font-semibold tracking-tight">Threads ({threadHits.length})</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {threadHits.map((t) => (
                <li key={t.slug}>
                  <Link href={`/threads/${t.slug}`} className="text-[var(--atr-brand)] hover:underline">
                    {t.title}
                  </Link>
                </li>
              ))}
              {!threadHits.length ? (
                <li className="text-[var(--atr-muted)]">No thread hits.</li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : null}
    </PageReveal>
  );
}
