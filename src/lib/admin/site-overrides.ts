import { getDb, nowIso } from "@/lib/db";
import {
  siteOverridesSchema,
  type SiteOverrides,
} from "./site-overrides-types";

export {
  DEFAULT_HOME_WIDGETS,
  mergeHomeWidgets,
  effectivePageStatus,
  formatZodError,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  siteOverridesSchema,
  pageOverrideSchema,
  pageStatusSchema,
  pageHrefSchema,
  type SiteOverrides,
  type PageOverride,
  type PageStatus,
  type HomeWidget,
  type HomeWidgetId,
  type GoogleIntegrations,
  googleIntegrationsSchema,
} from "./site-overrides-types";

/**
 * Site overrides live in the database (site_config row 1) but are read
 * synchronously all over the render tree, so this module keeps a warm
 * in-process cache:
 *  - warmSiteOverrides() loads it at boot (instrumentation) and on demand
 *  - writeSiteOverrides() updates DB + cache in the same call
 *  - a short TTL re-pull keeps multi-instance deployments converging
 */
const CACHE_TTL_MS = 5_000;

type CacheState = { value: SiteOverrides; at: number };

declare global {
  var __atriumOverridesCache: CacheState | undefined;
  var __atriumOverridesRefresh: Promise<void> | undefined;
}

async function loadFromDb(): Promise<SiteOverrides> {
  const db = await getDb();
  const row = await db
    .selectFrom("site_config")
    .select("overrides")
    .where("id", "=", 1)
    .executeTakeFirst();
  if (!row) return {};
  try {
    return siteOverridesSchema.parse(JSON.parse(row.overrides));
  } catch {
    return {};
  }
}

export async function warmSiteOverrides(): Promise<SiteOverrides> {
  const cached = globalThis.__atriumOverridesCache;
  if (cached && Date.now() - cached.at <= CACHE_TTL_MS) return cached.value;
  const value = await loadFromDb();
  globalThis.__atriumOverridesCache = { value, at: Date.now() };
  return value;
}

function scheduleRefresh() {
  if (globalThis.__atriumOverridesRefresh) return;
  globalThis.__atriumOverridesRefresh = warmSiteOverrides()
    .catch(() => undefined)
    .then(() => {
      globalThis.__atriumOverridesRefresh = undefined;
    });
}

/**
 * Synchronous read used by content.ts and layouts. Returns the cached copy;
 * kicks a background refresh when stale. Empty until the first warm-up
 * completes (instrumentation warms it at boot).
 */
export function readSiteOverrides(): SiteOverrides {
  const cached = globalThis.__atriumOverridesCache;
  if (!cached || Date.now() - cached.at > CACHE_TTL_MS) {
    scheduleRefresh();
  }
  return cached?.value ?? {};
}

export async function writeSiteOverrides(
  next: SiteOverrides,
): Promise<SiteOverrides> {
  const parsed = siteOverridesSchema.parse(next);
  const db = await getDb();
  const serialized = JSON.stringify(parsed);
  await db
    .insertInto("site_config")
    .values({ id: 1, overrides: serialized, updated_at: nowIso() })
    .onConflict((oc) =>
      oc.column("id").doUpdateSet({ overrides: serialized, updated_at: nowIso() }),
    )
    .execute();
  globalThis.__atriumOverridesCache = { value: parsed, at: Date.now() };
  return parsed;
}
