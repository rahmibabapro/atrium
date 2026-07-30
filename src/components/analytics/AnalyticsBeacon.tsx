"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  CONSENT_STORAGE,
  allowsFirstPartyAnalytics,
  parseConsent,
  type ConsentLevel,
} from "@/lib/consent";

function sessionId() {
  const key = "aom_aid";
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `s_tmp_${Date.now().toString(36)}`;
  }
}

function readConsent(): ConsentLevel {
  try {
    return parseConsent(localStorage.getItem(CONSENT_STORAGE));
  } catch {
    return "unknown";
  }
}

function queueSend(
  payload: Record<string, unknown>,
  useBeacon: boolean,
) {
  const body = JSON.stringify(payload);
  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/collect", blob);
    return;
  }
  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function AnalyticsBeacon({
  userId,
  userLabel,
}: {
  userId?: string | null;
  userLabel?: string | null;
}) {
  const pathname = usePathname();
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (!allowsFirstPartyAnalytics(readConsent())) return;

    const sid = sessionId();
    const path = pathname;
    if (lastPath.current !== path) {
      lastPath.current = path;
      queueSend(
        {
          sessionId: sid,
          userId: userId || undefined,
          userLabel: userLabel || undefined,
          events: [{ type: "pageview", path, at: new Date().toISOString() }],
        },
        false,
      );
    }

    const heart = window.setInterval(() => {
      if (!allowsFirstPartyAnalytics(readConsent())) return;
      queueSend(
        {
          sessionId: sid,
          userId: userId || undefined,
          userLabel: userLabel || undefined,
          events: [
            {
              type: "heartbeat",
              path: lastPath.current || path,
              ms: 15_000,
              at: new Date().toISOString(),
            },
          ],
        },
        true,
      );
    }, 15_000);

    const onClick = (ev: MouseEvent) => {
      if (!allowsFirstPartyAnalytics(readConsent())) return;
      const el = (ev.target as HTMLElement | null)?.closest?.(
        "a,button,[data-track]",
      ) as HTMLElement | null;
      if (!el) return;
      const target =
        el.getAttribute("data-track") ||
        el.getAttribute("href") ||
        el.textContent?.trim().slice(0, 80) ||
        el.tagName;
      queueSend(
        {
          sessionId: sid,
          userId: userId || undefined,
          userLabel: userLabel || undefined,
          events: [
            {
              type: "click",
              path: lastPath.current || path,
              target: String(target).slice(0, 200),
              at: new Date().toISOString(),
            },
          ],
        },
        true,
      );
    };

    document.addEventListener("click", onClick, true);
    return () => {
      window.clearInterval(heart);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname, userId, userLabel]);

  return null;
}
