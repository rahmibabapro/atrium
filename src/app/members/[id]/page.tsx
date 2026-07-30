import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return site.membersSample.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: id.split(".")[0] };
}

export default async function MemberPage({ params }: Props) {
  const { id } = await params;
  if (!site.membersSample.includes(id)) notFound();
  const name = id.split(".")[0];
  return (
    <PageReveal className="container section-pad">
      <Link data-reveal href="/members" className="text-sm text-[var(--atr-brand)]">
        ← Members
      </Link>
      <div className="mt-4">
        <PageHero
          title={name}
          description={`Profile id: ${id}. Character, guild, and reputation fields bind to AgeCharacter later.`}
        />
      </div>
      <div
        data-reveal
        className="mt-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--atr-brand)] text-3xl font-bold text-white shadow-[0_12px_30px_rgba(24,181,116,0.25)]"
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    </PageReveal>
  );
}
