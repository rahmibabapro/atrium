import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/content";
import { pickLocalized, resolveLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Forums",
  description: "Community categories and announcements.",
};

export default async function ForumsPage() {
  const lang = resolveLang((await cookies()).get("aom_lang")?.value);
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow={lang === "en" ? "Community" : "Topluluk"}
        title={lang === "en" ? "Forums" : "Forumlar"}
        description={
          lang === "en"
            ? "Announcements, applications, and roleplay discussion. Read the Wiki first."
            : "Duyurular, başvuru ve roleplay sohbetleri. Wiki’den kuralları oku."
        }
        actions={
          <Link href="/wiki" className="btn btn-primary !py-2 text-sm">
            Wiki
          </Link>
        }
      />

      <div className="mt-10 space-y-10">
        {site.forumCategories.map((category) => (
          <section key={category.id} data-reveal>
            <h2 className="text-sm font-semibold tracking-[0.14em] text-[var(--atr-brand)] uppercase">
              {pickLocalized(category.title, lang)}
            </h2>
            <div className="mt-3 divide-y divide-[var(--atr-border)] border-y border-[var(--atr-border)]">
              {category.forums.map((forum) => (
                <Link
                  key={forum.slug}
                  href={`/forums/${forum.slug}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:text-[var(--atr-brand)]"
                >
                  <span className="font-medium">{pickLocalized(forum.title, lang)}</span>
                  <span className="text-sm text-[var(--atr-muted)]">→</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section data-reveal className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">
          {lang === "en" ? "Pinned threads" : "Sabit konular"}
        </h2>
        <ul className="mt-4 space-y-2">
          {site.pinnedThreads.map((thread) => (
            <li key={thread.slug}>
              <Link
                className="text-[var(--atr-brand)] hover:underline"
                href={`/threads/${thread.slug}`}
              >
                {thread.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageReveal>
  );
}
