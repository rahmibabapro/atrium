import type { UserStatsTable } from "@/lib/db/schema";

/**
 * Discourse-inspired trust levels, kept deliberately small:
 *   0 new      — just registered; tight rate limits, no links
 *   1 member   — a couple of days + a few posts
 *   2 regular  — weeks of participation + community validation
 * Staff bypass limits entirely.
 */
export type TrustLevel = 0 | 1 | 2;

export type TrustLimits = {
  level: TrustLevel;
  label: string;
  threadsPerDay: number;
  repliesPerDay: number;
  allowLinks: boolean;
  editWindowMs: number | null;
};

const LIMITS: Record<TrustLevel, TrustLimits> = {
  0: {
    level: 0,
    label: "new",
    threadsPerDay: 2,
    repliesPerDay: 8,
    allowLinks: false,
    editWindowMs: 60 * 60 * 1000,
  },
  1: {
    level: 1,
    label: "member",
    threadsPerDay: 10,
    repliesPerDay: 60,
    allowLinks: true,
    editWindowMs: 24 * 60 * 60 * 1000,
  },
  2: {
    level: 2,
    label: "regular",
    threadsPerDay: 30,
    repliesPerDay: 200,
    allowLinks: true,
    editWindowMs: null,
  },
};

export function computeTrustLevel(input: {
  accountCreatedAt: Date | string | null | undefined;
  stats: Pick<UserStatsTable, "post_count" | "reactions_received"> | null;
}): TrustLevel {
  const created = input.accountCreatedAt
    ? new Date(input.accountCreatedAt).getTime()
    : Date.now();
  const ageDays = (Date.now() - created) / 86_400_000;
  const posts = input.stats?.post_count ?? 0;
  const reactions = input.stats?.reactions_received ?? 0;

  if (ageDays >= 14 && posts >= 20 && reactions >= 10) return 2;
  if (ageDays >= 2 && posts >= 3) return 1;
  return 0;
}

export function trustLimits(level: TrustLevel): TrustLimits {
  return LIMITS[level];
}
