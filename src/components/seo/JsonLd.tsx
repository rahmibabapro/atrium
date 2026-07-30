import { site } from "@/lib/content";
import { siteOrigin } from "@/lib/site-url";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand,
    url: siteOrigin(),
    sameAs: site.discord && site.discord !== "#" ? [site.discord] : undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
