"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { ensureGsap, gsap, useGSAP, ScrollTrigger } from "@/components/motion/register";
import type { HomeWidget } from "@/lib/admin/site-overrides-types";
import type { Lang } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site-types";

type Home = SiteConfig["home"];
type Meta = {
  brand: string;
  year?: string;
  versionLabel?: string;
  ip?: string;
  discord?: string;
  primaryCta?: SiteConfig["primaryCta"];
};

export function HomeExperience({
  lang,
  home,
  meta,
  widgets,
}: {
  lang: Lang;
  home: Home;
  meta: Meta;
  widgets: HomeWidget[];
}) {
  const root = useRef<HTMLDivElement>(null);
  ensureGsap();
  const visible = widgets.filter((w) => w.visible);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-hero-item], [data-reveal], [data-hero-media]", {
          clearProps: "all",
          opacity: 1,
          y: 0,
          scale: 1,
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heroItems = gsap.utils.toArray<HTMLElement>("[data-hero-item]");
        gsap.set(heroItems, { opacity: 0, y: 28 });
        gsap.set("[data-hero-media]", { scale: 1.08, opacity: 0.45 });

        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .to("[data-hero-media]", { scale: 1, opacity: 0.62, duration: 1.35 }, 0)
          .to(
            heroItems,
            { opacity: 1, y: 0, duration: 0.75, stagger: 0.1 },
            0.15,
          );

        gsap.to("[data-hero-media]", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-hero]",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        ScrollTrigger.batch("[data-reveal]", {
          start: "top 88%",
          onEnter: (batch) => {
            gsap.fromTo(
              batch,
              { opacity: 0, y: 36 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.08,
                ease: "power3.out",
                overwrite: "auto",
              },
            );
          },
          once: true,
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const cta = pickLocalized(
    meta.primaryCta,
    lang,
    lang === "en" ? "Get started" : "Başla",
  );

  const sections: Record<HomeWidget["id"], ReactNode> = {
    hero: (
      <section
        key="hero"
        data-hero
        className="relative isolate min-h-[100svh] overflow-hidden bg-[var(--hp-bg)] text-white"
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            data-hero-media
            src={home.heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover will-change-transform"
          />
          <div className="hero-veil absolute inset-0" />
          <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.14]" />
        </div>
        <div className="container relative z-10 flex min-h-[100svh] flex-col justify-end pb-20 pt-32">
          <div className="max-w-3xl">
            <h1
              data-hero-item
              className="font-display text-[clamp(3rem,10vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.03em]"
            >
              {meta.brand}
            </h1>
            <p
              data-hero-item
              className="mt-5 max-w-xl text-base leading-relaxed text-white/82 sm:text-lg"
            >
              {pickLocalized(home.heroSub, lang)}
            </p>
            <div data-hero-item className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-cta">
                {cta}
              </Link>
              <Link href={home.steps[0]?.href || "/wiki"} className="btn btn-ghost">
                {pickLocalized(home.stepsCta, lang)}
              </Link>
              {meta.discord && meta.discord !== "#" ? (
                <Link href={meta.discord} className="btn btn-ghost">
                  Discord
                </Link>
              ) : null}
            </div>
            {(meta.ip || meta.year || meta.versionLabel) && (
              <p
                data-hero-item
                className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55"
              >
                {meta.ip ? (
                  <span className="font-mono text-[var(--atr-p-gold-500)]">{meta.ip}</span>
                ) : null}
                {(meta.year || meta.versionLabel) && (
                  <span>
                    {[meta.year, meta.versionLabel].filter(Boolean).join(" · ")}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </section>
    ),
    steps: (
      <section key="steps" className="section-pad container">
        <div data-reveal className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--atr-brand)] uppercase">
            {pickLocalized(home.stepsTag, lang)}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {pickLocalized(home.stepsTitle, lang)}
          </h2>
          <p className="mt-3 text-[var(--atr-sub)]">
            {pickLocalized(home.stepsDesc, lang)}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {home.steps.map((step, i) => (
            <Link
              key={step.href + i}
              data-reveal
              href={step.href}
              className="group flex gap-5 border-b border-[var(--atr-border)] pb-8 transition"
            >
              <Image
                src={step.image}
                alt=""
                width={72}
                height={72}
                sizes="72px"
                className="h-[72px] w-[72px] shrink-0 object-contain transition duration-300 group-hover:scale-105"
              />
              <div>
                <h3 className="text-xl font-semibold tracking-tight transition group-hover:text-[var(--atr-brand)]">
                  {pickLocalized(step.title, lang)}
                </h3>
                <p className="mt-2 text-[var(--atr-sub)]">
                  {pickLocalized(step.text, lang)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    ),
    news: (
      <section key="news" className="section-band section-pad">
        <div className="container">
          <div data-reveal className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.16em] text-[var(--atr-brand)] uppercase">
              {pickLocalized(home.newsTag, lang)}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {pickLocalized(home.newsTitle, lang)}
            </h2>
            <p className="mt-3 text-[var(--atr-sub)]">
              {pickLocalized(home.newsDesc, lang)}
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {home.news.map((item, i) => (
              <Link
                key={item.href + i}
                data-reveal
                href={item.href}
                className="group block"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight transition group-hover:text-[var(--atr-brand)]">
                  {pickLocalized(item.title, lang)}
                </h3>
                <p className="mt-2 text-sm text-[var(--atr-sub)]">
                  {pickLocalized(item.blurb, lang)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),
    paths: (
      <section key="paths" className="section-pad container">
        <h2 data-reveal className="text-3xl font-bold tracking-tight sm:text-4xl">
          {pickLocalized(home.pathsTitle, lang)}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {home.paths.map((path) => (
            <article key={pickLocalized(path.title, lang)} data-reveal className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                <Image
                  src={path.image}
                  alt={pickLocalized(path.title, lang)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="text-lg font-semibold">
                    {pickLocalized(path.title, lang)}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    {pickLocalized(path.blurb, lang)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    ),
    discord:
      meta.discord && meta.discord !== "#" ? (
        <section
          key="discord"
          className="relative overflow-hidden border-t border-white/10 bg-[var(--hp-bg)] py-16 text-white"
        >
          <div className="hero-grain pointer-events-none absolute inset-0 opacity-10" />
          <div
            data-reveal
            className="container relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
          >
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {pickLocalized(home.discordTitle, lang)}
              </h2>
              <p className="mt-3 text-white/72">
                {pickLocalized(home.discordDesc, lang)}
              </p>
            </div>
            <Link href={meta.discord} className="btn btn-cta shrink-0">
              {pickLocalized(home.discordCta, lang)}
            </Link>
          </div>
        </section>
      ) : null,
  };

  return <div ref={root}>{visible.map((w) => sections[w.id])}</div>;
}
