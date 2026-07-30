import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Members",
  description: `${site.brand} member directory`,
};

export default function MembersPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Directory"
        title="Members"
        description="Known member profiles from the public sitemap (parity sample). Full Atrium ID directory later."
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {site.membersSample.map((id) => (
          <Link
            key={id}
            data-reveal
            href={`/members/${id}`}
            className="rounded-xl border border-[var(--atr-border)] bg-white px-4 py-3 text-sm font-medium transition hover:border-[var(--atr-brand)] hover:text-[var(--atr-brand)]"
          >
            {id}
          </Link>
        ))}
      </div>
    </PageReveal>
  );
}
