import { SiteOrganizer } from "@/components/admin/SiteOrganizer";
import { resolvePages } from "@/lib/admin/page-registry";
import { requireStaff } from "@/lib/admin/guard";
import { readSiteOverrides } from "@/lib/admin/site-overrides";
import { config, site } from "@/lib/content";
import { pickLocalized } from "@/lib/i18n";

export default async function AdminSitePage() {
  await requireStaff({ adminOnly: true, redirectTo: "/admin/site" });
  const overrides = readSiteOverrides();
  const pages = resolvePages(config, overrides).map((p) => ({
    href: p.href,
    label: pickLocalized(p.label, "en") || p.href,
    status: p.status,
    inHeader: p.inHeader,
    inFooter: p.inFooter,
    countdownAt: p.countdownAt,
    countdownTitle: p.countdownTitle,
    countdownMessage: p.countdownMessage,
  }));

  const themeDefaults = {
    brand: config.theme.brand,
    brandHover: config.theme.brandHover,
    gold: config.theme.gold || "#f59e0b",
    cta: config.theme.cta,
    ctaText: config.theme.ctaText,
    night: config.theme.night,
    headerBg: "#ffffff",
    headerText: config.theme.night,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Site foundation</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--atr-sub)]">
          Simple control room for {site.brand}: pages (header/footer/live/offline/countdown),
          home layout, and look. Pack defaults stay in{" "}
          <code className="text-xs">sites/&lt;pack&gt;</code>; your publishes layer on top.
        </p>
      </div>
      <SiteOrganizer
        initialPages={pages}
        initialOverrides={overrides}
        themeDefaults={themeDefaults}
      />
    </div>
  );
}
