/**
 * Boot-time env validation. Database migration + cache warm-up happen lazily
 * on first data access (src/lib/db getDb / warmSiteOverrides) because this
 * file is also compiled for the Edge runtime, where native drivers can't load.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Skip during `next build` — no runtime env/database exists yet.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { validateEnv } = await import("@/lib/env");
  validateEnv();
}
