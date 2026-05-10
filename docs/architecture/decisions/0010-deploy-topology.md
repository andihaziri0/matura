# ADR-0010: Production deploy topology

- **Status**: Accepted
- **Date**: 2026-05-10
- **Deciders**: Andi

## Context

The MVP scaffold milestone is done and the app runs end-to-end locally. To onboard the four owners onto a real environment (and then a small group of beta students), we need a production deploy. ADRs 0001–0009 already named the prod targets in passing (Vercel, Railway, Neon, Cloudflare R2, Upstash, Firebase). This ADR locks in the full topology, the env strategy, the secret-management story, and the domain layout — so that subsequent deploy work is mechanical rather than design.

Out-of-scope explicitly: load testing, multi-region, on-call, SLOs. Per `docs/product/scope.md` we ship single-region, best-effort.

## Decision

### Hosting

| Concern | Provider | Region | Tier (initial) |
|---|---|---|---|
| Web (`apps/web`, Next.js 15) | **Vercel** | Frankfurt (`fra1`) | Hobby/Pro |
| API (`apps/api`, NestJS 11) | **Railway** | `europe-west4` (Amsterdam) | Hobby |
| Postgres + pgvector | **Neon** | `eu-central-1` (Frankfurt) | Launch (paid, no scale-to-zero) |
| Object storage | **Cloudflare R2** | auto / `WEUR` | pay-as-you-go |
| Redis (cache + BullMQ broker) | **Upstash** | `eu-central-1` | Pay-as-you-go |
| Auth identity | **Firebase Auth** | `europe-west` | Spark (free) |
| Error tracking | **Sentry** | EU data region | Developer (free) |

Region rationale: every hop stays in Frankfurt / Amsterdam. Closest to Kosovo, lowest p95 to students, and Neon eu-central-1 is the same region as Upstash so DB↔Redis is intra-region.

### Environments

**Two effective environments** at MVP:

1. **production** — single long-lived environment on the providers above.
2. **preview** — per-PR ephemeral previews:
   - Vercel auto-creates a preview deployment per PR for `apps/web`.
   - Neon auto-creates a branch DB per PR (matches ADR-0003).
   - Previews point at a **shared preview Railway service** (one persistent non-prod API), not a per-PR API. This keeps Railway costs flat; the preview API connects to whichever Neon branch the PR uses via dynamic env.

We do **not** run a third "staging" environment. The cost of keeping prod and staging in sync exceeds the value at four contributors and zero external users.

### Secrets

- **Local dev**: `.env` files (already gitignored). `.env.example` documents shape.
- **Local prod-like testing**: `.env.production.local` (gitignored, never committed). Used only when running `pnpm --filter @matura/api start:prod` against real prod creds for debugging.
- **Production**: secrets live in **Railway** (api) and **Vercel** (web) dashboards. No secret-manager layer (Doppler, 1Password Secrets, etc.) at this scale — adds operational surface without commensurate value.
- **Rotation policy**: rotate any secret immediately on suspected exposure (chat logs, screenshots, ex-contributor revocation). Document last rotation date in the runbook.

### Domain & DNS

Root domain `akademiaas.com` is owned by the course. Subdomains for this app:

| Subdomain | Points to | Purpose |
|---|---|---|
| `matura.akademiaas.com` | Vercel | student + admin web app |
| `api.matura.akademiaas.com` | Railway | NestJS API |

Vercel preview deployments use their auto-assigned `*.vercel.app` URLs. The shared preview API uses its `*.up.railway.app` URL. No custom subdomain for previews.

### Build & deploy pipeline

- **Source of truth**: `main` branch on GitHub.
- **CI (every PR)** via GitHub Actions:
  - `pnpm install`
  - `pnpm lint`
  - `pnpm typecheck` (added in this milestone if not present)
  - `pnpm --filter @matura/db prisma validate`
  - **OpenAPI drift check**: regenerate the SDK and fail if `packages/sdk/src/generated/` differs from committed.
- **CD (merge to `main`)**:
  - **Vercel**: auto-deploys `apps/web` via its GitHub integration. Build command: `turbo run build --filter=@matura/web...`. Root: repo root.
  - **Railway**: auto-deploys `apps/api` via its GitHub integration. Build via Dockerfile (`apps/api/Dockerfile`). On boot: `prisma migrate deploy` runs before `node dist/main.js`.
- **Migrations**: `prisma migrate deploy` is part of the API container's start command. There is no separate "migrate" step. This is acceptable at one-API-instance scale; revisit if we move to multi-instance.

### Observability

- **Health**: existing `/health/live` and `/health/ready` endpoints. Railway pings `/health/ready` for deploy gating. An external uptime monitor (UptimeRobot free tier) pings the same endpoint every 5 min.
- **Errors**: **Sentry** in both apps, EU data region, separate projects for `apps/web` and `apps/api`. Source maps uploaded on build.
- **Logs**: provider-native (Vercel logs + Railway logs). No log aggregator at MVP.
- **Metrics**: only the existing internal `/admin/metrics` endpoints. No external metrics export at MVP.

### Boot order on a fresh deploy

1. Neon DB exists (provisioned out-of-band).
2. Railway boots API container → runs `prisma migrate deploy` → starts Nest → `/health/ready` returns 200 once DB connection is open.
3. Vercel deploys web → talks to `https://api.matura.akademiaas.com`.
4. Firebase prod project authorized domains include `matura.akademiaas.com` (and the Vercel preview wildcard during dev).

## Consequences

### Positive

- **Lowest reasonable monthly cost** (~$0–$30/month) while we still have <50 users: most providers used here have free tiers covering MVP traffic.
- **One-region setup** keeps latency low for Kosovo and avoids any data-residency complications.
- **Per-PR preview** flow means contributors can show owners a real URL before merging, without paying for a persistent staging.
- **Dockerfile-based API deploy** keeps us portable: if Railway becomes a problem, `apps/api/Dockerfile` runs anywhere (Fly.io, Render, ECS, etc.) without rewrites.

### Negative

- **No persistent staging** — a bad migration on `main` hits production. Mitigated by: per-PR Neon branch (lets us test the migration on real-shaped data before merge) + small user count.
- **Migrations on container boot** — if `prisma migrate deploy` fails on startup, the API doesn't come up. We accept this; it's the right failure mode (no half-migrated runtime) at single-instance scale.
- **Provider lock-in** — Vercel-specific build config and Railway-specific env wiring. Mitigated by keeping all platform config in plain files (`vercel.json`, `railway.toml`, `Dockerfile`) so re-platforming is mechanical.
- **No staging Firebase project for previews** — previews authenticate against the prod Firebase project. Acceptable because previews are URL-gated, not publicly linked.

## Alternatives considered

- **Vercel for both web and API** (Next.js API routes / Vercel-hosted Nest). Rejected: ADR-0002 explicitly keeps the API as a separate NestJS service. Folding it into Vercel would invalidate that decision and complicate the future Expo client.
- **Fly.io instead of Railway**. Strong alternative — better region control, more predictable pricing at scale. Rejected for MVP because Railway's PR-based GitHub integration is simpler for three student contributors. Re-evaluate if API egress or cold-start becomes painful.
- **Render instead of Railway**. Comparable. Rejected for the same simplicity reason.
- **Persistent staging environment**. Rejected on cost/maintenance grounds at four-contributor scale (see "Environments" above).
- **Doppler / 1Password Secrets for centralized secret management**. Rejected as premature; Vercel + Railway native secrets cover the MVP surface.

## When to revisit

Open a new ADR superseding this one if any of:

- We have >100 active students or any paying user (revisit staging, observability, Neon plan).
- A second deployable surface ships (Expo mobile, separate worker process) — worker placement is a deferred decision per ADR-0006.
- Latency from Kosovo to the API exceeds ~150ms p95 — revisit region / edge runtime.
- A migration causes a >5min prod outage — revisit the boot-time migration strategy.
- Costs exceed ~$100/month — revisit provider mix.

## Operational notes

- The full step-by-step provisioning runbook lives in `docs/operations/deploy.md` (created in the next phase of this milestone).
- All credentials shared in chat or commits **must be rotated immediately**. There is no exception. Document each rotation date in the runbook's "Rotation log" section.
