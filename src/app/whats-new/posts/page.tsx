import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "What's new" };

export default function WhatsNewPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Feed"
        title="What's new"
        description="Latest known posts for sitemap parity — live feeds land with the forum backend."
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
