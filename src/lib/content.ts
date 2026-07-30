import type { CSSProperties } from "react";
import siteConfig from "../../site.config.json";
import wikiData from "../../content/wiki-data.json";
import mapData from "../../content/map-data.json";
import siteManifest from "../../content/site-manifest.json";
import forumThreads from "../../content/forum-threads.json";
import {
  footerFromPages,
  navFromPages,
  resolvePageAccess,
  resolvePages,
} from "@/lib/admin/page-registry";
import {
  mergeHomeWidgets,
  readSiteOverrides,
} from "@/lib/admin/site-overrides";
import type { Lang } from "./i18n";
import type { Localized, SiteConfig } from "./site-types";

type ForumCategory = {
  id: string;
  title: Localized;
  forums: Array<{ slug: string; title: Localized }>;
};

export type WikiSection = {
  id?: string;
  title?: string;
  body?: string[] | string;
  list?: string[];
  table?: string[][];
  callout?: { type?: string; label?: string; text?: string };
  replacements?: Array<{ from: string; to: string; examples?: string[] }>;
  godCards?: Array<Record<string, unknown>>;
  figure?: { src?: string; alt?: string };
  [key: string]: unknown;
};

export type WikiPage = {
  slug?: string;
  title?: string;
  lead?: string;
  tags?: string[];
  summary?: string[] | string;
  heroImage?: string;
  heroAlt?: string;
  sections?: WikiSection[];
  navDivider?: boolean;
  mustRead?: boolean;
  madde?: string | number;
  readMinutes?: number;
};

export type WikiGroup = {
  id: string;
  title?: string;
  name?: string;
  pages: WikiPage[];
};

export const config = siteConfig as SiteConfig;

function overrides() {
  return readSiteOverrides();
}

function pages() {
  return resolvePages(config, overrides());
}

export const site = {
  brand: config.brand,
  ip: config.meta.ip || "",
  versionLabel: config.meta.versionLabel || "",
  year: config.meta.yearLabel || "",
  discord: config.meta.discord || "#",
  languages: config.languages,
  get pages() {
    return pages();
  },
  get nav() {
    return navFromPages(pages());
  },
  get footer() {
    return footerFromPages(pages(), config.footer);
  },
  forumCategories:
    ((siteManifest as { forumCategories?: ForumCategory[] }).forumCategories ||
      []) as ForumCategory[],
  pinnedThreads:
    (siteManifest as { pinnedThreads?: Array<{ slug: string; title: string }> })
      .pinnedThreads || [],
  membersSample: (siteManifest as { membersSample?: string[] }).membersSample || [],
  home: config.home,
  features: config.features,
  theme: config.theme,
  modules: config.modules || {},
  primaryCta: config.primaryCta,
  storeCurrencyLabel: config.meta.storeCurrencyLabel || "Credit",
  get homeWidgets() {
    return mergeHomeWidgets(overrides().homeWidgets);
  },
};

export const wiki = wikiData as {
  meta: Record<string, unknown>;
  glossary: Record<string, string>;
  groups: WikiGroup[];
};

export const atlas = mapData as {
  meta: {
    title: string;
    year: string;
    region: string;
    mapWidth: number;
    mapHeight: number;
    imageUrl: string;
  };
  layerLabels: Record<string, string>;
  regions: Array<{
    id: string;
    name: string;
    tagline: string;
    loreSlug: string;
    type: string;
  }>;
};

export const threads = forumThreads as Record<
  string,
  { title: string; forum: string; body: string }
>;

export function featureEnabled(name: keyof SiteConfig["features"]): boolean {
  return Boolean(config.features?.[name]);
}

export function pageAccessFor(pathname: string) {
  return resolvePageAccess(pathname, pages());
}

export function allWikiPages(): WikiPage[] {
  return wiki.groups.flatMap((g) =>
    (g.pages || []).filter((p) => p.slug && !p.navDivider),
  );
}

export function wikiPageBySlug(slug: string): WikiPage | undefined {
  return allWikiPages().find((p) => p.slug === slug);
}

export function homeCopy(lang: Lang) {
  return config.home;
}

export function defaultLang(): Lang {
  const d = config.defaultLanguage;
  return d === "en" || d === "es" || d === "tr" ? d : "tr";
}

export function themeStyle(): CSSProperties {
  const o = overrides().theme || {};
  const brand = o.brand || config.theme.brand;
  const brandHover = o.brandHover || config.theme.brandHover;
  return {
    ["--atr-brand" as string]: brand,
    ["--atr-brand-hover" as string]: brandHover,
    ["--atr-p-green-500" as string]: brand,
    ["--atr-p-green-600" as string]: brandHover,
    ["--atr-p-green-700" as string]: brandHover,
    ["--atr-p-gold-500" as string]: o.gold || config.theme.gold || "#f59e0b",
    ["--hp-sc-cta-bg" as string]: o.cta || config.theme.cta,
    ["--hp-sc-cta-text" as string]: o.ctaText || config.theme.ctaText,
    ["--hp-bg" as string]: o.night || config.theme.night,
    ["--atr-header-bg" as string]: o.headerBg || "rgba(255,255,255,0.55)",
    ["--atr-header-text" as string]: o.headerText || config.theme.night,
  } as CSSProperties;
}
