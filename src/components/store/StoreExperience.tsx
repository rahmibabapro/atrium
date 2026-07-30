"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";
import { pickLocalized, type Lang } from "@/lib/i18n";
import type { StoreCatalog } from "@/lib/store-catalog";

/**
 * Storefront UX inspired by Medusa / Next.js Commerce patterns:
 * category chips, featured product, filterable grid, lightweight cart drawer state.
 * Checkout remains stubbed until Atrium ID payments land.
 */
export function StoreExperience({
  lang,
  catalog,
  brand,
  supportHref = "/support",
}: {
  lang: Lang;
  catalog: StoreCatalog;
  brand: string;
  supportHref?: string;
}) {
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, number>>({});

  const products = useMemo(
    () =>
      catalog.products.filter(
        (p) => category === "all" || p.category === category,
      ),
    [catalog.products, category],
  );

  const featured =
    catalog.products.find((p) => p.id === catalog.featuredId) ||
    catalog.products.find((p) => p.popular) ||
    catalog.products[0];

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  function add(id: string) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  return (
    <PageReveal className="container section-pad">
      <PageHero
        eyebrow={pickLocalized(catalog.hero.eyebrow, lang)}
        title={pickLocalized(catalog.hero.title, lang)}
        description={pickLocalized(catalog.hero.subtitle, lang)}
        actions={
          <>
            <span className="btn btn-primary !cursor-default !py-2 text-sm">
              {catalog.currency} · {brand}
            </span>
            <span className="btn border border-[var(--atr-border)] bg-white !py-2 text-sm">
              {lang === "en"
                ? `Cart (${cartCount})`
                : lang === "es"
                  ? `Carrito (${cartCount})`
                  : `Sepet (${cartCount})`}
            </span>
          </>
        }
      />

      {featured ? (
        <section
          data-reveal
          className="mt-10 grid items-center gap-8 overflow-hidden rounded-3xl border border-[var(--atr-border)] bg-[var(--hp-bg)] p-6 text-white md:grid-cols-[1.1fr_1fr] md:p-8"
        >
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <Image
              src={featured.image}
              alt={pickLocalized(featured.title, lang)}
              fill
              sizes="(max-width:768px) 90vw, 380px"
              className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--atr-p-gold-500)] uppercase">
              {lang === "en" ? "Featured" : "Öne çıkan"}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {pickLocalized(featured.title, lang)}
            </h2>
            <p className="mt-3 text-white/75">
              {pickLocalized(featured.blurb, lang)}
            </p>
            <p className="mt-5 text-xl font-semibold text-[var(--atr-p-gold-500)]">
              {pickLocalized(featured.priceLabel, lang)}
            </p>
            <button
              type="button"
              onClick={() => add(featured.id)}
              className="btn btn-cta mt-6"
            >
              {lang === "en" ? "Add to cart" : "Sepete ekle"}
            </button>
          </div>
        </section>
      ) : null}

      <div data-reveal className="mt-10 flex flex-wrap gap-2">
        {catalog.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              category === c.id
                ? "bg-[var(--atr-brand)] text-white"
                : "bg-[var(--atr-p-slate-100)] text-[var(--atr-sub)] hover:bg-[var(--atr-p-slate-200)]"
            }`}
          >
            {pickLocalized(c.label, lang)}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            data-reveal
            className="group flex flex-col border-b border-[var(--atr-border)] pb-6"
          >
            <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--atr-p-slate-100)]">
              <Image
                src={product.image}
                alt={pickLocalized(product.title, lang)}
                fill
                sizes="(max-width:768px) 100vw, 33vw"
                className="object-contain p-6 transition duration-500 group-hover:scale-105"
              />
              {product.badge ? (
                <span className="absolute top-3 left-3 rounded-full bg-[var(--atr-brand)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                  {pickLocalized(product.badge, lang)}
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold tracking-tight">
              {pickLocalized(product.title, lang)}
            </h3>
            <p className="mt-1 flex-1 text-sm text-[var(--atr-sub)]">
              {pickLocalized(product.blurb, lang)}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-semibold text-[var(--atr-brand)]">
                {pickLocalized(product.priceLabel, lang)}
              </span>
              <button
                type="button"
                onClick={() => add(product.id)}
                className="btn btn-primary !px-3 !py-2 text-sm"
              >
                {lang === "en" ? "Add" : "Ekle"}
                {cart[product.id] ? ` · ${cart[product.id]}` : ""}
              </button>
            </div>
          </article>
        ))}
      </div>

      <p data-reveal className="mt-10 text-sm text-[var(--atr-muted)]">
        {pickLocalized(catalog.notes, lang)}{" "}
        <Link href={supportHref} className="text-[var(--atr-brand)]">
          {lang === "en" ? "Support" : "Destek"}
        </Link>
      </p>
    </PageReveal>
  );
}
