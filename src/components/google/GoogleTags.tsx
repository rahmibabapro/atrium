"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import {
  CONSENT_STORAGE,
  allowsAds,
  allowsGoogleAnalytics,
  parseConsent,
  type ConsentLevel,
} from "@/lib/consent";
import type { GoogleIntegrations } from "@/lib/admin/site-overrides-types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  }
}

function readConsent(): ConsentLevel {
  try {
    return parseConsent(localStorage.getItem(CONSENT_STORAGE));
  } catch {
    return "unknown";
  }
}

function subscribeConsent(onChange: () => void) {
  window.addEventListener("atr-consent", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("atr-consent", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Hydration-safe consent value that tracks the banner + other tabs. */
function useConsent(): ConsentLevel {
  return useSyncExternalStore(subscribeConsent, readConsent, () => "unknown");
}

export function GoogleTags({ google }: { google?: GoogleIntegrations }) {
  const consent = useConsent();
  const analyticsId = google?.analyticsId;
  const adsenseClient = google?.adsenseClient;
  const adsOn = Boolean(google?.adsenseEnabled && adsenseClient);

  useEffect(() => {
    if (!analyticsId || !allowsGoogleAnalytics(consent)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: allowsAds(consent) ? "granted" : "denied",
      ad_user_data: allowsAds(consent) ? "granted" : "denied",
      ad_personalization: allowsAds(consent) ? "granted" : "denied",
    });
    window.gtag("config", analyticsId, { send_page_view: true });
  }, [analyticsId, consent]);

  return (
    <>
      {/* Inline so the consent default runs during HTML parse, before any tag loads. */}
      <script
        id="google-consent-default"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`,
        }}
      />
      {analyticsId && allowsGoogleAnalytics(consent) ? (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
          strategy="afterInteractive"
        />
      ) : null}
      {adsOn && allowsAds(consent) ? (
        <Script
          id="adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}

export function AdSenseUnit({
  client,
  slot,
  className,
}: {
  client?: string;
  slot?: string;
  className?: string;
}) {
  const consent = useConsent();

  useEffect(() => {
    if (!client || !slot || !allowsAds(consent)) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [client, slot, consent]);

  if (!client || !slot || !allowsAds(consent)) return null;

  return (
    <ins
      className={`adsbygoogle ${className || "block"}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
