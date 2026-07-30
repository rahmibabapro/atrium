import { cookies } from "next/headers";
import { HomeExperience } from "@/components/home/HomeExperience";
import { defaultLang, site } from "@/lib/content";
import { resolveLang } from "@/lib/i18n";

export default async function HomePage() {
  const lang = resolveLang(
    (await cookies()).get("aom_lang")?.value,
    defaultLang(),
  );

  return (
    <HomeExperience
      lang={lang}
      home={site.home}
      widgets={site.homeWidgets}
      meta={{
        brand: site.brand,
        year: site.year,
        versionLabel: site.versionLabel,
        ip: site.ip,
        discord: site.discord,
        primaryCta: site.primaryCta,
      }}
    />
  );
}
