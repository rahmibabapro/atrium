import { notFound } from "next/navigation";
import { effectivePageStatus } from "@/lib/admin/site-overrides-types";
import { featureEnabled, site } from "./content";
import type { SiteConfig } from "./site-types";

const FEATURE_ROUTES: Partial<Record<keyof SiteConfig["features"], string>> = {
  home: "/",
  forums: "/forums",
  wiki: "/wiki",
  map: "/map",
  guilds: "/guilds",
  store: "/store",
  help: "/help",
  support: "/support",
  members: "/members",
  pulse: "/pulse",
  events: "/events",
  search: "/search",
  radio: "/radio",
};

/**
 * Pack feature flags are the developer kill-switch.
 * Site foundation can re-open a page (live/countdown) without editing pack JSON.
 */
export function requireFeature(name: keyof SiteConfig["features"]) {
  if (featureEnabled(name)) return;

  const href = FEATURE_ROUTES[name];
  if (href) {
    const page = site.pages.find((p) => p.href === href);
    if (page && effectivePageStatus(page) !== "offline") return;
  }

  notFound();
}
