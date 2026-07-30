"use client";

import { useEffect } from "react";
import { pickLocalized, type Lang } from "@/lib/i18n";
import type { Localized } from "@/lib/site-types";
import { useRadio } from "./RadioProvider";

export function RadioExperience({
  lang,
  title,
  lead,
}: {
  lang: Lang;
  title: Localized;
  lead?: Localized;
}) {
  const r = useRadio();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        r.toggle();
      }
      if (e.key === "m" || e.key === "M") r.toggleMute();
      if (e.key === "[") r.setVolume(r.volume - 0.05);
      if (e.key === "]") r.setVolume(r.volume + 0.05);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [r]);

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl bg-[var(--hp-bg)] px-6 py-10 text-white sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 15% 20%, color-mix(in srgb, var(--atr-brand) 50%, transparent), transparent), radial-gradient(ellipse 50% 40% at 85% 80%, color-mix(in srgb, var(--atr-p-gold-500) 28%, transparent), transparent)",
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--atr-p-gold-500)] uppercase">
            Community radio
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
            {pickLocalized(title, lang)}
          </h1>
          {lead ? (
            <p className="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">
              {pickLocalized(lead, lang)}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={r.toggle}
              className="rounded-xl bg-[var(--hp-sc-cta-bg)] px-6 py-3 text-sm font-bold text-[var(--hp-sc-cta-text)]"
              data-track="radio-hero-toggle"
            >
              {r.loading ? "Buffering…" : r.playing ? "Pause stream" : "Listen live"}
            </button>
            <div className="text-xs text-white/70">
              Shortcuts: Space play/pause · M mute · [ ] volume
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold tracking-wider text-white/50 uppercase">
              Now playing
            </p>
            <p className="mt-1 text-lg font-semibold">
              {r.station
                ? pickLocalized(r.station.name, lang)
                : "No station"}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {r.nowPlaying ||
                (r.station
                  ? pickLocalized(r.station.tagline || r.station.name, lang)
                  : "—")}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold tracking-tight">Stations</h2>
        <p className="mt-1 text-sm text-[var(--atr-sub)]">
          Switch channels without leaving the page. The dock keeps audio alive while you browse.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {r.stations.map((s) => {
            const active = r.station?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => r.setStationId(s.id)}
                className={`rounded-2xl border p-5 text-left transition ${
                  active
                    ? "border-[var(--atr-brand)] bg-[color-mix(in_srgb,var(--atr-brand)_8%,white)]"
                    : "border-[var(--atr-border)] bg-white hover:border-[var(--atr-brand)]"
                }`}
                data-track={`radio-station-${s.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{pickLocalized(s.name, lang)}</p>
                  {active ? (
                    <span className="text-[10px] font-bold tracking-wider text-[var(--atr-brand)] uppercase">
                      {r.playing ? "On air" : "Selected"}
                    </span>
                  ) : null}
                </div>
                {s.tagline ? (
                  <p className="mt-2 text-sm text-[var(--atr-sub)]">
                    {pickLocalized(s.tagline, lang)}
                  </p>
                ) : null}
                {s.genre ? (
                  <p className="mt-3 text-[10px] font-semibold tracking-wider text-[var(--atr-muted)] uppercase">
                    {s.genre}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--atr-border)] bg-white p-5 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={r.muted ? 0 : r.volume}
            onChange={(e) => {
              if (r.muted) r.toggleMute();
              r.setVolume(Number(e.target.value));
            }}
            className="mt-2 w-full"
          />
        </label>
        <label className="block text-sm font-medium">
          Sleep timer
          <select
            value={r.sleepMinutes ?? ""}
            onChange={(e) =>
              r.setSleepMinutes(e.target.value ? Number(e.target.value) : null)
            }
            className="mt-2 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 text-sm"
          >
            <option value="">Off</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </label>
        <div className="text-sm">
          <p className="font-medium">Dock</p>
          <p className="mt-2 text-[var(--atr-sub)]">
            A floating player stays on every public page while this feature is
            enabled. Turn the feature off in pack config or set{" "}
            <code className="text-xs">/radio</code> Offline in Site foundation to
            remove it.
          </p>
        </div>
      </section>
    </div>
  );
}
