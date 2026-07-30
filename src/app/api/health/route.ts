import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Container / load-balancer health probe. */
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
