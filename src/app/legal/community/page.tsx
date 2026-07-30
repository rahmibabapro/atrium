import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Community rules" };

const links = [
  ["/wiki#/all-rules/", "All rules"],
  ["/wiki#/rule-1-respect/", "Rule 1 — Respect"],
  ["/wiki#/ic-ooc/", "IC / OOC"],
  ["/wiki#/warnings-and-penalties/", "Warnings & penalties"],
];

export default function CommunityRulesPage() {
  return (
    <PageReveal className="container section-pad">
      <div className="mx-auto max-w-3xl">
        <PageHero
          eyebrow="Legal"
          title="Community rules"
          description="Full article text lives in the Wiki Rules section. This page is the legal entry point."
        />
        <div className="mt-8 space-y-3">
          {links.map(([href, title]) => (
            <Link
              key={href}
              data-reveal
              href={href}
              className="block border-b border-[var(--atr-border)] py-3 font-medium transition hover:text-[var(--atr-brand)]"
            >
              {title}
            </Link>
          ))}
        </div>
      </div>
    </PageReveal>
  );
}
