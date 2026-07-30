"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_STORAGE,
  parseConsent,
  type ConsentLevel,
} from "@/lib/consent";

function persist(level: Exclude<ConsentLevel, "unknown">) {
  try {
    localStorage.setItem(CONSENT_STORAGE, level);
  } catch {
    /* ignore */
  }
  document.cookie = `${CONSENT_COOKIE}=${level}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new CustomEvent("atr-consent", { detail: level }));
}

export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = parseConsent(
      (() => {
        try {
          return localStorage.getItem(CONSENT_STORAGE);
        } catch {
          return null;
        }
      })(),
    );
    setOpen(current === "unknown");
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[var(--atr-border)] bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="container flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[var(--atr-text)]">
            Privacy choices
          </p>
          <p className="mt-1 text-xs text-[var(--atr-sub)]">
            We use first-party analytics for the admin dashboard (pages, clicks,
            active time). Google Analytics and AdSense load only if you allow
            them. Necessary cookies keep you signed in.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn border border-[var(--atr-border)] bg-white !py-2 text-xs"
            onClick={() => {
              persist("necessary");
              setOpen(false);
            }}
          >
            Necessary only
          </button>
          <button
            type="button"
            className="btn border border-[var(--atr-border)] bg-white !py-2 text-xs"
            onClick={() => {
              persist("analytics");
              setOpen(false);
            }}
          >
            Analytics
          </button>
          <button
            type="button"
            className="btn btn-primary !py-2 text-xs"
            onClick={() => {
              persist("all");
              setOpen(false);
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
