import { NextResponse } from "next/server";
import { z } from "zod";
import { ingestAnalyticsBatch } from "@/lib/analytics/store";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  userId: z.string().max(80).optional(),
  userLabel: z.string().max(80).optional(),
  events: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("pageview"),
          path: z.string().max(300),
          at: z.string().optional(),
        }),
        z.object({
          type: z.literal("heartbeat"),
          path: z.string().max(300),
          ms: z.number().int().positive().max(120_000),
          at: z.string().optional(),
        }),
        z.object({
          type: z.literal("click"),
          path: z.string().max(300),
          target: z.string().max(200),
          at: z.string().optional(),
        }),
      ]),
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await ingestAnalyticsBatch(parsed.data);
  return NextResponse.json({ ok: true });
}
