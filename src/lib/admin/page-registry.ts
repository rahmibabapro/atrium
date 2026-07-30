import type { Localized, SiteConfig } from "@/lib/site-types";
import {
  effectivePageStatus,
  type PageOverride,
  type PageStatus,
  type SiteOverrides,
} from "./site-overrides-types";

export type ResolvedPage = {
  href: string;
  label: Localized;
  feature?: keyof SiteConfig["features"];
  status: PageStatus;
  inHeader: boolean;
  inFooter: boolean;
  order: number;
  countdownAt?: string;
  countdownTitle?: string;
  countdownMessage?: string;
};

type PackLink = {
  href: string;
  label: Localized;
  feature?: keyof SiteConfig["features"];
  fromNav?: boolean;
  fromFooter?: boolean;
};

/** Paths that must stay reachable (auth / control plane / game bridge). */
const ALWAYS_LIVE = new Set([
  "/admin",
  "/login",
  "/register",
  "/account",
  "/api",
  "/device",
]);

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const noQuery = pathname.split("?")[0] || "/";
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery;
}

function isAlwaysLive(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (path === "/") return false;
  for (const root of ALWAYS_LIVE) {
    if (path === root || path.startsWith(`${root}/`)) return true;
  }
  return false;
}

export function packHrefSet(config: SiteConfig): Set<string> {
  const set = new Set<string>();
  for (const item of config.nav) set.add(item.href);
  for (const item of config.footer) set.add(item.href);
  return set;
}

function collectPackLinks(config: SiteConfig): PackLink[] {
  const map = new Map<string, PackLink>();
  for (const item of config.nav) {
    map.set(item.href, {
      href: item.href,
      label: item.label,
      feature: item.feature,
      fromNav: true,
      fromFooter: false,
    });
  }
  for (const item of config.footer) {
    const prev = map.get(item.href);
    if (prev) {
      prev.fromFooter = true;
      continue;
    }
    map.set(item.href, {
      href: item.href,
      label: item.label,
      fromNav: false,
      fromFooter: true,
    });
  }
  return [...map.values()];
}

/**
 * Merge pack nav/footer with overrides into one simple page registry.
 * Migrates legacy navOrder / navHidden when `pages` is absent.
 */
export function resolvePages(
  config: SiteConfig,
  overrides: SiteOverrides,
): ResolvedPage[] {
  const pack = collectPackLinks(config);
  const overrideMap = new Map(
    (overrides.pages || []).map((p) => [p.href, p] as const),
  );

  const legacyHidden = new Set(overrides.navHidden || []);
  const legacyOrder = overrides.navOrder || [];

  const pages: ResolvedPage[] = pack.map((base, index) => {
    const o = overrideMap.get(base.href);
    const featureOff =
      base.feature && config.features?.[base.feature] === false;

    const status: PageStatus = o?.status || (featureOff ? "offline" : "live");
    let inHeader =
      o?.inHeader ??
      (Boolean(base.fromNav) && !legacyHidden.has(base.href) && !featureOff);
    const inFooter = o?.inFooter ?? Boolean(base.fromFooter);

    if (!o && legacyHidden.has(base.href)) {
      inHeader = false;
    }

    let order = o?.order;
    if (order === undefined) {
      const legacyIdx = legacyOrder.indexOf(base.href);
      order = legacyIdx >= 0 ? legacyIdx : 100 + index;
    }

    return {
      href: base.href,
      label: base.label,
      feature: base.feature,
      status,
      inHeader,
      inFooter,
      order,
      countdownAt: o?.countdownAt,
      countdownTitle: o?.countdownTitle,
      countdownMessage: o?.countdownMessage,
    };
  });

  // Override-only hrefs outside the pack are ignored (injection / stale paths).
  return pages.sort((a, b) => a.order - b.order || a.href.localeCompare(b.href));
}

export function pagesToOverrides(pages: ResolvedPage[]): PageOverride[] {
  return pages.map((p, index) => ({
    href: p.href,
    status: p.status,
    inHeader: p.inHeader,
    inFooter: p.inFooter,
    order: index,
    countdownAt: p.countdownAt,
    countdownTitle: p.countdownTitle,
    countdownMessage: p.countdownMessage,
  }));
}

export function navFromPages(pages: ResolvedPage[]) {
  return pages
    .filter((p) => {
      const status = effectivePageStatus(p);
      return p.inHeader && status !== "offline";
    })
    .map((p) => ({
      href: p.href,
      label: p.label,
      feature: p.feature,
    }));
}

export function footerFromPages(
  pages: ResolvedPage[],
  packFooter: SiteConfig["footer"],
) {
  const byHref = new Map(pages.map((p) => [p.href, p]));
  // Preserve pack footer order; only filter visibility.
  return packFooter.filter((item) => {
    const page = byHref.get(item.href);
    if (!page) return true;
    const status = effectivePageStatus(page);
    return page.inFooter && status !== "offline";
  });
}

export type PageAccess =
  | { mode: "live" }
  | {
      mode: "offline" | "countdown";
      page: ResolvedPage;
    };

/** Match longest registered href; home `/` is exact-only. */
export function resolvePageAccess(
  pathname: string,
  pages: ResolvedPage[],
): PageAccess {
  const path = normalizePathname(pathname);
  if (isAlwaysLive(path)) return { mode: "live" };

  let match: ResolvedPage | undefined;
  for (const page of pages) {
    const href = normalizePathname(page.href);
    if (href === "/") {
      if (path === "/") match = page;
      continue;
    }
    if (path === href || path.startsWith(`${href}/`)) {
      if (!match || href.length > normalizePathname(match.href).length) {
        match = page;
      }
    }
  }
  if (!match) return { mode: "live" };

  const status = effectivePageStatus(match);
  if (status === "offline") return { mode: "offline", page: match };
  if (status === "countdown") return { mode: "countdown", page: match };
  return { mode: "live" };
}
