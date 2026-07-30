import { NextResponse } from "next/server";
import { auth } from "@/lib/atriumid/auth";

/**
 * Game bridge: poll device_code → session access_token.
 * Same secret gate as /api/atriumid/game/device-code when ATRIUM_GAME_SECRET is set.
 */
export async function POST(req: Request) {
  const secret = process.env.ATRIUM_GAME_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization") || "";
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: {
    device_code?: string;
    client_id?: string;
    grant_type?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.device_code) {
    return NextResponse.json({ error: "device_code_required" }, { status: 400 });
  }

  try {
    const data = await auth.api.deviceToken({
      body: {
        grant_type: "urn:ietf:params:oauth:grant-type:device_code" as const,
        device_code: body.device_code,
        client_id: body.client_id || "game",
      },
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_failed";
    // Better Auth uses error payloads for pending/slow_down — surface as 400 JSON
    return NextResponse.json(
      typeof err === "object" && err !== null && "body" in err
        ? (err as { body: unknown }).body
        : { error: message },
      { status: 400 },
    );
  }
}
