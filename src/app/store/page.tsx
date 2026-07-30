import type { Metadata } from "next";
import { cookies } from "next/headers";
import { StoreExperience } from "@/components/store/StoreExperience";
import { defaultLang, site } from "@/lib/content";
import { storeCatalog } from "@/lib/store-catalog";
import { resolveLang } from "@/lib/i18n";
import { requireFeature } from "@/lib/features";

export const metadata: Metadata = {
  title: "Store",
  description: `${site.brand} store — ${site.storeCurrencyLabel} packs`,
};

export default async function StorePage() {
  requireFeature("store");
  const lang = resolveLang(
    (await cookies()).get("aom_lang")?.value,
    defaultLang(),
  );

  return (
    <StoreExperience
      lang={lang}
      catalog={storeCatalog}
      brand={site.brand}
    />
  );
}
