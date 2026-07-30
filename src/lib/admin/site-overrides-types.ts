import { z } from "zod";

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid color");

/** Absolute site path only — blocks protocol URLs, `//`, and `..` traversal. */
export const pageHrefSchema = z
  .string()
  .min(1)
  .max(200)
  .refine((href) => {
    if (href === "/") return true;
    if (!href.startsWith("/") || href.startsWith("//")) return false;
    if (href.includes("://") || href.includes("..")) return false;
    return /^\/[A-Za-z0-9/_\-.%~]+$/.test(href);
  }, "Invalid page path");

/** CMS-style page lifecycle — Payload/Strapi draft/publish simplified for site packs. */
export const pageStatusSchema = z.enum(["live", "offline", "countdown"]);
export type PageStatus = z.infer<typeof pageStatusSchema>;

export const pageOverrideSchema = z
  .object({
    href: pageHrefSchema,
    status: pageStatusSchema.default("live"),
    inHeader: z.boolean().default(true),
    inFooter: z.boolean().default(true),
    order: z.number().int().min(0).max(200).optional(),
    /** UTC ISO-8601; when reached, countdown pages auto-open as live. */
    countdownAt: z
      .string()
      .max(40)
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid countdown datetime")
      .optional(),
    countdownTitle: z.string().max(120).optional(),
    countdownMessage: z.string().max(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === "countdown" && !val.countdownAt) {
      ctx.addIssue({
        code: "custom",
        message: "Countdown pages require an opens-at datetime",
        path: ["countdownAt"],
      });
    }
  });

export type PageOverride = z.infer<typeof pageOverrideSchema>;

export const homeWidgetIdSchema = z.enum([
  "hero",
  "steps",
  "news",
  "paths",
  "discord",
]);
export type HomeWidgetId = z.infer<typeof homeWidgetIdSchema>;

export const homeWidgetSchema = z.object({
  id: homeWidgetIdSchema,
  visible: z.boolean(),
});
export type HomeWidget = z.infer<typeof homeWidgetSchema>;

const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

export const googleIntegrationsSchema = z.object({
  /** GA4 measurement id, e.g. G-XXXXXXXX */
  analyticsId: z.preprocess(
    emptyToUndef,
    z
      .string()
      .max(32)
      .regex(/^G-[A-Z0-9]+$/, "Invalid GA4 id")
      .optional(),
  ),
  /** AdSense client, e.g. ca-pub-######## */
  adsenseClient: z.preprocess(
    emptyToUndef,
    z
      .string()
      .max(40)
      .regex(/^ca-pub-\d+$/, "Invalid AdSense client")
      .optional(),
  ),
  adsenseEnabled: z.boolean().optional(),
  adsenseSlotHeader: z.preprocess(emptyToUndef, z.string().max(40).optional()),
  adsenseSlotInArticle: z.preprocess(
    emptyToUndef,
    z.string().max(40).optional(),
  ),
  adsenseSlotFooter: z.preprocess(emptyToUndef, z.string().max(40).optional()),
  /** Google Search Console HTML tag content value */
  searchConsoleVerification: z.preprocess(
    emptyToUndef,
    z.string().max(120).optional(),
  ),
  /** Extra ads.txt lines */
  adsTxtExtra: z.preprocess(emptyToUndef, z.string().max(500).optional()),
});

export type GoogleIntegrations = z.infer<typeof googleIntegrationsSchema>;

export const siteOverridesSchema = z.object({
  theme: z
    .object({
      brand: hex.optional(),
      brandHover: hex.optional(),
      gold: hex.optional(),
      cta: hex.optional(),
      ctaText: hex.optional(),
      night: hex.optional(),
      headerBg: hex.optional(),
      headerText: hex.optional(),
    })
    .optional(),
  /** Preferred model — one row per site page (nav + footer registry). */
  pages: z.array(pageOverrideSchema).max(80).optional(),
  /** Legacy (still accepted); migrated into `pages` on read. */
  navOrder: z.array(pageHrefSchema).max(40).optional(),
  navHidden: z.array(pageHrefSchema).max(40).optional(),
  homeWidgets: z.array(homeWidgetSchema).max(12).optional(),
  /** Google Analytics / AdSense / Search Console knobs (admin-editable). */
  google: googleIntegrationsSchema.optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type SiteOverrides = z.infer<typeof siteOverridesSchema>;

export const DEFAULT_HOME_WIDGETS: HomeWidget[] = [
  { id: "hero", visible: true },
  { id: "steps", visible: true },
  { id: "news", visible: true },
  { id: "paths", visible: true },
  { id: "discord", visible: true },
];

/** Preserve organizer drag order; fill any missing default widgets. */
export function mergeHomeWidgets(current?: HomeWidget[]): HomeWidget[] {
  const byId = new Map<HomeWidgetId, HomeWidget>(
    DEFAULT_HOME_WIDGETS.map((d) => [d.id, { ...d }]),
  );
  for (const w of current || []) {
    if (byId.has(w.id)) byId.set(w.id, { id: w.id, visible: w.visible });
  }
  const ordered: HomeWidget[] = [];
  const seen = new Set<HomeWidgetId>();
  for (const w of current || []) {
    if (!byId.has(w.id) || seen.has(w.id)) continue;
    ordered.push(byId.get(w.id)!);
    seen.add(w.id);
  }
  for (const d of DEFAULT_HOME_WIDGETS) {
    if (!seen.has(d.id)) ordered.push(byId.get(d.id)!);
  }
  return ordered;
}

export function effectivePageStatus(
  page: Pick<PageOverride, "status" | "countdownAt">,
  now = Date.now(),
): PageStatus {
  if (page.status !== "countdown") return page.status;
  if (!page.countdownAt) return "countdown";
  const at = Date.parse(page.countdownAt);
  if (Number.isNaN(at)) return "countdown";
  return at <= now ? "live" : "countdown";
}

/** `datetime-local` value ← stored UTC ISO (browser local wall clock). */
export function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** `datetime-local` → UTC ISO for storage (avoids ambiguous timezone parses). */
export function fromDatetimeLocalValue(local: string): string | undefined {
  const trimmed = local.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function formatZodError(err: z.ZodError): string {
  return err.issues
    .slice(0, 4)
    .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
    .join("; ");
}
