import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Help",
  description: "Help center linked to the official wiki.",
};

const links = [
  { href: "/wiki#/joining-the-server/", title: "Join the server", desc: "Register, connect, first steps" },
  { href: "/wiki#/faq/", title: "FAQ", desc: "Common questions" },
  { href: "/wiki#/support-procedures/", title: "Support procedures", desc: "Reports, bugs, appeals" },
  { href: "/wiki#/glossary/", title: "Glossary", desc: "IC, OOC, MG, PG…" },
  { href: "/wiki#/all-rules/", title: "All rules", desc: "Full rule index" },
  { href: "/support", title: "Open a ticket", desc: "Support request system" },
];

export default function HelpPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Guide"
        title="Help"
        description="Official help surface — every topic deep-links into the wiki."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {links.map((item) => (
          <Link
            key={item.href}
            data-reveal
            href={item.href}
            className="group border-b border-[var(--atr-border)] pb-6"
          >
            <h2 className="font-semibold tracking-tight transition group-hover:text-[var(--atr-brand)]">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--atr-sub)]">{item.desc}</p>
          </Link>
        ))}
      </div>
    </PageReveal>
  );
}
