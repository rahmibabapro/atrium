"use client";

import Link from "next/link";
import { useRef } from "react";
import { ensureGsap, gsap, useGSAP } from "@/components/motion/register";
import { pickLocalized, type Lang } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: Record<string, string>;
};

export function HeaderChrome({
  lang,
  brand,
  items,
  accountLabel,
}: {
  lang: Lang;
  brand: string;
  items: NavItem[];
  accountLabel: string | null;
}) {
  const headerRef = useRef<HTMLElement>(null);
  ensureGsap();

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const onScroll = () => {
          const solid = window.scrollY > 12;
          header.dataset.scrolled = solid ? "true" : "false";
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
      });

      return () => mm.revert();
    },
    { scope: headerRef },
  );

  const loginLabel =
    lang === "en" ? "Log in" : lang === "es" ? "Entrar" : "Giriş Yap";

  return (
    <header
      ref={headerRef}
      data-scrolled="false"
      className="site-header sticky top-0 z-40"
      style={{ color: "var(--atr-header-text)" }}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[var(--atr-brand)] text-sm text-white shadow-[0_8px_20px_rgba(20,32,28,0.18)]">
            {brand.slice(0, 1)}
          </span>
          <span className="tracking-[-0.02em]">{brand}</span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--atr-sub)] transition hover:bg-[var(--atr-p-slate-100)] hover:text-[var(--atr-text)]"
            >
              {pickLocalized(item.label as never, lang)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/misc/language"
            className="hidden text-xs font-medium tracking-wide text-[var(--atr-muted)] sm:block"
          >
            {lang.toUpperCase()}
          </Link>
          <Link href={accountLabel ? "/account" : "/login"} className="btn btn-primary !px-3 !py-2 text-sm">
            {accountLabel || loginLabel}
          </Link>
        </div>
      </div>
      <nav className="container flex gap-1.5 overflow-x-auto pb-2 md:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-[var(--atr-p-slate-100)] px-3 py-1.5 text-xs font-medium text-[var(--atr-sub)]"
          >
            {pickLocalized(item.label as never, lang)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
