import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/auth/AuthForms";
import { getServerSession } from "@/lib/atriumid/session";
import { atriumIdDriver } from "@/lib/atriumid/auth";
import { hasStaffRole } from "@/lib/atriumid/permissions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?redirect=/account");
  }

  const user = session.user as typeof session.user & {
    username?: string | null;
    role?: string | null;
  };
  const bootstrap = (process.env.ATRIUM_ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const staff = bootstrap.includes(user.id) || hasStaffRole(user.role);

  return (
    <div className="container flex flex-col items-center gap-6 py-16">
      <AccountPanel
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
        }}
      />
      {staff ? (
        <Link href="/admin" className="btn btn-primary">
          Open admin console
        </Link>
      ) : null}
      <p className="text-xs text-[var(--atr-muted)]">
        Atrium ID driver: {atriumIdDriver()} · sessions via HttpOnly cookies
      </p>
    </div>
  );
}
