import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <header
      data-reveal
      className={`relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12 ${
        dark
          ? "bg-[var(--hp-bg)] text-white"
          : "border border-[var(--atr-border)] bg-white"
      }`}
    >
      {dark ? <div className="hero-grain pointer-events-none absolute inset-0 opacity-10" /> : null}
      <div className="relative max-w-3xl">
        {eyebrow ? (
          <p
            className={`text-xs font-semibold tracking-[0.18em] uppercase ${
              dark ? "text-[var(--atr-p-gold-500)]" : "text-[var(--atr-brand)]"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className={`mt-3 max-w-2xl leading-relaxed ${dark ? "text-white/75" : "text-[var(--atr-sub)]"}`}>
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
