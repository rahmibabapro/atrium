# Atrium production image (Next.js standalone output).
# Build:  docker build -t atrium .
# Run:    docker run -p 3000:3000 -e BETTER_AUTH_SECRET=... -e BETTER_AUTH_URL=... atrium

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 atrium

COPY --from=builder /app/public ./public
COPY --from=builder --chown=atrium:nodejs /app/.next/standalone ./
COPY --from=builder --chown=atrium:nodejs /app/.next/static ./.next/static

# SQLite lives here by default; mount a volume in production.
RUN mkdir -p /app/data && chown atrium:nodejs /app/data
VOLUME ["/app/data"]

USER atrium
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
