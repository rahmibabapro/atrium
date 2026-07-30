import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow="Calendar"
        title="Events"
        description="Festag weeks, confederacy beats, and roleplay happenings — linked to wiki calendar and the events forum."
        actions={
          <>
            <Link href="/wiki#/calendar-and-concepts/" className="btn btn-primary">
              Calendar concepts
            </Link>
            <Link
              href="/forums/roleplay-events"
              className="btn border border-[var(--atr-border)] bg-white"
            >
              Events forum
            </Link>
          </>
        }
      />
    </PageReveal>
  );
}
