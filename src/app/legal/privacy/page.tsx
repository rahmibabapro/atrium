import type { Metadata } from "next";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PageReveal className="container section-pad">
      <div className="mx-auto max-w-3xl">
        <PageHero
          eyebrow="Legal"
          title="Privacy"
          description="How Atrium ID sessions, cookies, and account identity are handled."
        />
        <div data-reveal className="prose-aom mt-8 space-y-4 text-[var(--atr-sub)] leading-relaxed">
          <p>
            We use account security, session management, essential cookies, and optional
            experience cookies. Essential cookies are required for security and access.
            Optional cookies can be declined. Preference UI stays parity with the live
            cookie banner.
          </p>
          <p>
            Your website account uses Atrium ID. Personal data is not sold; it is used
            for service delivery, moderation, and legal obligations only.
          </p>
        </div>
      </div>
    </PageReveal>
  );
}
