import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Reports" };

const links = [
  ["/forums/blacklist", "Blacklist"],
  ["/forums/resolved-reports", "Resolved reports"],
  ["/forums/server-reports", "Server reports"],
  ["/forums/trade-disputes", "Trade disputes"],
];

export default function ReportsCategoryPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Moderation"
        title="Reports"
        description="Report category hub preserved from the original forum tree."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {links.map(([href, title]) => (
          <Link
            key={href}
            data-reveal
            href={href}
            className="border-b border-[var(--atr-border)] pb-4 font-medium transition hover:text-[var(--atr-brand)]"
          >
            {title}
          </Link>
        ))}
      </div>
    </PageReveal>
  );
}
