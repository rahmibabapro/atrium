import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeviceLinkForm } from "@/components/auth/AuthForms";
import { getServerSession } from "@/lib/atriumid/session";

export const metadata: Metadata = { title: "Link game client" };

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ user_code?: string }>;
}) {
  const session = await getServerSession();
  const params = await searchParams;
  const userCode = params.user_code || "";

  if (!session) {
    const back = userCode
      ? `/account/devices?user_code=${encodeURIComponent(userCode)}`
      : "/account/devices";
    redirect(`/login?redirect=${encodeURIComponent(back)}`);
  }

  return (
    <div className="container flex justify-center py-16">
      <DeviceLinkForm initialCode={userCode} />
    </div>
  );
}
