"use client";

import { useState, useSyncExternalStore } from "react";
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

function subscribeConsent(onChange: () => void) {
  window.addEventListener("atr-consent", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("atr-consent", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredConsent(): ConsentLevel {
  try {
    return parseConsent(localStorage.getItem(CONSENT_STORAGE));
  } catch {
    return "unknown";
  }
}

export function ConsentBanner() {
  // Server snapshot pretends consent exists so the banner never flashes during SSR.
  const stored = useSyncExternalStore(
    subscribeConsent,
    readStoredConsent,
    () => "necessary" as ConsentLevel,
  );
  const [dismissed, setDismissed] = useState(false);
  const open = stored === "unknown" && !dismissed;

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
              setDismissed(true);
            }}
          >
            Necessary only
          </button>
          <button
            type="button"
            className="btn border border-[var(--atr-border)] bg-white !py-2 text-xs"
            onClick={() => {
              persist("analytics");
              setDismissed(true);
            }}
          >
            Analytics
          </button>
          <button
            type="button"
            className="btn btn-primary !py-2 text-xs"
            onClick={() => {
              persist("all");
              setDismissed(true);
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
