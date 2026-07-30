import type { MetadataRoute } from "next";
import { config, site } from "@/lib/content";
import { absoluteUrl } from "@/lib/site-url";
import forumThreads from "../../content/forum-threads.json";

const STATIC = [
  "/",
  "/forums",
  "/wiki",
  "/map",
  "/guilds",
  "/store",
  "/support",
  "/help",
  "/members",
  "/pulse",
  "/search",
  "/pages/events",
  "/pages/hot-topics",
  "/categories/reports",
  "/whats-new/posts",
  "/misc/contact",
  "/misc/language",
  "/legal/community",
  "/legal/privacy",
  "/register",
  "/radio",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = new Set<string>(STATIC);

  for (const item of config.nav) urls.add(item.href);
  for (const item of config.footer) urls.add(item.href);
  for (const page of site.pages) {
    if (page.status !== "offline") urls.add(page.href);
  }
  for (const slug of Object.keys(forumThreads as Record<string, unknown>)) {
    urls.add(`/threads/${slug}`);
  }

  // Drop auth/admin surfaces from the public sitemap.
  const blocked = ["/admin", "/account", "/login", "/api", "/device"];
  const filtered = [...urls].filter(
    (u) => !blocked.some((b) => u === b || u.startsWith(`${b}/`)),
  );

  const builtAt = new Date("2026-07-30T00:00:00.000Z");

  return filtered.map((path) => ({
    url: absoluteUrl(path.includes("#") ? path.split("#")[0]! : path),
    lastModified: builtAt,
  }));
}
