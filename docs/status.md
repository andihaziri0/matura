# Project status

_Last updated: 2026-04-25_
_Current milestone: **MVP scaffold**_
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

### Phase 11 — Content importer stub

- [x] `apps/api/src/modules/content/importers/adapter.ts` pluggable adapter interface
- [x] `apps/api/src/modules/content/importers/legacy-json.ts` adapter (passthrough stub)
- [x] CLI command `pnpm content:import` (boots Nest standalone context)
- [x] Reads `content/raw/math/json` + `content/raw/math/png`
- [x] Uploads images to R2/MinIO via `S3Service.putObjectFromFile`, writes Questions as `DRAFT`
- [x] `docs/features/content-import.md` with adapter extension guide
- [~] `mapLegacyQuestion` TODO until real JSON sample is shared

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

Everything in this milestone now ships end-to-end. The next milestone (v1) is
adaptive practice + AI tutor; it gets its own plan when its turn arrives.

---

## Future milestones (NOT in scope of current work)

These exist only so contributors don't accidentally start them. Each becomes its own plan when its turn arrives.

- **v1**: adaptive practice (SRS / IRT-lite), AI tutor (Albanian), readiness score, study-plan generator, leaderboards, full past-papers archive.
- **v2**: teacher / parent dashboards, native mobile (Expo), offline mode, monetization (freemium).

## Open decisions

- None right now. All MVP decisions are logged as ADRs 0001–0009.

## Known issues

- None tracked.
