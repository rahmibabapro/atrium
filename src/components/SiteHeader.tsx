import { HeaderChrome } from "@/components/header/HeaderChrome";
import { getServerSession } from "@/lib/atriumid/session";
import { site } from "@/lib/content";
import type { Lang } from "@/lib/i18n";

export async function SiteHeader({ lang }: { lang: Lang }) {
  // Nav already respects site foundation (header toggle + offline/countdown).
  const items = site.nav.map((item) => ({
    href: item.href,
    label: item.label as Record<string, string>,
  }));
  const session = await getServerSession();
  const user = session?.user as
    | (NonNullable<typeof session>["user"] & { username?: string | null })
    | undefined;
  const accountLabel = user?.username || user?.name || null;

  return (
    <HeaderChrome
      lang={lang}
      brand={site.brand}
      items={items}
      accountLabel={accountLabel}
    />
  );
}
