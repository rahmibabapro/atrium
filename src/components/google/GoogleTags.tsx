"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
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

export function GoogleTags({ google }: { google?: GoogleIntegrations }) {
  const [consent, setConsent] = useState<ConsentLevel>("unknown");
  const analyticsId = google?.analyticsId;
  const adsenseClient = google?.adsenseClient;
  const adsOn = Boolean(google?.adsenseEnabled && adsenseClient);

  useEffect(() => {
    setConsent(readConsent());
    const on = () => setConsent(readConsent());
    window.addEventListener("atr-consent", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("atr-consent", on);
      window.removeEventListener("storage", on);
    };
  }, []);

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
      <Script id="google-consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`}
      </Script>
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
  const [consent, setConsent] = useState<ConsentLevel>("unknown");

  useEffect(() => {
    setConsent(readConsent());
    const on = () => setConsent(readConsent());
    window.addEventListener("atr-consent", on);
    return () => window.removeEventListener("atr-consent", on);
  }, []);

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
