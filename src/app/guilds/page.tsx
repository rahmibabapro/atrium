import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site, wikiPageBySlug } from "@/lib/content";
import { requireFeature } from "@/lib/features";
import { renderInlineMarkdown, sectionBodyText } from "@/lib/wiki-render";

export const metadata: Metadata = {
  title: "Guilds",
  description: `${site.brand} guilds / circles module`,
};

export default function GuildsPage() {
  requireFeature("guilds");
  const page = wikiPageBySlug("guilds");
  const sections = page?.sections || [];

  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow={site.year || site.brand}
        title={page?.title || "Guilds"}
        description={page?.lead}
        actions={
          <Link href="/wiki#/guilds/" className="btn btn-primary !py-2 text-sm">
            Full wiki →
          </Link>
        }
      />
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {sections.map((section) => {
          const body = sectionBodyText(section);
          return (
            <section
              key={section.id || section.title}
              data-reveal
              className="border-b border-[var(--atr-border)] pb-8"
            >
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <div className="prose-aom mt-3 space-y-2 text-sm leading-relaxed text-[var(--atr-sub)]">
                {body.slice(0, 3).map((line, idx) => (
                  <p
                    key={idx}
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PageReveal>
  );
}
