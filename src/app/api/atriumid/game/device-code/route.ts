import { NextResponse } from "next/server";
import { auth } from "@/lib/atriumid/auth";

/**
 * Trusted game bridge: issue a device code.
 * Protect with ATRIUM_GAME_SECRET (Authorization: Bearer …) in production.
 * Uses Better Auth deviceAuthorization under the hood (RFC 8628-shaped).
 */
export async function POST(req: Request) {
  const secret = process.env.ATRIUM_GAME_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization") || "";
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: { client_id?: string; scope?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const clientId = body.client_id || "game";

  try {
    const data = await auth.api.deviceCode({
      body: {
        client_id: clientId,
        scope: body.scope,
      },
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "device_code_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
