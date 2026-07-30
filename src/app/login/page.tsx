import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms";
import { getServerSession } from "@/lib/atriumid/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; next?: string }>;
}) {
  const session = await getServerSession();
  const params = await searchParams;
  const next = params.redirect || params.next || "/account";

  if (session) {
    redirect(next.startsWith("/") ? next : "/account");
  }

  const socialProviders = [
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? "discord"
      : null,
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? "google"
      : null,
  ].filter((p): p is string => Boolean(p));

  return (
    <div className="container flex justify-center py-16">
      <LoginForm
        next={next.startsWith("/") ? next : "/account"}
        socialProviders={socialProviders}
      />
    </div>
  );
}
