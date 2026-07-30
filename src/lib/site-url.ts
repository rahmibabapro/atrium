import { config } from "@/lib/content";

/** Absolute public origin for sitemap, canonicals, ads.txt, OG. */
export function siteOrigin(): string {
  const env = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    try {
      return new URL(env).origin;
    } catch {
      /* fall through */
    }
  }
  const domain = config.domain?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (domain) return `https://${domain}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = siteOrigin();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
