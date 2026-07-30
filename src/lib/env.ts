import { z } from "zod";

/**
 * Server environment contract. Validated once at boot (see src/instrumentation.ts)
 * so a misconfigured container fails fast instead of crashing on first request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BETTER_AUTH_SECRET: z.string().min(16).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  ATRIUM_DB_PATH: z.string().min(1).optional(),
  ATRIUM_DATABASE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  ATRIUM_ADMIN_USER_IDS: z.string().optional(),
  ATRIUM_GAME_SECRET: z.string().min(16).optional(),
  ATRIUM_SMTP_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  ATRIUM_EMAIL_FROM: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    if (!env.BETTER_AUTH_SECRET) {
      throw new Error(
        "BETTER_AUTH_SECRET is required in production (openssl rand -base64 32).",
      );
    }
    if (!env.BETTER_AUTH_URL) {
      throw new Error(
        "BETTER_AUTH_URL is required in production (public origin, e.g. https://example.com).",
      );
    }
  }
  return env;
}
