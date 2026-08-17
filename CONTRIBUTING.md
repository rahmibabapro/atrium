# Contributing to Atrium

Thanks for helping improve Atrium. Before writing code, open an issue for substantial
features or architectural changes so the direction can be agreed on first.

## Local development

1. Install Node.js 22 and pnpm 10.
2. Run `pnpm install --frozen-lockfile`.
3. Copy `.env.example` to `.env.local` and set a development-only auth secret.
4. Run `pnpm db:migrate` and `pnpm dev`.

## Change workflow

- Branch from `main` and keep each change focused.
- Add or update tests for behavior changes.
- Do not commit credentials, production data, or `.env` files.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before opening a pull request.
- Explain the user impact and verification steps in the pull request.

Atrium has not selected a redistribution and contribution license yet. Please discuss
code contributions in an issue before investing significant work.

## Security reports

Do not open a public issue for a vulnerability. Follow [the security policy](SECURITY.md)
to report it privately.
