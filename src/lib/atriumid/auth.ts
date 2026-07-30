import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import {
  username,
  twoFactor,
  deviceAuthorization,
  organization,
  admin,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { createAtriumIdDatabase, isPostgres } from "./db";
import { ac, roles } from "./permissions";
import { config as siteConfig } from "@/lib/content";

const database = createAtriumIdDatabase();
const authConfig = (siteConfig as { auth?: Record<string, unknown> }).auth || {};
const idleDays = Number(authConfig.sessionIdleDays ?? 7);

const bootstrapIds = (process.env.ATRIUM_ADMIN_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Atrium ID — Atrium identity core (Better Auth + advanced plugins).
 * Admin plugin: ban/roles/list — see permissions.ts for RBAC.
 */
export const auth = betterAuth({
  appName: siteConfig.brand || "Atrium ID",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database,
  emailAndPassword: {
    enabled: authConfig.password !== false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: idleDays * 60 * 60 * 24,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: (process.env.BETTER_AUTH_URL || "").startsWith("https://"),
    cookiePrefix: "atriumid",
  },
  user: {
    additionalFields: {
      mcUuid: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 16,
      usernameValidator: (value) => /^[A-Za-z0-9_]+$/.test(value),
      usernameNormalization: (value) => value.toLowerCase(),
    }),
    passkey({
      rpID:
        process.env.ATRIUM_RP_ID ||
        (process.env.BETTER_AUTH_URL
          ? new URL(process.env.BETTER_AUTH_URL).hostname
          : "localhost"),
      rpName: siteConfig.brand || "Atrium ID",
    }),
    twoFactor({
      issuer: siteConfig.brand || "Atrium ID",
    }),
    deviceAuthorization({
      expiresIn: "10m",
      interval: "5s",
      verificationUri: "/account/devices",
      validateClient: async (clientId) =>
        ["game", "atrium-web", "pulse", "atrium"].includes(clientId),
    }),
    organization({
      allowUserToCreateOrganization: false,
    }),
    admin({
      ac,
      roles,
      defaultRole: "user",
      adminUserIds: bootstrapIds,
      defaultBanReason: "Community guidelines violation",
      bannedUserMessage:
        "Your Atrium ID is suspended. Contact support if you believe this is a mistake.",
      impersonationSessionDuration: 60 * 30,
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

export function atriumIdDriver(): "postgres" | "sqlite" {
  return isPostgres(database) ? "postgres" : "sqlite";
}
