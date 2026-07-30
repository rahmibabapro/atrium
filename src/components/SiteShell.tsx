import { headers } from "next/headers";
import { PageStatusSurface } from "./site/PageStatusSurface";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { getServerSession } from "@/lib/atriumid/session";
import { sessionIsStaff } from "@/lib/atriumid/permissions";
import { pageAccessFor, site } from "@/lib/content";
import { pickLocalized, type Lang } from "@/lib/i18n";
import { radioDockEnabled } from "@/lib/radio/config";

function isHomePath(pathname: string) {
  return pathname === "/" || pathname === "";
}

export async function SiteShell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="shell">{children}</div>;
  }

  const access = pageAccessFor(pathname);
  const homeAccess = pageAccessFor("/");
  const session = await getServerSession();
  const staffBypass = sessionIsStaff(
    session?.user as { id: string; role?: string | null } | undefined,
  );

  // Avoid linking visitors into another gated page (esp. offline home).
  const homeHref = homeAccess.mode === "live" ? "/" : "/login";

  if (access.mode !== "live" && !staffBypass) {
    const page = access.page;
    const title =
      access.mode === "countdown"
        ? page.countdownTitle ||
          pickLocalized(page.label, lang) ||
          "Opening soon"
        : "Page unavailable";
    const message =
      access.mode === "countdown"
        ? page.countdownMessage ||
          "This page opens when the countdown ends."
        : "This page has been deactivated by site admins.";

    return (
      <div className="shell">
        <SiteHeader lang={lang} />
        <main className="flex-1">
          <PageStatusSurface
            mode={access.mode}
            brand={site.brand}
            title={title}
            message={message}
            countdownAt={page.countdownAt}
            homeHref={homeHref}
            showHomeLink={isHomePath(pathname) ? homeAccess.mode === "live" : true}
          />
        </main>
        <SiteFooter lang={lang} />
      </div>
    );
  }

  const dockPad = radioDockEnabled() ? "pb-24" : "";

  return (
    <div className={`shell ${dockPad}`}>
      <SiteHeader lang={lang} />
      {staffBypass && access.mode !== "live" ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          Staff preview — public visitors see{" "}
          {access.mode === "offline" ? "offline" : "countdown"} for this page.
        </div>
      ) : null}
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  );
}
