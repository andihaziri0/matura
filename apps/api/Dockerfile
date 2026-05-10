# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile for apps/api (NestJS).
#
# Designed for Railway, but portable to any container host (Fly.io, Render,
# Cloud Run, etc.). Build context MUST be the monorepo root.
#
# Boot sequence in the runtime container:
#   1. `prisma migrate deploy` applies any pending migrations.
#   2. `node dist/main.js` starts the API.
#
# If migrations fail, the API does not start. This is the right failure mode at
# single-instance scale (no half-migrated runtime). See ADR-0010.

# ============================================================
# Base image
# ============================================================
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NODE_OPTIONS=--enable-source-maps

# OpenSSL: required by Prisma's query engine.
# libc6-compat: lets Prisma's prebuilt binaries run on Alpine.
RUN apk add --no-cache openssl libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate

# ============================================================
# Builder — installs deps, builds shared / db / api in order
# ============================================================
FROM base AS builder
WORKDIR /repo

# Workspace manifests + tooling configs first, for cacheable dep installs.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/

# Install only the API and its workspace deps. Skips apps/web, packages/sdk,
# packages/ui — none of them are needed to run the backend.
RUN pnpm install --frozen-lockfile \
      --filter @matura/api... \
      --filter @matura/shared \
      --filter @matura/db

# Source.
COPY apps/api/src ./apps/api/src
COPY packages/shared/src ./packages/shared/src
COPY packages/db/src ./packages/db/src
COPY packages/db/prisma ./packages/db/prisma

# Build order matters:
#   1. Generate Prisma client (consumed by @matura/db's TS build via @prisma/client types).
#   2. Build @matura/shared (no deps on the others).
#   3. Build @matura/db (depends on the generated Prisma client).
#   4. Build @matura/api (Nest; depends on shared + db).
RUN pnpm --filter @matura/db db:generate \
 && pnpm --filter @matura/shared build \
 && pnpm --filter @matura/db build \
 && pnpm --filter @matura/api build

# ============================================================
# Runtime — keeps full workspace. Image is bigger than a `pnpm deploy --prod`
# trim would produce (~+150MB), but the result is dead simple: pnpm + the
# Prisma CLI are both available, workspace package linkage is exactly as built,
# and any transitive runtime dep is guaranteed present. Worth the trade at
# four-contributor scale; revisit if image size becomes a deploy-speed problem.
# ============================================================
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo /app

WORKDIR /app/apps/api
EXPOSE 4000

# Apply pending migrations, then start the compiled Nest app.
# Both `pnpm` and the Prisma CLI live in the workspace's hoisted node_modules.
CMD ["sh", "-c", "pnpm --filter @matura/db db:migrate:deploy && node dist/main.js"]
