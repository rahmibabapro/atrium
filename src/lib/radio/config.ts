import radioData from "../../../content/radio.json";
import { effectivePageStatus } from "@/lib/admin/site-overrides-types";
import { featureEnabled, site } from "@/lib/content";
import type { RadioConfig, RadioStation } from "./types";

export const radioConfig = radioData as RadioConfig;

export function radioStations(): RadioStation[] {
  return radioConfig.stations || [];
}

export function radioStationById(id: string): RadioStation | undefined {
  return radioStations().find((s) => s.id === id);
}

/**
 * Pack feature + site foundation gate.
 * Admins can remove radio by setting /radio Offline; packs can omit the feature.
 */
export function radioModuleEnabled(): boolean {
  const page = site.pages.find((p) => p.href === "/radio");
  if (page && effectivePageStatus(page) === "offline") return false;
  if (featureEnabled("radio")) return true;
  return Boolean(page && effectivePageStatus(page) !== "offline");
}

export function radioDockEnabled(): boolean {
  return radioModuleEnabled() && Boolean(radioConfig.dock) && radioStations().length > 0;
}
