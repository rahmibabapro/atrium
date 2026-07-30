#!/usr/bin/env node
/**
 * Scaffold a new forkable site pack from the kit template.
 * Usage: node scripts/new-site.mjs my-brand
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2).filter((a) => a && a !== "--");
const siteId = (args[0] || "").trim();
if (!/^[a-z0-9-]+$/.test(siteId)) {
  console.error("Usage: node scripts/new-site.mjs <site-id>  (lowercase kebab-case)");
  process.exit(1);
}

const dest = path.join(root, "sites", siteId);
if (fs.existsSync(dest)) {
  console.error("Site pack already exists:", siteId);
  process.exit(1);
}

const template = path.join(root, "sites", "shoe-atelier");
fs.cpSync(template, dest, { recursive: true });

const cfgPath = path.join(dest, "site.config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
cfg.id = siteId;
cfg.brand = siteId
  .split("-")
  .map((p) => p[0].toUpperCase() + p.slice(1))
  .join(" ");
cfg.domain = `${siteId}.example`;
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      created: siteId,
      path: `sites/${siteId}`,
      next: [`pnpm site:use -- ${siteId}`, "Edit sites/" + siteId + "/site.config.json", "Replace content + public assets"],
    },
    null,
    2,
  ),
);
