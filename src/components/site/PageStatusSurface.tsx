"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function partsUntil(targetMs: number, now: number) {
  const diff = Math.max(0, targetMs - now);
  const sec = Math.floor(diff / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
    done: diff <= 0,
  };
}

export function PageStatusSurface({
  mode,
  brand,
  title,
  message,
  countdownAt,
  homeHref = "/",
  showHomeLink = true,
}: {
  mode: "offline" | "countdown";
  brand: string;
  title: string;
  message: string;
  countdownAt?: string;
  homeHref?: string;
  showHomeLink?: boolean;
}) {
  const router = useRouter();
  const target = countdownAt ? Date.parse(countdownAt) : NaN;
  const [now, setNow] = useState(() => Date.now());
  const refreshed = useRef(false);

  useEffect(() => {
    if (mode !== "countdown" || Number.isNaN(target)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [mode, target]);

  useEffect(() => {
    if (mode !== "countdown" || Number.isNaN(target) || refreshed.current) return;
    if (now < target) return;
    // Soft refresh once — avoids full reload loops on clock skew.
    refreshed.current = true;
    router.refresh();
  }, [mode, target, now, router]);

  const clock = Number.isNaN(target) ? null : partsUntil(target, now);

  return (
    <section className="relative flex min-h-[70vh] flex-1 items-center overflow-hidden bg-[var(--hp-bg)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, color-mix(in srgb, var(--atr-brand) 45%, transparent), transparent), radial-gradient(ellipse 60% 40% at 80% 70%, color-mix(in srgb, var(--atr-p-gold-500) 25%, transparent), transparent)",
        }}
      />
      <div className="container relative py-20">
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--atr-p-gold-500)] uppercase">
          {brand}
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/75">{message}</p>

        {mode === "countdown" && clock ? (
          <div className="mt-10 grid max-w-lg grid-cols-4 gap-3">
            {(
              [
                ["Days", clock.days],
                ["Hours", clock.hours],
                ["Min", clock.minutes],
                ["Sec", clock.seconds],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/15 bg-white/5 px-3 py-4 text-center backdrop-blur-sm"
              >
                <p className="font-mono text-3xl font-bold tabular-nums">
                  {pad(value)}
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-wider text-white/55 uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {mode === "countdown" && clock?.done ? (
          <p className="mt-6 text-sm text-white/70">Opening… refresh if this stays.</p>
        ) : null}

        {showHomeLink ? (
          <div className="mt-10">
            <Link
              href={homeHref}
              className="inline-flex rounded-lg bg-[var(--hp-sc-cta-bg)] px-5 py-2.5 text-sm font-bold text-[var(--hp-sc-cta-text)]"
            >
              {homeHref === "/login" ? "Sign in" : "Back to home"}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
