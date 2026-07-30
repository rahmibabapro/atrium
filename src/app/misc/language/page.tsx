import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageReveal } from "@/components/motion/PageReveal";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Language" };

async function setLang(formData: FormData) {
  "use server";
  const lang = String(formData.get("lang") || "tr");
  const jar = await cookies();
  jar.set("aom_lang", lang === "en" || lang === "es" ? lang : "tr", {
    path: "/",
    sameSite: "lax",
  });
  redirect("/");
}

export default function LanguagePage() {
  return (
    <PageReveal className="container section-pad">
      <div className="mx-auto max-w-lg">
        <PageHero
          eyebrow="Locale"
          title="Language"
          description="Türkçe / English / Español — preference is stored in a cookie."
        />
        <form action={setLang} className="mt-8 grid gap-3">
          {[
            ["tr", "Türkçe"],
            ["en", "English"],
            ["es", "Español"],
          ].map(([code, label]) => (
            <button
              key={code}
              data-reveal
              name="lang"
              value={code}
              className="rounded-2xl border border-[var(--atr-border)] bg-white px-4 py-3 text-left font-medium transition hover:border-[var(--atr-brand)]"
            >
              {label}
            </button>
          ))}
        </form>
      </div>
    </PageReveal>
  );
}
