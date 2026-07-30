# Atrium ID (Atrium identity)

Advanced account architecture for Atrium. Full research + ADR: `FORK.md`.

## One-line model

**Atrium ID = identity system of record.** Web uses BFF cookies; game clients use tokens; Pulse uses short-lived tickets; site forks are OIDC clients.

## Implementation (v1)

Built on **[Better Auth](https://www.better-auth.com/)** (same patterns as their Next.js + plugin docs):

| Piece | Location |
|---|---|
| Server auth | `src/lib/atriumid/auth.ts` |
| DB (SQLite local / MySQL prod) | `src/lib/atriumid/db.ts` |
| React client | `src/lib/atriumid/auth-client.ts` |
| Catch-all API | `src/app/api/auth/[...all]/route.ts` |
| Game bridge | `src/app/api/atriumid/game/{device-code,token}/route.ts` |
| UI | `/login`, `/register`, `/account`, `/account/devices`, `/login/2fa` |

### Plugins enabled

- `username` — 3–16 `[A-Za-z0-9_]`, normalized lowercase  
- `@better-auth/passkey` — WebAuthn enroll + sign-in  
- `twoFactor` — TOTP step-up  
- `deviceAuthorization` — Game / CLI link (RFC 8628-shaped)  
- `organization` — multi-site memberships (create locked until admin wiring)  
- `nextCookies` — Next.js cookie helper  

### Env

See `.env.example`. Minimum local:

```bash
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
ATRIUM_DB_PATH=./data/atriumid.sqlite
pnpm atriumid:migrate   # creates Better Auth + plugin tables
```

Production: set `ATRIUM_DATABASE_URL=mysql://…` and `ATRIUM_GAME_SECRET` for the trusted game bridge.

### Game link flow

1. Plugin `POST /api/atriumid/game/device-code` with `Authorization: Bearer $ATRIUM_GAME_SECRET` → `{ user_code, device_code, verification_uri }`  
2. Player opens `/account/devices` (or verification URI) while logged in → Approve  
3. Plugin polls `POST /api/atriumid/game/token` until `access_token` (Better Auth session token)

Direct Better Auth paths also work: `/api/auth/device/code`, `/api/auth/device/token`.

## Credential priority

1. Passkeys (WebAuthn) — fastest returning login  
2. Discord / Google (OIDC social) — fastest first visit  
3. Email OTP (passwordless) — same-tab, needs Resend  
4. Password + MFA — fallback  
5. Recovery codes  

## Email + OAuth research (simple stack)

Recommended simple stack (product forks may keep a private ADR):

| Need | Pick |
|---|---|
| Transactional mail | **Resend** (+ React Email); Postmark if inbox issues |
| Social login | **Discord** first (OIDC-style), Google second |
| Protocols | OIDC = who; OAuth 2.1 = what (game/API) |
| Do not use | SMS OTP for Atrium ID |

Next wiring: `sendAuthEmail()` → Better Auth `emailOTP` + `socialProviders.discord`.

## Admin control plane

Staff console at `/admin` (server-gated):

- Roles: `admin` / `moderator` / `user` (Better Auth admin plugin + custom AC)
- Bootstrap: `ATRIUM_ADMIN_USER_IDS=<userId>`
- Site foundation (admin): pages (live/offline/countdown + header/footer), home widgets, theme colors
- Moderation: warn / ban / unban / purge queue + append-only audit log

Staff UI lives under `/admin` in this kit.

## Do / Don’t

| Do | Don’t |
|---|---|
| `HttpOnly` session cookies | JWT in `localStorage` |
| Redis revocation (next) | Unrevocable long JWTs as sessions |
| One `user_id` for web+game | Separate game password |
| Step-up for sensitive actions | Trust “logged in once” forever |

## Site pack knobs

```json
"auth": {
  "passkeys": true,
  "password": true,
  "mfaRequiredForStaff": true,
  "social": ["discord"],
  "sessionIdleDays": 7,
  "allowGameBridge": true
}
```
