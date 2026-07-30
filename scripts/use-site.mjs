#!/usr/bin/env node
/**
 * Activate a site pack into the runtime content/ + site.config.json
 * Usage: node scripts/use-site.mjs shoe-atelier
 *        node scripts/use-site.mjs shoe-atelier
 *        pnpm site:use -- atrium
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2).filter((a) => a && a !== "--");
const siteId = args[0] || process.env.SITE_ID || "shoe-atelier";
const packDir = path.join(root, "sites", siteId);

if (!fs.existsSync(packDir)) {
  console.error(`Unknown site pack: ${siteId}`);
  console.error("Available:", fs.readdirSync(path.join(root, "sites")).join(", "));
  process.exit(1);
}

const configSrc = path.join(packDir, "site.config.json");
const contentSrc = path.join(packDir, "content");
const configDst = path.join(root, "site.config.json");
const contentDst = path.join(root, "content");
const activeDst = path.join(root, ".active-site");

fs.mkdirSync(contentDst, { recursive: true });
fs.copyFileSync(configSrc, configDst);

for (const file of fs.readdirSync(contentSrc)) {
  fs.copyFileSync(path.join(contentSrc, file), path.join(contentDst, file));
}

fs.writeFileSync(activeDst, `${siteId}\n`);
const cfg = JSON.parse(fs.readFileSync(configDst, "utf8"));
console.log(
  JSON.stringify(
    {
      activated: siteId,
      brand: cfg.brand,
      features: cfg.features,
      contentFiles: fs.readdirSync(contentDst),
    },
    null,
    2,
  ),
);
