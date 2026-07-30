import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Hot Topics" };

export default function HotTopicsPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Trending"
        title="Hot Topics"
        description="Pinned and high-signal threads from the community feed."
      />
      <ul className="mt-10 space-y-3">
        {site.pinnedThreads.map((t) => (
          <li key={t.slug} data-reveal>
            <Link
              href={`/threads/${t.slug}`}
              className="block border-b border-[var(--atr-border)] pb-3 font-medium transition hover:text-[var(--atr-brand)]"
            >
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </PageReveal>
  );
}
