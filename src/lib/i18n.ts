export type Lang = "tr" | "en" | "es";

export function resolveLang(value?: string | null, fallback: Lang = "tr"): Lang {
  if (value === "en" || value === "es" || value === "tr") return value;
  return fallback;
}

export function pickLocalized(
  map: Partial<Record<Lang, string>> | undefined,
  lang: Lang,
  fallback = "",
): string {
  if (!map) return fallback;
  return map[lang] || map.en || map.tr || map.es || fallback;
}
