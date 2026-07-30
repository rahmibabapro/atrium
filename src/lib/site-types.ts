import type { Lang } from "./i18n";

export type Localized = Record<Lang, string> | { tr: string; en: string; es?: string };

export type SiteFeatures = {
  home?: boolean;
  forums?: boolean;
  wiki?: boolean;
  map?: boolean;
  guilds?: boolean;
  store?: boolean;
  help?: boolean;
  support?: boolean;
  members?: boolean;
  pulse?: boolean;
  events?: boolean;
  search?: boolean;
  /** Optional community web radio (pack + Site foundation toggleable). */
  radio?: boolean;
};

export type SiteConfig = {
  id: string;
  brand: string;
  tagline?: Localized;
  domain?: string;
  primaryCta?: Localized;
  languages: string[];
  defaultLanguage: Lang | string;
  theme: {
    brand: string;
    brandHover: string;
    gold?: string;
    cta: string;
    ctaText: string;
    night: string;
    fontBody?: string;
    fontDisplay?: string;
  };
  features: SiteFeatures;
  nav: Array<{
    href: string;
    label: Localized;
    feature?: keyof SiteFeatures;
  }>;
  footer: Array<{ href: string; label: Localized }>;
  meta: {
    ip?: string;
    versionLabel?: string;
    yearLabel?: string;
    discord?: string;
    storeCurrencyLabel?: string;
  };
  modules?: Record<string, Localized | undefined>;
  home: {
    heroImage: string;
    heroSub: Localized;
    stepsTag: Localized;
    stepsTitle: Localized;
    stepsDesc: Localized;
    steps: Array<{
      href: string;
      image: string;
      title: Localized;
      text: Localized;
    }>;
    stepsCta: Localized;
    newsTag: Localized;
    newsTitle: Localized;
    newsDesc: Localized;
    news: Array<{
      href: string;
      title: Localized;
      blurb: Localized;
      image: string;
    }>;
    pathsTitle: Localized;
    paths: Array<{
      title: Localized;
      blurb: Localized;
      image: string;
    }>;
    discordTitle: Localized;
    discordDesc: Localized;
    discordCta: Localized;
  };
};
