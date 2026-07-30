#!/usr/bin/env node
/**
 * Optional route coverage check for product forks that keep a sitemap URL list.
 * Public Atrium has no private sitemap book — exits 0 with a note.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sitemapPath = path.join(root, "docs/sitemap-urls.txt");

if (!fs.existsSync(sitemapPath)) {
  console.log(
    JSON.stringify(
      {
        skipped: true,
        reason:
          "No docs/sitemap-urls.txt in public Atrium. Product forks can add one for parity checks.",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const appDir = path.join(root, "src/app");
const sitemap = fs
  .readFileSync(sitemapPath, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((url) => new URL(url).pathname.replace(/\/$/, "") || "/");

function routeExists(pathname) {
  if (pathname === "/") return fs.existsSync(path.join(appDir, "page.tsx"));
  const parts = pathname.split("/").filter(Boolean);
  const candidates = [];
  const walk = (dirParts, idx) => {
    if (idx === parts.length) {
      candidates.push(path.join(appDir, ...dirParts, "page.tsx"));
      return;
    }
    const part = parts[idx];
    walk([...dirParts, part], idx + 1);
    if (!fs.existsSync(path.join(appDir, ...dirParts))) return;
    const entries = fs.readdirSync(path.join(appDir, ...dirParts), {
      withFileTypes: true,
    });
    for (const e of entries) {
      if (e.isDirectory() && e.name.startsWith("[") && e.name.endsWith("]")) {
        walk([...dirParts, e.name], idx + 1);
      }
    }
  };
  walk([], 0);
  return candidates.some((c) => fs.existsSync(c));
}

const missing = [];
const present = [];
for (const p of sitemap) {
  if (routeExists(p)) present.push(p);
  else missing.push(p);
}

const report = {
  total: sitemap.length,
  present: present.length,
  missing: missing.length,
  coverage: `${((present.length / sitemap.length) * 100).toFixed(1)}%`,
  missingPaths: missing,
};

fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(
  path.join(root, "docs/parity-result.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (missing.length) process.exitCode = 1;
