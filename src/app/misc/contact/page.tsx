import type { Metadata } from "next";
import Link from "next/link";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageReveal className="container section-pad">
      <div className="mx-auto max-w-2xl">
        <PageHero
          eyebrow="Reach us"
          title="Contact"
          description="Prefer tickets for support. Community chat lives on Discord."
          actions={
            <>
              <Link href="/support" className="btn btn-primary !py-2 text-sm">
                Support hub
              </Link>
              {site.discord && site.discord !== "#" ? (
                <Link href={site.discord} className="btn border border-[var(--atr-border)] bg-white !py-2 text-sm">
                  Discord
                </Link>
              ) : null}
            </>
          }
        />
        <form
          data-reveal
          className="mt-8 space-y-4 rounded-3xl border border-[var(--atr-border)] bg-white p-6 sm:p-8"
        >
          <label className="block text-sm font-medium">
            Subject
            <input className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 outline-none focus:border-[var(--atr-brand)]" />
          </label>
          <label className="block text-sm font-medium">
            Message
            <textarea className="mt-1 min-h-32 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 outline-none focus:border-[var(--atr-brand)]" />
          </label>
          <button type="button" className="btn btn-primary">
            Send (Atrium ID ticket bridge soon)
          </button>
        </form>
      </div>
    </PageReveal>
  );
}
