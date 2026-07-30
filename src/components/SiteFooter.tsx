import Link from "next/link";
import { site } from "@/lib/content";
import { pickLocalized, type Lang } from "@/lib/i18n";

export function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-auto border-t border-[var(--atr-border)] bg-[var(--atr-surface)]">
      <div className="container flex flex-col gap-6 py-10">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--atr-sub)]">
          {site.footer.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--atr-brand)]">
              {pickLocalized(item.label, lang)}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm text-[var(--atr-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.brand}.{" "}
            {lang === "en" ? "All rights reserved." : "Tüm hakları saklıdır."}
          </p>
          {site.ip ? (
            <p className="font-medium text-[var(--atr-text)]">
              IP <span className="text-[var(--atr-brand)]">{site.ip}</span>
            </p>
          ) : (
            <p className="font-medium text-[var(--atr-text)]">{site.brand}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
