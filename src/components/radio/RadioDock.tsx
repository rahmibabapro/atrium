"use client";

import Link from "next/link";
import { useRadio } from "./RadioProvider";

function Bars({ active }: { active: boolean }) {
  return (
    <span className="inline-flex h-4 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-0.5 rounded-full bg-[var(--atr-p-gold-500)] ${
            active ? "animate-pulse" : "opacity-40"
          }`}
          style={{
            height: `${40 + ((i * 17) % 60)}%`,
            animationDelay: `${i * 120}ms`,
          }}
        />
      ))}
    </span>
  );
}

export function RadioDock() {
  const r = useRadio();
  if (!r.station) return null;

  const name = r.station.name.en || r.station.name.tr || r.station.id;

  if (r.minimized) {
    return (
      <div className="fixed right-4 bottom-4 z-[70]">
        <button
          type="button"
          onClick={() => r.setMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-[var(--hp-bg)] px-4 py-3 text-sm font-semibold text-white shadow-lg"
          data-track="radio-dock-expand"
        >
          <Bars active={r.playing} />
          Radio
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[var(--hp-bg)]/95 text-white backdrop-blur-md">
      <div className="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--atr-p-gold-500)] uppercase">
            <Bars active={r.playing} />
            {r.playing ? "Live" : "Paused"}
            {r.loading ? " · Buffering" : ""}
          </div>
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-white/65">
            {r.nowPlaying || r.station.tagline?.en || "Community radio"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={r.station.id}
            onChange={(e) => r.setStationId(e.target.value)}
            className="max-w-[160px] rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs"
            aria-label="Station"
          >
            {r.stations.map((s) => (
              <option key={s.id} value={s.id} className="text-black">
                {s.name.en || s.name.tr || s.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={r.toggle}
            className="rounded-lg bg-[var(--hp-sc-cta-bg)] px-4 py-2 text-xs font-bold text-[var(--hp-sc-cta-text)]"
            data-track="radio-dock-toggle"
          >
            {r.playing ? "Pause" : "Play"}
          </button>

          <label className="flex items-center gap-2 text-xs text-white/70">
            <span className="sr-only">Volume</span>
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
              className="w-20"
            />
          </label>

          <button
            type="button"
            onClick={r.toggleMute}
            className="rounded-lg border border-white/15 px-2 py-1.5 text-xs"
          >
            {r.muted ? "Unmute" : "Mute"}
          </button>

          <Link
            href="/radio"
            className="rounded-lg border border-white/15 px-2 py-1.5 text-xs font-semibold"
            data-track="radio-open-page"
          >
            Open
          </Link>

          <button
            type="button"
            onClick={() => r.setMinimized(true)}
            className="rounded-lg border border-white/15 px-2 py-1.5 text-xs"
            aria-label="Minimize radio"
          >
            ▕▁
          </button>
        </div>
      </div>
    </div>
  );
}
