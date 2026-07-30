import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
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

function overridesPath() {
  return path.join(process.cwd(), "data", "site-overrides.json");
}

function readSiteOverridesUncached(): SiteOverrides {
  const file = overridesPath();
  if (!fs.existsSync(file)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return siteOverridesSchema.parse(raw);
  } catch {
    return {};
  }
}

/** Per-request memo — content.ts may call this several times in one render. */
export const readSiteOverrides = cache(readSiteOverridesUncached);

export function writeSiteOverrides(next: SiteOverrides): SiteOverrides {
  const parsed = siteOverridesSchema.parse(next);
  const file = overridesPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, file);
  return parsed;
}
