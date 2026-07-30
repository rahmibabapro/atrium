import { headers } from "next/headers";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { AdSenseUnit, GoogleTags } from "@/components/google/GoogleTags";
import { getServerSession } from "@/lib/atriumid/session";
import { readSiteOverrides } from "@/lib/admin/site-overrides";

/** Client/Google/consent islands for the public site (skipped on /admin). */
export async function PublicChrome() {
  const pathname = (await headers()).get("x-pathname") || "";
  if (pathname.startsWith("/admin")) return null;

  const overrides = readSiteOverrides();
  const session = await getServerSession();
  const user = session?.user as
    | (NonNullable<typeof session>["user"] & { username?: string | null })
    | undefined;

  return (
    <>
      <GoogleTags google={overrides.google} />
      <AnalyticsBeacon
        userId={user?.id}
        userLabel={user?.username || user?.name}
      />
      <ConsentBanner />
      {overrides.google?.adsenseEnabled &&
      overrides.google.adsenseClient &&
      overrides.google.adsenseSlotFooter ? (
        <div className="container py-4">
          <AdSenseUnit
            client={overrides.google.adsenseClient}
            slot={overrides.google.adsenseSlotFooter}
          />
        </div>
      ) : null}
    </>
  );
}
