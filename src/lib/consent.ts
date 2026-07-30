export type ConsentLevel = "unknown" | "necessary" | "analytics" | "all";

export const CONSENT_COOKIE = "aom_consent";
export const CONSENT_STORAGE = "aom_consent_v1";

export function parseConsent(raw: string | null | undefined): ConsentLevel {
  if (raw === "necessary" || raw === "analytics" || raw === "all") return raw;
  return "unknown";
}

export function allowsFirstPartyAnalytics(level: ConsentLevel) {
  return level === "analytics" || level === "all";
}

export function allowsGoogleAnalytics(level: ConsentLevel) {
  return level === "analytics" || level === "all";
}

export function allowsAds(level: ConsentLevel) {
  return level === "all";
}
