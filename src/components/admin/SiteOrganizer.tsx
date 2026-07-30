"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition, type ButtonHTMLAttributes } from "react";
import {
  resetSiteOrganization,
  saveSiteOrganization,
} from "@/app/admin/actions";
import {
  DEFAULT_HOME_WIDGETS,
  fromDatetimeLocalValue,
  mergeHomeWidgets,
  toDatetimeLocalValue,
  type GoogleIntegrations,
  type HomeWidget,
  type PageStatus,
  type SiteOverrides,
} from "@/lib/admin/site-overrides-types";

type PageRow = {
  href: string;
  label: string;
  status: PageStatus;
  inHeader: boolean;
  inFooter: boolean;
  countdownAt?: string;
  countdownTitle?: string;
  countdownMessage?: string;
};

type ThemeState = {
  brand: string;
  brandHover: string;
  gold: string;
  cta: string;
  ctaText: string;
  night: string;
  headerBg: string;
  headerText: string;
};

function SortHandle(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="cursor-grab rounded-lg bg-[var(--atr-p-slate-100)] px-2 py-1 text-xs font-bold text-[var(--atr-muted)] active:cursor-grabbing"
      {...props}
    >
      ⋮⋮
    </button>
  );
}

function SortablePageCard({
  page,
  onChange,
}: {
  page: PageRow;
  onChange: (next: PageRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.href });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-[var(--atr-border)] bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <SortHandle {...attributes} {...listeners} />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="truncate text-sm font-semibold">{page.label}</p>
            <p className="truncate font-mono text-xs text-[var(--atr-muted)]">
              {page.href}
            </p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Page status">
            {(
              [
                ["live", "Live"],
                ["offline", "Offline"],
                ["countdown", "Countdown"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...page, status: value })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  page.status === value
                    ? "bg-[var(--atr-brand)] text-white"
                    : "bg-[var(--atr-p-slate-100)] text-[var(--atr-sub)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={page.inHeader}
                disabled={page.status === "offline"}
                onChange={(e) =>
                  onChange({ ...page, inHeader: e.target.checked })
                }
              />
              Header
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={page.inFooter}
                disabled={page.status === "offline"}
                onChange={(e) =>
                  onChange({ ...page, inFooter: e.target.checked })
                }
              />
              Footer
            </label>
          </div>

          {page.status === "countdown" ? (
            <div className="grid gap-2 rounded-xl bg-[var(--atr-p-slate-050)] p-3 sm:grid-cols-2">
              <label className="block text-xs font-medium sm:col-span-2">
                Opens at (your local time)
                <input
                  type="datetime-local"
                  required
                  value={toDatetimeLocalValue(page.countdownAt)}
                  onChange={(e) =>
                    onChange({
                      ...page,
                      countdownAt: fromDatetimeLocalValue(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--atr-border)] bg-white px-3 py-2 font-mono text-xs"
                />
              </label>
              <label className="block text-xs font-medium sm:col-span-2">
                Countdown title
                <input
                  value={page.countdownTitle || ""}
                  onChange={(e) =>
                    onChange({ ...page, countdownTitle: e.target.value })
                  }
                  placeholder="Gates open soon"
                  className="mt-1 w-full rounded-lg border border-[var(--atr-border)] bg-white px-3 py-2 text-xs"
                />
              </label>
              <label className="block text-xs font-medium sm:col-span-2">
                Message
                <textarea
                  value={page.countdownMessage || ""}
                  onChange={(e) =>
                    onChange({ ...page, countdownMessage: e.target.value })
                  }
                  rows={2}
                  placeholder="This section unlocks when the timer ends."
                  className="mt-1 w-full rounded-lg border border-[var(--atr-border)] bg-white px-3 py-2 text-xs"
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SortableWidgetRow({
  widget,
  onToggle,
}: {
  widget: HomeWidget;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-3 ${
        widget.visible ? "border-[var(--atr-border)]" : "border-dashed opacity-60"
      }`}
    >
      <SortHandle {...attributes} {...listeners} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold capitalize">{widget.id}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="text-xs font-semibold text-[var(--atr-brand)]"
      >
        {widget.visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function SiteOrganizer({
  initialPages,
  initialOverrides,
  themeDefaults,
}: {
  initialPages: PageRow[];
  initialOverrides: SiteOverrides;
  themeDefaults: ThemeState;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"pages" | "home" | "look" | "google">(
    "pages",
  );

  const [pages, setPages] = useState(initialPages);
  const [widgets, setWidgets] = useState<HomeWidget[]>(() =>
    mergeHomeWidgets(initialOverrides.homeWidgets || DEFAULT_HOME_WIDGETS),
  );
  const [theme, setTheme] = useState<ThemeState>({
    brand: initialOverrides.theme?.brand || themeDefaults.brand,
    brandHover: initialOverrides.theme?.brandHover || themeDefaults.brandHover,
    gold: initialOverrides.theme?.gold || themeDefaults.gold,
    cta: initialOverrides.theme?.cta || themeDefaults.cta,
    ctaText: initialOverrides.theme?.ctaText || themeDefaults.ctaText,
    night: initialOverrides.theme?.night || themeDefaults.night,
    headerBg: initialOverrides.theme?.headerBg || themeDefaults.headerBg,
    headerText: initialOverrides.theme?.headerText || themeDefaults.headerText,
  });
  const [google, setGoogle] = useState<GoogleIntegrations>({
    analyticsId: initialOverrides.google?.analyticsId || "",
    adsenseClient: initialOverrides.google?.adsenseClient || "",
    adsenseEnabled: initialOverrides.google?.adsenseEnabled || false,
    adsenseSlotHeader: initialOverrides.google?.adsenseSlotHeader || "",
    adsenseSlotInArticle: initialOverrides.google?.adsenseSlotInArticle || "",
    adsenseSlotFooter: initialOverrides.google?.adsenseSlotFooter || "",
    searchConsoleVerification:
      initialOverrides.google?.searchConsoleVerification || "",
    adsTxtExtra: initialOverrides.google?.adsTxtExtra || "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onPageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPages((items) => {
      const oldIndex = items.findIndex((p) => p.href === active.id);
      const newIndex = items.findIndex((p) => p.href === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function onWidgetDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgets((items) => {
      const oldIndex = items.findIndex((w) => w.id === active.id);
      const newIndex = items.findIndex((w) => w.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function save() {
    setMsg(null);
    const missingCountdown = pages.find(
      (p) => p.status === "countdown" && !p.countdownAt,
    );
    if (missingCountdown) {
      setMsg(`Set an opens-at time for ${missingCountdown.label} before publishing.`);
      setTab("pages");
      return;
    }

    start(async () => {
      try {
        await saveSiteOrganization({
          theme,
          pages: pages.map((p, order) => ({
            href: p.href,
            status: p.status,
            inHeader: p.status === "offline" ? false : p.inHeader,
            inFooter: p.status === "offline" ? false : p.inFooter,
            order,
            countdownAt:
              p.status === "countdown" ? p.countdownAt : undefined,
            countdownTitle:
              p.status === "countdown"
                ? p.countdownTitle || undefined
                : undefined,
            countdownMessage:
              p.status === "countdown"
                ? p.countdownMessage || undefined
                : undefined,
          })),
          homeWidgets: widgets,
          google,
          navOrder: pages.map((p) => p.href),
          navHidden: pages
            .filter((p) => !p.inHeader || p.status === "offline")
            .map((p) => p.href),
        });
        setMsg("Published. Site, Google tags, and page gates updated.");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function reset() {
    if (
      !window.confirm(
        "Reset site foundation to pack defaults? Theme, pages, and home layout overrides will be cleared.",
      )
    ) {
      return;
    }
    setMsg(null);
    start(async () => {
      try {
        await resetSiteOrganization();
        window.location.reload();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Reset failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pages", "Pages"],
            ["home", "Home layout"],
            ["look", "Look"],
            ["google", "Google"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === id
                ? "bg-[var(--hp-bg)] text-white"
                : "bg-white text-[var(--atr-sub)] ring-1 ring-[var(--atr-border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pages" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Pages</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--atr-sub)]">
              One place to run the site: drag header order, remove from header/footer,
              deactivate a page, or put it behind a countdown. Offline pages are gated
              for visitors; staff can still preview.
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onPageDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.href)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {pages.map((page) => (
                  <SortablePageCard
                    key={page.href}
                    page={page}
                    onChange={(next) =>
                      setPages((list) =>
                        list.map((p) => (p.href === next.href ? next : p)),
                      )
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      ) : null}

      {tab === "home" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Home layout</h2>
            <p className="mt-1 text-sm text-[var(--atr-sub)]">
              Pull-and-drag homepage sections. Hide what you do not need.
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onWidgetDragEnd}
          >
            <SortableContext
              items={widgets.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-w-xl space-y-2">
                {widgets.map((w) => (
                  <SortableWidgetRow
                    key={w.id}
                    widget={w}
                    onToggle={() =>
                      setWidgets((list) =>
                        list.map((x) =>
                          x.id === w.id ? { ...x, visible: !x.visible } : x,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      ) : null}

      {tab === "google" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Google</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--atr-sub)]">
              Connect Analytics, AdSense, and Search Console. Tags load only after
              visitor consent. First-party analytics for the admin dashboard is
              separate and also consent-gated.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              GA4 Measurement ID
              <input
                value={google.analyticsId || ""}
                onChange={(e) =>
                  setGoogle((g) => ({ ...g, analyticsId: e.target.value.trim() }))
                }
                placeholder="G-XXXXXXXX"
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm font-medium">
              Search Console verification
              <input
                value={google.searchConsoleVerification || ""}
                onChange={(e) =>
                  setGoogle((g) => ({
                    ...g,
                    searchConsoleVerification: e.target.value.trim(),
                  }))
                }
                placeholder="google-site-verification content value"
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm font-medium">
              AdSense client
              <input
                value={google.adsenseClient || ""}
                onChange={(e) =>
                  setGoogle((g) => ({
                    ...g,
                    adsenseClient: e.target.value.trim(),
                  }))
                }
                placeholder="ca-pub-########"
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium sm:mt-7">
              <input
                type="checkbox"
                checked={Boolean(google.adsenseEnabled)}
                onChange={(e) =>
                  setGoogle((g) => ({ ...g, adsenseEnabled: e.target.checked }))
                }
              />
              Enable AdSense script + units
            </label>
            <label className="block text-sm font-medium">
              Header ad slot
              <input
                value={google.adsenseSlotHeader || ""}
                onChange={(e) =>
                  setGoogle((g) => ({
                    ...g,
                    adsenseSlotHeader: e.target.value.trim(),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm font-medium">
              In-article ad slot
              <input
                value={google.adsenseSlotInArticle || ""}
                onChange={(e) =>
                  setGoogle((g) => ({
                    ...g,
                    adsenseSlotInArticle: e.target.value.trim(),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Footer ad slot (auto-rendered when set)
              <input
                value={google.adsenseSlotFooter || ""}
                onChange={(e) =>
                  setGoogle((g) => ({
                    ...g,
                    adsenseSlotFooter: e.target.value.trim(),
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Extra ads.txt lines
              <textarea
                value={google.adsTxtExtra || ""}
                onChange={(e) =>
                  setGoogle((g) => ({ ...g, adsTxtExtra: e.target.value }))
                }
                rows={3}
                placeholder="optional authorized seller lines"
                className="mt-1 w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
              />
            </label>
          </div>
          <p className="text-xs text-[var(--atr-sub)]">
            After publish: verify{" "}
            <code className="text-[11px]">/ads.txt</code>, submit{" "}
            <code className="text-[11px]">/sitemap.xml</code> in Search Console,
            and review live stats under{" "}
            <a href="/admin/analytics" className="underline">
              Analytics
            </a>
            .
          </p>
        </section>
      ) : null}

      {tab === "look" ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Look</h2>
            <p className="mt-1 text-sm text-[var(--atr-sub)]">
              Site-wide colors (validated hex). Header and brand update after publish.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["brand", "Brand"],
                ["brandHover", "Brand hover"],
                ["gold", "Gold accent"],
                ["cta", "CTA"],
                ["ctaText", "CTA text"],
                ["night", "Night / hero"],
                ["headerBg", "Header background"],
                ["headerText", "Header text"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm font-medium">
                {label}
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      theme[key].startsWith("#")
                        ? theme[key].slice(0, 7)
                        : "#ffffff"
                    }
                    onChange={(e) =>
                      setTheme((t) => ({ ...t, [key]: e.target.value }))
                    }
                    className="h-10 w-12 cursor-pointer rounded border border-[var(--atr-border)] bg-white"
                  />
                  <input
                    value={theme[key]}
                    onChange={(e) =>
                      setTheme((t) => ({ ...t, [key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[var(--atr-border)] px-3 py-2 font-mono text-xs"
                  />
                </div>
              </label>
            ))}
          </div>
          <div
            className="mt-4 overflow-hidden rounded-2xl border border-[var(--atr-border)]"
            style={{ background: theme.night, color: "#fff" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 text-sm font-semibold"
              style={{ background: theme.headerBg, color: theme.headerText }}
            >
              <span>Header preview</span>
              <span
                className="rounded-lg px-3 py-1 text-xs"
                style={{ background: theme.brand, color: "#fff" }}
              >
                Brand
              </span>
            </div>
            <div className="px-4 py-6">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-bold"
                style={{ background: theme.cta, color: theme.ctaText }}
              >
                CTA preview
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--atr-border)] pt-4">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="btn btn-primary"
        >
          {pending ? "Publishing…" : "Publish site changes"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={reset}
          className="btn border border-[var(--atr-border)] bg-white"
        >
          Reset to pack defaults
        </button>
        {msg ? (
          <p className="text-sm text-[var(--atr-sub)]" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
