import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizePathname,
  resolvePageAccess,
  resolvePages,
  type ResolvedPage,
} from "../page-registry";
import {
  effectivePageStatus,
  fromDatetimeLocalValue,
  mergeHomeWidgets,
  pageHrefSchema,
  toDatetimeLocalValue,
} from "../site-overrides-types";
import type { SiteConfig } from "../../site-types";

const pack = {
  nav: [
    { href: "/", label: { tr: "Ev", en: "Home" }, feature: "home" },
    { href: "/wiki", label: { tr: "Wiki", en: "Wiki" }, feature: "wiki" },
    { href: "/store", label: { tr: "Store", en: "Store" }, feature: "store" },
  ],
  footer: [
    { href: "/", label: { tr: "Ev", en: "Home" } },
    { href: "/help", label: { tr: "Yardım", en: "Help" } },
  ],
  features: { home: true, wiki: true, store: true, help: true },
} as unknown as SiteConfig;

describe("pageHrefSchema", () => {
  it("accepts absolute site paths", () => {
    assert.equal(pageHrefSchema.parse("/"), "/");
    assert.equal(pageHrefSchema.parse("/wiki"), "/wiki");
  });

  it("rejects open redirects and traversal", () => {
    assert.throws(() => pageHrefSchema.parse("//evil.com"));
    assert.throws(() => pageHrefSchema.parse("https://evil.com"));
    assert.throws(() => pageHrefSchema.parse("/../etc"));
    assert.throws(() => pageHrefSchema.parse("wiki"));
  });
});

describe("effectivePageStatus", () => {
  it("opens countdown after deadline", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    assert.equal(
      effectivePageStatus({ status: "countdown", countdownAt: past }),
      "live",
    );
  });

  it("keeps countdown before deadline", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    assert.equal(
      effectivePageStatus({ status: "countdown", countdownAt: future }),
      "countdown",
    );
  });
});

describe("datetime local helpers", () => {
  it("round-trips through UTC ISO", () => {
    const local = "2026-12-01T15:30";
    const iso = fromDatetimeLocalValue(local);
    assert.ok(iso);
    assert.equal(toDatetimeLocalValue(iso), local);
  });
});

describe("mergeHomeWidgets", () => {
  it("preserves drag order", () => {
    const merged = mergeHomeWidgets([
      { id: "discord", visible: true },
      { id: "hero", visible: false },
    ]);
    assert.deepEqual(
      merged.map((w) => w.id),
      ["discord", "hero", "steps", "news", "paths"],
    );
    assert.equal(merged.find((w) => w.id === "hero")?.visible, false);
  });
});

describe("resolvePages + access", () => {
  it("hides offline pages from access", () => {
    const pages = resolvePages(pack, {
      pages: [
        {
          href: "/wiki",
          status: "offline",
          inHeader: false,
          inFooter: false,
          order: 1,
        },
      ],
    });
    const wiki = pages.find((p) => p.href === "/wiki")!;
    assert.equal(wiki.status, "offline");
    const access = resolvePageAccess("/wiki/foo", pages);
    assert.equal(access.mode, "offline");
  });

  it("does not let /store match /storefront", () => {
    const pages: ResolvedPage[] = [
      {
        href: "/store",
        label: { tr: "S", en: "S" },
        status: "offline",
        inHeader: false,
        inFooter: false,
        order: 0,
      },
    ];
    assert.equal(resolvePageAccess("/storefront", pages).mode, "live");
    assert.equal(resolvePageAccess("/store/item", pages).mode, "offline");
  });

  it("normalizes trailing slashes", () => {
    assert.equal(normalizePathname("/wiki/"), "/wiki");
  });

  it("ignores injected non-pack hrefs", () => {
    const pages = resolvePages(pack, {
      pages: [
        {
          href: "/evil",
          status: "live",
          inHeader: true,
          inFooter: true,
          order: 0,
        },
      ],
    });
    assert.equal(
      pages.some((p) => p.href === "/evil"),
      false,
    );
  });
});
