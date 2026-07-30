"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageReveal } from "@/components/motion/PageReveal";
import type { WikiGroup, WikiPage } from "@/lib/content";
import { renderInlineMarkdown, sectionBodyText } from "@/lib/wiki-render";

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9ğüşöçı\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function WikiApp({ groups }: { groups: WikiGroup[] }) {
  const pages = useMemo(
    () => groups.flatMap((g) => (g.pages || []).filter((p) => p.slug && !p.navDivider)),
    [groups],
  );
  const [slug, setSlug] = useState("joining-the-server");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = () => {
      const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
      const next = hash.split("/").filter(Boolean)[0] || "joining-the-server";
      setSlug(next);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const active: WikiPage =
    pages.find((p) => p.slug === slug) || pages[0] || { title: "Wiki", sections: [] };

  const filtered = query.trim()
    ? pages.filter((p) => {
        const hay = [p.title, p.lead, ...(p.tags || [])]
          .join(" ")
          .toLocaleLowerCase("tr");
        return hay.includes(query.trim().toLocaleLowerCase("tr"));
      })
    : pages;

  return (
    <PageReveal className="container grid gap-8 section-pad lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside
        data-reveal
        className="h-fit rounded-2xl border border-[var(--atr-border)] bg-white/90 p-4 shadow-[0_10px_40px_rgba(15,23,42,0.03)] backdrop-blur lg:sticky lg:top-24"
      >
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--atr-brand)] uppercase">
          Official guide
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wiki içinde ara..."
          className="mt-3 w-full rounded-xl border border-[var(--atr-border)] bg-[var(--atr-p-slate-050)] px-3 py-2 text-sm outline-none focus:border-[var(--atr-brand)]"
        />
        <div className="mt-4 max-h-[70vh] space-y-4 overflow-auto pr-1 [scrollbar-width:thin]">
          {groups.map((group) => {
            const groupPages = (group.pages || []).filter(
              (p) => p.slug && !p.navDivider && filtered.some((f) => f.slug === p.slug),
            );
            if (!groupPages.length) return null;
            return (
              <div key={group.id}>
                <p className="mb-2 text-xs font-semibold text-[var(--atr-muted)] uppercase">
                  {group.title || group.name || group.id}
                </p>
                <div className="space-y-1">
                  {groupPages.map((page) => (
                    <a
                      key={page.slug}
                      href={`#/${page.slug}/`}
                      className={`block rounded-lg px-3 py-2 text-sm ${
                        page.slug === active.slug
                          ? "bg-[var(--atr-brand)] font-semibold text-white"
                          : "text-[var(--atr-sub)] hover:bg-[var(--atr-p-slate-100)]"
                      }`}
                    >
                      {page.title}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <article data-reveal className="min-w-0">
        <div className="overflow-hidden rounded-3xl border border-[var(--atr-border)] bg-white">
          <div className="border-b border-[var(--atr-border)] bg-gradient-to-br from-[var(--atr-p-slate-050)] to-white px-6 py-8 sm:px-10">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--atr-brand)] uppercase">
              Wiki
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {active.title}
            </h1>
            {active.lead ? (
              <p className="mt-3 max-w-3xl text-[var(--atr-sub)]">{active.lead}</p>
            ) : null}
            {active.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {active.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[rgba(24,181,116,0.12)] px-3 py-1 text-xs font-medium text-[var(--atr-p-green-700)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            {(active.sections || []).map((section) => {
              const sid = slugify(section.id || section.title || "section");
              const body = sectionBodyText(section);
              return (
                <section key={sid} id={sid} className="scroll-mt-28">
                  {section.title ? (
                    <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                  ) : null}
                  <div className="prose-aom mt-3 space-y-3 text-[var(--atr-sub)] leading-relaxed">
                    {body.map((line, idx) => (
                      <p
                        key={idx}
                        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }}
                      />
                    ))}
                    {section.list ? (
                      <ul className="list-disc space-y-1 pl-5">
                        {section.list.map((item) => (
                          <li
                            key={item}
                            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }}
                          />
                        ))}
                      </ul>
                    ) : null}
                    {section.table ? (
                      <div className="overflow-x-auto rounded-xl border border-[var(--atr-border)]">
                        <table className="min-w-full text-left text-sm">
                          <tbody>
                            {section.table.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={rIdx === 0 ? "bg-[var(--atr-p-slate-050)] font-semibold" : ""}
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="border-t border-[var(--atr-border)] px-3 py-2"
                                    dangerouslySetInnerHTML={{
                                      __html: renderInlineMarkdown(cell),
                                    }}
                                  />
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    {section.replacements ? (
                      <div className="space-y-3">
                        {section.replacements.map((row) => (
                          <div
                            key={row.from}
                            className="rounded-xl border border-[var(--atr-border)] bg-[var(--atr-p-slate-050)] p-4"
                          >
                            <p className="text-sm font-semibold text-[var(--atr-text)]">
                              {row.from} → {row.to}
                            </p>
                            {row.examples?.length ? (
                              <ul className="mt-2 list-disc pl-5 text-sm">
                                {row.examples.map((ex) => (
                                  <li key={ex}>{ex}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {section.callout?.text ? (
                      <div className="rounded-xl border border-[rgba(24,181,116,0.25)] bg-[rgba(24,181,116,0.08)] p-4 text-sm text-[var(--atr-text)]">
                        <strong>{section.callout.label || "Not"}:</strong>{" "}
                        {section.callout.text}
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--atr-muted)]">
          Lore redirect: <Link href="/lore">/lore</Link> → Wiki
        </p>
      </article>
    </PageReveal>
  );
}
