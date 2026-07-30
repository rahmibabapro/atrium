import type { Metadata } from "next";
import { cookies } from "next/headers";
import { RadioExperience } from "@/components/radio/RadioExperience";
import { PageReveal } from "@/components/motion/PageReveal";
import { requireFeature } from "@/lib/features";
import { defaultLang } from "@/lib/content";
import { resolveLang } from "@/lib/i18n";
import { radioConfig, radioStations } from "@/lib/radio/config";

export const metadata: Metadata = {
  title: "Radio",
  description: "Community live radio — ambient and folk channels for roleplay.",
};

export default async function RadioPage() {
  requireFeature("radio");
  const jar = await cookies();
  const lang = resolveLang(jar.get("aom_lang")?.value, defaultLang());
  const stations = radioStations();

  if (!stations.length) {
    return (
      <PageReveal className="container section-pad">
        <h1 className="text-2xl font-bold">Radio</h1>
        <p className="mt-2 text-sm text-[var(--atr-sub)]">
          No stations configured in this site pack.
        </p>
      </PageReveal>
    );
  }

  return (
    <PageReveal className="container section-pad pb-28">
      <RadioExperience
        lang={lang}
        title={radioConfig.title}
        lead={radioConfig.lead}
      />
    </PageReveal>
  );
}
