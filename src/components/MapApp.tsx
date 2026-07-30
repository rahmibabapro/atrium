"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PageReveal } from "@/components/motion/PageReveal";

export type MapRegion = {
  id: string;
  name: string;
  tagline: string;
  loreSlug: string;
  type: string;
};

export type MapData = {
  meta: {
    title: string;
    year: string;
    region: string;
    mapWidth: number;
    mapHeight: number;
    imageUrl: string;
  };
  layerLabels: Record<string, string>;
  regions: MapRegion[];
};

export function MapApp({ data }: { data: MapData }) {
  const [active, setActive] = useState(data.regions[0]?.id || "");
  const [filter, setFilter] = useState<string>("all");
  const region = useMemo(
    () => data.regions.find((r) => r.id === active) || data.regions[0],
    [active, data.regions],
  );
  const regions = data.regions.filter((r) => filter === "all" || r.type === filter);

  return (
    <PageReveal className="container grid gap-6 section-pad lg:grid-cols-[minmax(0,1.4fr)_360px]">
      <div
        data-reveal
        className="overflow-hidden rounded-3xl border border-[var(--atr-border)] bg-[var(--hp-bg)] p-3"
      >
        <div className="relative aspect-[1000/667] overflow-hidden rounded-2xl">
          <Image
            src="/assets/map/base-map.png"
            alt={data.meta.title}
            fill
            sizes="(max-width:1024px) 100vw, 65vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 text-white">
            <p className="text-xs tracking-[0.16em] uppercase opacity-80">
              {data.meta.year} · {data.meta.region}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {data.meta.title}
            </h1>
          </div>
        </div>
      </div>

      <aside
        data-reveal
        className="rounded-3xl border border-[var(--atr-border)] bg-white/95 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.03)] backdrop-blur"
      >
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === "all" ? "bg-[var(--atr-brand)] text-white" : "bg-[var(--atr-p-slate-100)] hover:bg-[var(--atr-p-slate-200)]"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {Object.entries(data.layerLabels).map(([key, label]) => (
            <button
              key={key}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === key ? "bg-[var(--atr-brand)] text-white" : "bg-[var(--atr-p-slate-100)] hover:bg-[var(--atr-p-slate-200)]"}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[48vh] space-y-2 overflow-auto [scrollbar-width:thin]">
          {regions.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                item.id === region?.id
                  ? "border-[var(--atr-brand)] bg-[rgba(24,181,116,0.08)]"
                  : "border-[var(--atr-border)] hover:border-[var(--atr-brand)]"
              }`}
            >
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-[var(--atr-muted)]">{item.tagline}</div>
            </button>
          ))}
        </div>

        {region ? (
          <div className="mt-5 border-t border-[var(--atr-border)] pt-4">
            <h2 className="text-lg font-semibold tracking-tight">{region.name}</h2>
            <p className="mt-1 text-sm text-[var(--atr-sub)]">{region.tagline}</p>
            <a
              href={`/wiki#/${region.loreSlug || "geography-and-regions"}/`}
              className="mt-3 inline-flex text-sm font-semibold text-[var(--atr-brand)]"
            >
              Read in wiki →
            </a>
          </div>
        ) : null}
      </aside>
    </PageReveal>
  );
}
