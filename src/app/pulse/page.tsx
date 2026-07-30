import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Pulse" };

export default function PulsePage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        tone="dark"
        eyebrow="Realtime"
        title="Pulse"
        description="Instant messaging, presence, and alerts — Atrium ID session + Redis pub/sub + WebSocket. Separate from forum threads; same account."
        actions={
          <Link href="/login" className="btn btn-cta">
            Sign in to preview
          </Link>
        }
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          ["DM", "Target latency under 100ms regionally"],
          ["Presence", "Online / AFK / in-character states"],
          ["Alerts", "Mentions, tickets, event pings"],
        ].map(([title, desc]) => (
          <div key={title} data-reveal className="border-b border-[var(--atr-border)] pb-6">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-[var(--atr-sub)]">{desc}</p>
          </div>
        ))}
      </div>
    </PageReveal>
  );
}
