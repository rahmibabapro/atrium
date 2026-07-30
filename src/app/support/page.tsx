import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Support",
  description: "Support tickets, blacklist, and reports.",
};

const links = [
  ["/forums/support-tickets", "Ticket system", "Open a support request"],
  ["/forums/blacklist", "Blacklist", "Appeals and notices"],
  ["/categories/reports", "Reports", "Report categories"],
  ["/wiki#/support-procedures/", "Support procedures", "Wiki playbook"],
  ["/misc/contact", "Contact", "Direct message form"],
  ["/pulse", "Pulse", "Realtime messaging"],
];

export default function SupportPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Helpdesk"
        title="Support"
        description="Ticket tree, blacklist, and report surfaces kept from the original community IA — with a clearer hub."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {links.map(([href, title, desc]) => (
          <Link
            key={href}
            data-reveal
            href={href}
            className="group border-b border-[var(--atr-border)] pb-5 transition"
          >
            <h2 className="font-semibold tracking-tight transition group-hover:text-[var(--atr-brand)]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[var(--atr-sub)]">{desc}</p>
          </Link>
        ))}
      </div>
    </PageReveal>
  );
}
