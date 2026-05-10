# Project status

_Last updated: 2026-05-10 (evening — prod web on custom domain)_
_Current milestone: **Production deploy** — core path **live**; polish & hardening remain_
_Exam target window: June each year (Kosovo Testi i Maturës)_

## Legend

- `[x]` done and merged
- `[~]` in progress (owner)
- `[ ]` not started
- `[!]` blocked (with reason)

The same information lives in [`.agent/state.yaml`](../.agent/state.yaml) for tooling. Keep both in sync.

---

## Milestone: MVP scaffold

The goal of this milestone is a runnable repo with one end-to-end feature (Matematikë practice on seeded questions) and the agent-legible spine.

### Phase 1 — Agent spine & docs

- [x] `AGENTS.md`, `README.md`, `docs/status.md`, `.agent/state.yaml`
- [x] `docs/product/{vision,personas,scope}.md`
- [x] `docs/architecture/{overview,stack,data-model}.md`
- [x] ADRs 0001 through 0009

### Phase 2 — Monorepo skeleton

- [x] `pnpm-workspace.yaml`, `turbo.json`, root `package.json`
- [x] Tooling: `.nvmrc`, `.editorconfig`, `.gitignore`, `.env.example`, `tsconfig.base.json`
- [x] Shared ESLint + Prettier config

### Phase 3 — Local dev infra

- [x] `docker-compose.yml`: Postgres 16 + pgvector, Redis 7, MinIO
- [x] MinIO bootstrap creates `matura-content` bucket (via `minio-init` service)
- [x] `pnpm dev:infra` brings the stack up

### Phase 4 — `packages/db`

- [x] Prisma init + Prisma client export
- [x] `schema.prisma` with all v1 models + pgvector
- [~] First migration applied locally (run `pnpm db:migrate` after `pnpm dev:infra`)
- [x] Seed harness (subjects + questions stub)

### Phase 5 — `packages/shared`

- [x] Zod schemas mirroring Prisma models
- [x] Matematikë taxonomy (`taxonomy/matematike.ts`)
- [x] Albanian i18n keys (`i18n/sq.ts`)
- [x] Shared enums (role, track, kind, status)

### Phase 6 — `apps/api` shell

- [x] NestJS bootstrap, ConfigModule with env validation (Zod)
- [x] PrismaModule (global)
- [x] FirebaseAuthGuard + `@CurrentUser()` decorator (auto-provisions User)
- [x] RolesGuard + `@Roles()` + `@Public()` decorators
- [x] OpenAPI / Swagger at `/docs` + `pnpm openapi:generate`
- [x] Health module (`live`, `ready`)
- [x] Module shells filled: users, subjects, questions, attempts, sessions, media, content (importer cli), ai (empty), admin (metrics)
- [x] **Hard approval gate** — review the API shell before phase 7 (web)

### Phase 7 — `apps/web` shell

- [x] Next.js + Tailwind v4 bootstrap
- [x] Firebase Web SDK + `<AuthProvider />` + `useAuth` hook
- [x] Route groups `(marketing)`, `(app)`, `(admin)` with layouts
- [x] Owner-role guard on `(admin)`
- [x] Shared `<Markdown />` (Markdown + KaTeX) in `@matura/ui`
- [x] Sign-in / sign-up pages
- [x] Admin home + metrics page

### Phase 8 — `packages/sdk`

- [x] `openapi-typescript` + `openapi-fetch` configured
- [x] Turbo task pipeline: `api#openapi:generate` → `sdk#sdk:build`
- [x] Typed `createApiClient()` that injects Firebase ID token
- [~] Web consumes SDK (admin pages still use raw fetch; migrate after first `pnpm openapi:generate`)

### Phase 9 — Questions feature (E2E slice)

- [x] API: `QuestionsModule` with list/create/update/publish/delete
- [x] API: presigned R2 upload endpoint for question images (`/api/media/presign-image`)
- [x] Web: `/admin/questions` list
- [x] Web: `/admin/questions/new` and `/admin/questions/[id]` editor with live KaTeX preview + image upload
- [x] Owner-only access enforced both sides (`@Roles('OWNER')` + admin layout guard)
- [x] `docs/features/questions.md`

### Phase 10 — Seed content

- [x] `content/seed/math/questions.json` with 50 questions
- [x] Spread: 33 MCQ / 15 SHORT / 2 LONG; difficulty 4×1 / 19×2 / 22×3 / 5×4
- [x] `pnpm seed:questions` upserts idempotently by stable external id
- [x] Bulk import: `content/seed/math/akademiaas-bank.json` — 515 MCQs from the AkademiaAS authoring tool (485 PUBLISHED, 30 DRAFT marked `requires-figure` until images land in R2). Loader prefers the hand-curated `questions.json` on duplicate `externalId`. Build script: `scripts/akademiaas-bank/build-seed.mjs` (re-run when AkademiaAS exports a refreshed bank). Distribution: 20 topicPaths covering aritmetikë, algjebër, trigonometri, gjeometri, vargje, analizë, kombinatorikë, statistikë, gjeometri analitike, matrica
- [x] First seed of prod Neon DB on 2026-05-10: 565 questions upserted, smoke-tested via `/practice/matematike` on Vercel

### Phase 11 — Content importer stub

- [x] `apps/api/src/modules/content/importers/adapter.ts` pluggable adapter interface
- [x] `apps/api/src/modules/content/importers/legacy-json.ts` adapter (passthrough stub)
- [x] CLI command `pnpm content:import` (boots Nest standalone context)
- [x] Reads `content/raw/math/json` + `content/raw/math/png`
- [x] Uploads images to R2/MinIO via `S3Service.putObjectFromFile`, writes Questions as `DRAFT`
- [x] `docs/features/content-import.md` with adapter extension guide
- [~] `mapLegacyQuestion` in API CLI still generic; bulk Matematikë content ships via `akademiaas-bank.json` + `build-seed.mjs` (real shape now in repo)

### Phase 12 — First practice flow

- [x] API: `POST /api/sessions/practice` returns N random PUBLISHED Matematikë questions (sanitised)
- [x] API: `POST /api/attempts` records answers and returns canonical answer + explanation
- [x] API: `POST /api/sessions/:id/end` returns score + per-topic breakdown
- [x] Web: `/practice/matematike` renders with KaTeX, instant feedback
- [x] Web: summary screen with per-question correctness + explanation
- [x] `docs/features/practice.md`
- [x] Update `AGENTS.md` + this file + `.agent/state.yaml`

---

## Milestone status: MVP scaffold — **DONE**

Everything in this milestone ships end-to-end locally. The next milestone is
**Production deploy** (below). After that, the v1 milestone (adaptive
practice + AI tutor) gets its own plan when its turn arrives.

---

## Milestone: Production deploy

The goal of this milestone is a real `https://matura.akademiaas.com` reachable
from Kosovo, with `apps/api` deployed to Railway, `apps/web` deployed to Vercel,
Postgres on Neon, Redis on Upstash, files on Cloudflare R2, and Firebase Auth
in a dedicated prod project. CI/CD on every PR. Sentry on both apps.

Topology, decisions, and rejected alternatives are locked in
[ADR-0010](architecture/decisions/0010-deploy-topology.md).

### Phase D1 — Plan & decisions

- [x] ADR-0010 (deploy topology)
- [x] Add this milestone to `docs/status.md` and `.agent/state.yaml`
- [x] Owner reviewed the plan (implicit "please continue" 2026-05-10)

### Phase D2 — API container & Railway config

- [x] `apps/api/Dockerfile` (multi-stage: base → builder → runtime)
- [x] `.dockerignore` at repo root (build context is the monorepo root)
- [x] API start command runs `prisma migrate deploy` before `node dist/main.js`
- [x] Health check endpoint wired into Railway (`/api/health/ready`)
- [~] Local smoke: `docker build` + `docker run` — **deferred**, owner has no Docker locally; will be exercised when Railway runs the first build in Phase D7
- [x] `apps/api/railway.toml` with build + deploy config
- [x] Production env validation (Zod) accepts Neon pooled URL with `sslmode=require&channel_binding=require`
- [x] CORS allowlist driven by `WEB_ORIGIN` (comma-separated, supports wildcards like `https://*.vercel.app`)
- [x] Bonus: `PORT` env (Railway/Heroku convention) auto-falls-back into `API_PORT` so platform port detection just works

### Phase D3 — Web on Vercel

- [x] `apps/web/vercel.json` with monorepo build command (`turbo run build --filter=@matura/web...`) and security headers
- [x] Pin serverless functions to `fra1` (Frankfurt)
- [x] `next.config.mjs` updated: image `remotePatterns` now includes `**.r2.dev` for Cloudflare R2 public URLs
- [x] **Build chain verified locally**: `turbo run build --filter=@matura/web...` produces a clean `.next` (3 tasks, ~16s)
- [x] Bonus: `@matura/sdk` now has a regular `build` script (aliases `sdk:build`) so turbo's normal cascade picks it up — no special-case install-then-codegen-then-build dance for Vercel
- [x] **Custom domain live**: `https://matura.akademiaas.com` — DNS on Cloudflare (`matura` → Vercel project CNAME, **DNS only** / gray cloud so Vercel validates; avoid orange-cloud proxy until deliberately re-tested)
- [x] `NEXT_PUBLIC_API_URL` points at Railway API hostname (see Phase D7); app + practice verified from custom domain
- [~] `NEXT_PUBLIC_*` env schema validation — deferred; current `?? ''` fallbacks are sufficient for MVP
- [~] Dedicated **Firebase prod** project vs dev keys — still follow runbook Section 2 when cutting over; current prod smoke uses configured Firebase project
- [x] Document Vercel project settings (Root Directory, Node version) in the runbook — Phase D4

### Phase D4 — Provisioning runbook & secrets

- [x] `docs/operations/deploy.md` — full step-by-step runbook
- [x] `.env.production.example` documenting prod env shape (no secrets, just keys)
- [ ] **Owner action**: Rotate Neon password and Upstash Redis token (Section 0 in runbook)
- [ ] **Owner action**: Provision Cloudflare R2 bucket (`matura-content` in WEUR) + access keys (Section 1)
- [ ] **Owner action**: Provision Firebase **prod** project + web config + service account JSON (Section 2)
- [~] **Owner action**: Add branch protection on `main` (Section 3) — **deferred** to post-D7. Will be set up after first deploy succeeds, when the CI status check name is known and stable.
- [x] **Owner action**: Vercel project linked to GitHub, env vars set, custom domain **`matura.akademiaas.com`** connected (2026-05-10)
- [x] **Owner action**: Railway API service live, env vars set; **`WEB_ORIGIN`** includes `https://matura.akademiaas.com` for CORS (2026-05-10)
- [ ] **Owner action**: Verify Neon `pgvector` extension is enabled (Section 6) — still confirm in Neon SQL console
- [x] DNS: **`matura.akademiaas.com`** on Cloudflare → Vercel (2026-05-10)
- [ ] DNS (optional): **`api.matura.akademiaas.com`** on Railway — deferred; API reachable via default `*.up.railway.app` URL (no perf concern)
- [ ] **Owner action**: Cloudflare R2 prod bucket + keys per runbook if not already wired to Railway

### Phase D5 — CI/CD via GitHub Actions

- [x] `.github/workflows/ci.yml`: install + lint + typecheck + `prisma validate` + migration apply + OpenAPI drift check on every PR + push to `main`
- [x] CI uses a `pgvector/pgvector:pg16` service container (matches local docker-compose); no Redis needed because BullMQ isn't imported yet
- [x] Concurrency control: in-progress runs cancel when a new commit lands on the same branch
- [x] Drift check fails the build if `pnpm openapi:generate` produces a different `packages/sdk/openapi.json` than what's committed
- [x] **Owner action**: Vercel auto-deploy on `main` (assumed active — prod deploys track `main`)
- [x] **Owner action**: Railway auto-deploy on `main` (assumed active — API live)
- [ ] **Owner action**: install the Neon GitHub integration so PRs get auto-branched DBs (Section 4.10 — to be added to runbook before first PR after deploy)
- [ ] **Owner action**: in GitHub branch protection settings (Section 3), require the CI status check `lint + typecheck + prisma validate + openapi drift` to pass before merge

### Phase D6 — Observability

- [x] `@sentry/nestjs` (10.52.0) integrated in `apps/api` (`SentryModule.forRoot()`, `SentryGlobalFilter`, `instrument.ts` loaded first)
- [x] `@sentry/nextjs` (10.52.0) integrated in `apps/web` (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `withSentryConfig` wrap)
- [x] All Sentry init is **env-gated**: with no DSN the SDK is a no-op (no overhead in dev/CI)
- [x] Conservative defaults: `tracesSampleRate: 0.1`, `sendDefaultPii: false`, no Replay (no consent UI yet)
- [x] Source-map upload wired via `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` (build-time only, optional)
- [x] **Build verified**: api typechecks + builds, web builds (181 kB First Load JS, +~80 kB from Sentry — acceptable)
- [x] `.env.example`, `.env.production.example`, runbook Section 8 all updated
- [ ] **Owner action**: create Sentry org (EU region), 2 projects (`matura-api`, `matura-web`), paste DSNs into Railway + Vercel (Section 8)
- [ ] **Owner action**: UptimeRobot monitor on `/api/health/ready` every 5 min (Section 8)
- [ ] Operations runbook for "how to read logs / roll back / roll forward bad migration" — TBD, append to `deploy.md` after first real deploy when we know the actual procedure

### Phase D7 — First real deploy & smoke test

- [x] Deploy API → `/api/health/ready` returns 200 in prod (Railway)
- [x] Deploy web → reachable at **`https://matura.akademiaas.com`**; auth + API calls working (CORS + `NEXT_PUBLIC_API_URL`)
- [ ] Owner creates one prod question end-to-end (image upload → publish via R2) — still a good checklist item
- [x] Practice session against prod (`/practice/matematike`) — verified with 565 seeded questions (2026-05-10)
- [~] Update `docs/status.md` + `.agent/state.yaml` — this revision (2026-05-10); **milestone not fully closed** until credential rotation, optional `api.matura`, Sentry/Uptime, dedicated Firebase prod decision

### Production snapshot (2026-05-10)

| Layer | Status |
|-------|--------|
| Web | `https://matura.akademiaas.com` (Vercel, Cloudflare DNS) |
| API | Railway default hostname (HTTPS); custom **`api.matura`** not required for launch |
| DB | Neon `neondb` (EU); 565 Matematikë questions seeded |
| Redis | Upstash (per Railway env) |
| DNS zone | `akademiaas.com` on Cloudflare (domain active) |

---


## Future milestones (NOT in scope of current work)

These exist only so contributors don't accidentally start them. Each becomes its own plan when its turn arrives.

- **v1**: adaptive practice (SRS / IRT-lite), AI tutor (Albanian), readiness score, study-plan generator, leaderboards, full past-papers archive.
- **v2**: teacher / parent dashboards, native mobile (Expo), offline mode, monetization (freemium).

## Open decisions

- None right now. All decisions are logged as ADRs 0001–0010.

## Known issues

- **Security debt** (deferred by owner 2026-05-10): Neon DB password and Upstash Redis token were exposed in agent chat on 2026-05-10. Owner chose to ship the first deploy with the exposed creds and rotate immediately after Phase D7 succeeds. Treat both as compromised until rotation is confirmed in `docs/operations/deploy.md` Rotation log.
- **Prod domain**: Ensure Firebase **Authorized domains** includes `matura.akademiaas.com` if sign-in failed before adding it.
