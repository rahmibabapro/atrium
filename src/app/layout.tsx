import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { RadioMount } from "@/components/radio/RadioMount";
import { OrganizationJsonLd } from "@/components/seo/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { PublicChrome } from "@/components/site/PublicChrome";
import {
  readSiteOverrides,
  warmSiteOverrides,
} from "@/lib/admin/site-overrides";
import { resolveLang } from "@/lib/i18n";
import { defaultLang, site, themeStyle } from "@/lib/content";
import { fontBody, fontMono } from "@/lib/fonts";
import { siteOrigin } from "@/lib/site-url";

const origin = siteOrigin();
const google = readSiteOverrides().google;

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: site.brand,
    template: `%s | ${site.brand}`,
  },
  description: `${site.brand} — community platform`,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.brand,
    title: site.brand,
    description: `${site.brand} — community platform`,
    url: origin,
  },
  twitter: {
    card: "summary_large_image",
    title: site.brand,
    description: `${site.brand} — community platform`,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: google?.searchConsoleVerification
    ? { google: google.searchConsoleVerification }
    : undefined,
  icons: {
    icon: "/assets/brand/favicon-32.png",
    apple: "/assets/brand/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensures the sync readSiteOverrides() cache is fresh for this render tree.
  await warmSiteOverrides().catch(() => undefined);
  const jar = await cookies();
  const lang = resolveLang(jar.get("aom_lang")?.value, defaultLang());
  return (
    <html lang={lang} className={`${fontBody.variable} ${fontMono.variable}`}>
      <body className={fontBody.className} style={themeStyle()}>
        <OrganizationJsonLd />
        <RadioMount>
          <SiteShell lang={lang}>{children}</SiteShell>
          <PublicChrome />
        </RadioMount>
      </body>
    </html>
  );
}
