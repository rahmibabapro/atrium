import { redirect } from "next/navigation";

/** Better Auth default verification path → Atrium ID devices UI */
export default async function DeviceRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ user_code?: string }>;
}) {
  const params = await searchParams;
  const qs = params.user_code
    ? `?user_code=${encodeURIComponent(params.user_code)}`
    : "";
  redirect(`/account/devices${qs}`);
}
